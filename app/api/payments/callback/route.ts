/**
 * ioTec Pay collection callback (webhook)
 *
 * Register this URL in the ioTec Pay portal:
 *   Wallet → Settings → Callback URLs → Collection
 *   URL: https://<your-domain>/api/payments/callback
 *
 * ioTec POSTs JSON whenever a collection status changes to
 * Success, Failed, or SentToVendor.
 *
 * Security:
 *   Set IOTEC_WEBHOOK_SECRET in Vercel env vars.
 *   In the portal, configure the same value as the callback secret.
 *   ioTec sends it as:  X-Signature: <HMAC-SHA256-hex-of-raw-body>
 *   OR as a bearer token (portal-dependent). Both modes are supported.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payment, user } from '@/lib/db/schema';
import { eq, or } from 'drizzle-orm';
import { fulfillPayment } from '@/app/actions/payments';

// ─── ioTec payload shape ──────────────────────────────────────────────────────
interface IotecCallbackPayload {
  id:             string;          // ioTec transaction UUID
  status:         string;          // 'Pending' | 'SentToVendor' | 'Success' | 'Failed'
  externalId?:    string | null;   // your reference (pay-<timestamp>-<rand>)
  amount?:        number | null;
  currency?:      string | null;
  payer?:         string | null;   // MSISDN that was charged
  statusCode?:    string | null;
  statusMessage?: string | null;
}

// ─── HMAC-SHA256 verification ─────────────────────────────────────────────────
async function verifyHmac(secret: string, rawBody: string, signature: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw',
      encoder.encode(secret),
      { name: 'HMAC', hash: 'SHA-256' },
      false,
      ['verify'],
    );
    // Accept both hex and base64 encoded signatures
    let sigBytes: Uint8Array;
    if (/^[0-9a-f]{64}$/i.test(signature)) {
      // Hex
      sigBytes = new Uint8Array(signature.match(/../g)!.map(b => parseInt(b, 16)));
    } else {
      // Base64
      sigBytes = Uint8Array.from(atob(signature), c => c.charCodeAt(0));
    }
    return await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(rawBody));
  } catch {
    return false;
  }
}

// ─── Map ioTec status strings to our internal set ────────────────────────────
function resolveStatus(raw: string): 'pending' | 'success' | 'failed' {
  switch (raw) {
    case 'Success':       return 'success';
    case 'Failed':        return 'failed';
    case 'Pending':
    case 'SentToVendor':
    default:              return 'pending';
  }
}

// ─── Handler ─────────────────────────────────────────────────────────────────
export async function POST(req: NextRequest) {
  const ts = new Date().toISOString();

  // 1. Read raw body first — needed for HMAC verification
  let rawBody: string;
  try {
    rawBody = await req.text();
  } catch {
    return NextResponse.json({ error: 'Could not read request body' }, { status: 400 });
  }

  // 2. Verify signature / shared secret
  const webhookSecret = process.env.IOTEC_WEBHOOK_SECRET;
  if (webhookSecret) {
    const sigHeader    = req.headers.get('x-signature') ?? req.headers.get('x-iotec-signature');
    const authHeader   = req.headers.get('authorization');

    let verified = false;

    if (sigHeader) {
      // HMAC-SHA256 mode
      verified = await verifyHmac(webhookSecret, rawBody, sigHeader);
    } else if (authHeader) {
      // Bearer token mode (simple shared secret)
      const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : authHeader;
      verified = token === webhookSecret;
    }

    if (!verified) {
      console.warn(`[iotec-callback ${ts}] signature verification failed`);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
  }

  // 3. Parse payload
  let body: IotecCallbackPayload;
  try {
    body = JSON.parse(rawBody);
  } catch {
    console.error(`[iotec-callback ${ts}] invalid JSON`);
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  console.log(`[iotec-callback ${ts}] received:`, JSON.stringify({
    iotecId:    body.id,
    status:     body.status,
    externalId: body.externalId,
    amount:     body.amount,
    payer:      body.payer,
  }));

  if (!body.id) {
    return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
  }

  // 4. Still in-flight — acknowledge and exit early
  const newStatus = resolveStatus(body.status);
  if (newStatus === 'pending') {
    console.log(`[iotec-callback ${ts}] status still pending/sent-to-vendor — acknowledged`);
    return NextResponse.json({ received: true, status: 'pending' });
  }

  // 5. Find our payment row
  //    Try iotecTransactionId first; fall back to externalId for safety
  let paymentRow: typeof import('@/lib/db/schema').payment.$inferSelect | undefined;

  if (body.externalId) {
    const rows = await db.select().from(payment)
      .where(
        or(
          eq(payment.iotecTransactionId, body.id),
          eq(payment.externalId, body.externalId),
        ),
      )
      .limit(1);
    paymentRow = rows[0];
  } else {
    const rows = await db.select().from(payment)
      .where(eq(payment.iotecTransactionId, body.id))
      .limit(1);
    paymentRow = rows[0];
  }

  if (!paymentRow) {
    console.warn(`[iotec-callback ${ts}] no matching payment — iotecId: ${body.id}, externalId: ${body.externalId}`);
    // Acknowledge anyway — prevents ioTec retry storm on genuinely unknown IDs
    return NextResponse.json({ received: true, note: 'No matching payment' });
  }

  // 6. Idempotency guard — skip if already resolved
  if (paymentRow.status !== 'pending') {
    console.log(`[iotec-callback ${ts}] already processed (${paymentRow.status}) — skipping`);
    return NextResponse.json({ received: true, note: 'Already processed', status: paymentRow.status });
  }

  // 7. Persist the new status
  await db.update(payment)
    .set({
      status:              newStatus,
      statusMessage:       body.statusMessage ?? null,
      iotecTransactionId:  body.id,           // ensure saved if this was an externalId lookup
      updatedAt:           new Date(),
    })
    .where(eq(payment.id, paymentRow.id));

  console.log(`[iotec-callback ${ts}] payment ${paymentRow.id} → ${newStatus}`);

  // 8. Fulfill on success
  if (newStatus === 'success') {
    try {
      const [userRow] = await db
        .select({ id: user.id, name: user.name, email: user.email })
        .from(user)
        .where(eq(user.id, paymentRow.userId))
        .limit(1);

      if (!userRow) {
        console.error(`[iotec-callback ${ts}] user ${paymentRow.userId} not found — cannot fulfill`);
      } else {
        await fulfillPayment(
          paymentRow,
          userRow as { id: string; name: string | null; email: string },
        );
        console.log(`[iotec-callback ${ts}] fulfillment complete for payment ${paymentRow.id}`);
      }
    } catch (err) {
      // Log but still return 200 — fulfillment errors should be fixed separately, not retried via webhook
      console.error(`[iotec-callback ${ts}] fulfillment error for payment ${paymentRow.id}:`, err);
    }
  }

  return NextResponse.json({ received: true, status: newStatus });
}

// ─── GET — health check / confirmation that the endpoint is live ──────────────
export async function GET() {
  return NextResponse.json({
    endpoint: '/api/payments/callback',
    method:   'POST',
    purpose:  'ioTec Pay collection webhook',
    status:   'active',
  });
}
