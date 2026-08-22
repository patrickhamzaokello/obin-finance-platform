/**
 * ioTec Pay callback webhook
 * Configure this URL in the ioTec Pay portal → Wallet → Settings → Callback URLs
 * URL: https://your-domain.com/api/payments/callback
 * Category: Collection
 *
 * ioTec POSTs the full CollectionViewModel when status changes to
 * Success, Failed, or SentToVendor.
 */

import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/lib/db';
import { payment, user } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import { fulfillPayment } from '@/app/actions/payments';

export async function POST(req: NextRequest) {
  try {
    // Optional: verify a shared secret header if configured in the ioTec portal
    const webhookSecret = process.env.IOTEC_WEBHOOK_SECRET;
    if (webhookSecret) {
      const incoming = req.headers.get('x-iotec-signature') ?? req.headers.get('authorization');
      if (incoming !== webhookSecret && incoming !== `Bearer ${webhookSecret}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
      }
    }

    const body = await req.json() as {
      id:            string;   // ioTec transaction UUID
      status:        string;   // 'Pending' | 'Success' | 'Failed' | 'SentToVendor'
      externalId?:   string;
      statusMessage?: string;
      amount?:       number;
    };

    console.log('[webhook/iotec] received:', JSON.stringify(body));

    if (!body.id) {
      return NextResponse.json({ error: 'Missing transaction id' }, { status: 400 });
    }

    // Find our payment row by ioTec transaction ID
    const [paymentRow] = await db.select().from(payment)
      .where(eq(payment.iotecTransactionId, body.id))
      .limit(1);

    if (!paymentRow) {
      // Unknown transaction — acknowledge and ignore
      console.warn('[webhook/iotec] no matching payment for iotecId:', body.id);
      return NextResponse.json({ received: true });
    }

    // Already resolved — idempotency guard
    if (paymentRow.status !== 'pending') {
      return NextResponse.json({ received: true, note: 'Already processed' });
    }

    const newStatus = body.status === 'Success' ? 'success'
                    : body.status === 'Failed'  ? 'failed'
                    : 'pending';

    if (newStatus === 'pending') {
      // SentToVendor — still in flight, just acknowledge
      return NextResponse.json({ received: true });
    }

    // Update payment row
    await db.update(payment)
      .set({ status: newStatus, statusMessage: body.statusMessage ?? null, updatedAt: new Date() })
      .where(eq(payment.id, paymentRow.id));

    if (newStatus === 'success') {
      // Load user to pass to fulfillment
      const [userRow] = await db.select({ id: user.id, name: user.name, email: user.email })
        .from(user).where(eq(user.id, paymentRow.userId)).limit(1);

      if (userRow) {
        await fulfillPayment(paymentRow, userRow as { id: string; name: string | null; email: string });
      }
    }

    return NextResponse.json({ received: true, status: newStatus });
  } catch (error) {
    console.error('[webhook/iotec] error:', error);
    // Return 200 so ioTec doesn't keep retrying a permanent error
    return NextResponse.json({ error: String(error) }, { status: 200 });
  }
}
