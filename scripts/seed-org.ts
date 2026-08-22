/**
 * One-time seed script — run AFTER db:push:
 *   npx tsx scripts/seed-org.ts
 *
 * What it does:
 *  1. Inserts the ObinAcademy organization (domain: obinacademy.com)
 *  2. Backfills all existing schools that have no organizationId to that org
 */

import 'dotenv/config';
import { db } from '../lib/db';
import { organization, school } from '../lib/db/schema';
import { isNull, eq } from 'drizzle-orm';

async function main() {
  const ORG_ID     = 'org-obinacademy';
  const ORG_DOMAIN = 'obinacademy.com';
  const ORG_NAME   = 'ObinAcademy';

  // 1. Upsert the organization row
  const existing = await db
    .select()
    .from(organization)
    .where(eq(organization.domain, ORG_DOMAIN))
    .limit(1);

  if (existing.length === 0) {
    await db.insert(organization).values({ id: ORG_ID, domain: ORG_DOMAIN, name: ORG_NAME });
    console.log(`✓ Created organization: ${ORG_NAME} (${ORG_DOMAIN})`);
  } else {
    console.log(`→ Organization already exists: ${existing[0].name} (${existing[0].domain})`);
  }

  const orgId = existing[0]?.id ?? ORG_ID;

  // 2. Backfill schools that have no organizationId
  const result = await db
    .update(school)
    .set({ organizationId: orgId })
    .where(isNull(school.organizationId));

  console.log(`✓ Backfilled existing schools → organizationId = ${orgId}`);
  console.log('Done.');
  process.exit(0);
}

main().catch((err) => { console.error(err); process.exit(1); });
