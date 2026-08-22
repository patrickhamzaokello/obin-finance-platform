import { headers } from 'next/headers';
import { db } from '@/lib/db';
import { organization } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

const FALLBACK_DOMAIN = 'obinacademy.com';

/** Strip www. prefix and port from a Host header value. */
function normalizeDomain(host: string): string {
  return host.replace(/^www\./, '').split(':')[0].toLowerCase();
}

/**
 * Returns the organization row matching the current request's Host header.
 * Falls back to the ObinAcademy org if no match found.
 */
export async function getCurrentOrganization() {
  const h = await headers();
  const host = h.get('host') ?? FALLBACK_DOMAIN;
  const domain = normalizeDomain(host);

  const rows = await db
    .select()
    .from(organization)
    .where(eq(organization.domain, domain))
    .limit(1);

  if (rows.length) return rows[0];

  // Fall back to the default org
  const fallback = await db
    .select()
    .from(organization)
    .where(eq(organization.domain, FALLBACK_DOMAIN))
    .limit(1);

  return fallback[0] ?? null;
}

/** Convenience — returns just the org id (or null). */
export async function getCurrentOrganizationId(): Promise<string | null> {
  const org = await getCurrentOrganization();
  return org?.id ?? null;
}
