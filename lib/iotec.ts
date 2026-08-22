/**
 * ioTec Pay API client
 * Docs: https://pay.iotec.io
 * Auth: OAuth 2.0 client credentials — token from https://id.iotec.io/connect/token
 */

const IOTEC_BASE_URL  = 'https://pay.iotec.io';
const IOTEC_TOKEN_URL = 'https://id.iotec.io/connect/token';

// ─── Token cache (module-level singleton) ────────────────────────────────────
let _cachedToken: string | null = null;
let _tokenExpiresAt = 0;

async function getAccessToken(): Promise<string> {
  if (_cachedToken && Date.now() < _tokenExpiresAt - 10_000) {
    return _cachedToken;
  }

  const clientId     = process.env.IOTEC_CLIENT_ID!;
  const clientSecret = process.env.IOTEC_CLIENT_SECRET!;

  const res = await fetch(IOTEC_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     clientId,
      client_secret: clientSecret,
      grant_type:    'client_credentials',
    }),
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`ioTec token fetch failed: ${res.status} ${text}`);
  }

  const data = await res.json() as { access_token: string; expires_in: number };
  _cachedToken    = data.access_token;
  _tokenExpiresAt = Date.now() + data.expires_in * 1000;
  return _cachedToken;
}

async function iotecFetch(path: string, options: RequestInit = {}) {
  const token = await getAccessToken();
  const res = await fetch(`${IOTEC_BASE_URL}${path}`, {
    ...options,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...(options.headers ?? {}),
    },
    cache: 'no-store',
  });
  const body = await res.json().catch(() => null);
  if (!res.ok) {
    throw new Error(`ioTec ${path} → ${res.status}: ${JSON.stringify(body)}`);
  }
  return body;
}

// ─── Types ───────────────────────────────────────────────────────────────────
export type IotecStatus = 'Pending' | 'Success' | 'Failed' | 'SentToVendor';

export interface IotecCollectionResponse {
  id:             string;          // ioTec transaction UUID
  status:         IotecStatus;
  amount:         number;
  currency:       string;
  externalId:     string | null;
  statusCode:     string | null;
  statusMessage:  string | null;
  payer:          string | null;
  cardRedirectUrl?: string | null; // only for card payments
}

export interface IotecDisbursementResponse {
  id:            string;
  status:        IotecStatus;
  amount:        number;
  currency:      string;
  externalId:    string | null;
  statusMessage: string | null;
}

// ─── Collections ─────────────────────────────────────────────────────────────

/**
 * Initiate a mobile money collection (MTN / Airtel Uganda).
 * @param amount   Amount in UGX. Min 500.
 * @param phone    Payer's MSISDN e.g. "0711234567"
 * @param externalId Your reference ID for reconciliation
 * @param payerNote Short message shown to payer on their phone
 */
export async function initiateCollection(
  amount: number,
  phone: string,
  externalId: string,
  payerNote?: string,
): Promise<IotecCollectionResponse> {
  return iotecFetch('/api/collections/collect', {
    method: 'POST',
    body: JSON.stringify({
      category:   'MobileMoney',
      currency:   process.env.IOTEC_CURRENCY ?? 'UGX',
      walletId:   process.env.IOTEC_WALLET_ID,
      externalId,
      payer:      phone,
      amount,
      payerNote:  payerNote ?? 'Course payment – ObinAcademy',
      payeeNote:  `Ref: ${externalId}`,
    }),
  });
}

/**
 * Get the current status of a collection by ioTec transaction ID.
 */
export async function getCollectionStatus(transactionId: string): Promise<IotecCollectionResponse> {
  return iotecFetch(`/api/collections/status/${transactionId}`);
}

/**
 * Get the current status of a collection by your own externalId.
 */
export async function getCollectionByExternalId(externalId: string): Promise<IotecCollectionResponse> {
  return iotecFetch(`/api/collections/external-id/${externalId}`);
}

// ─── Disbursements ───────────────────────────────────────────────────────────

/**
 * Disburse funds to a creator's mobile money number.
 * @param amount    Amount in UGX. Min 500.
 * @param phone     Payee's MSISDN
 * @param externalId Your payout reference
 * @param payeeName Creator's display name
 */
export async function initiateDisbursement(
  amount: number,
  phone: string,
  externalId: string,
  payeeName?: string,
): Promise<IotecDisbursementResponse> {
  return iotecFetch('/api/disbursements/disburse', {
    method: 'POST',
    body: JSON.stringify({
      category:   'MobileMoney',
      currency:   process.env.IOTEC_CURRENCY ?? 'UGX',
      walletId:   process.env.IOTEC_WALLET_ID,
      externalId,
      payee:      phone,
      payeeName,
      amount,
      payeeNote:  `Creator payout – ObinAcademy – Ref: ${externalId}`,
    }),
  });
}

export async function getDisbursementStatus(transactionId: string): Promise<IotecDisbursementResponse> {
  return iotecFetch(`/api/disbursements/status/${transactionId}`);
}
