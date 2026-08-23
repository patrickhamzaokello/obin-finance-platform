import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
import { db } from '@/lib/db'
import { organization, user as userTable } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'
import { sendWelcomeEmail, sendPasswordResetEmail } from '@/lib/plunk'

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN; // e.g. "ObinAcademy.com"

export const auth = betterAuth({
  database: pool,
  secret: process.env.BETTER_AUTH_SECRET,
  baseURL:
    process.env.BETTER_AUTH_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : process.env.VERCEL_URL
        ? `https://${process.env.VERCEL_URL}`
        : process.env.V0_RUNTIME_URL),
  emailAndPassword: {
    enabled: true,
    autoSignIn: true,
    sendResetPassword: async ({ user, url }) => {
      try {
        await sendPasswordResetEmail({
          email:    user.email,
          name:     user.name ?? user.email,
          resetUrl: url,
        });
      } catch (err) {
        console.error('[auth] sendResetPassword failed:', err);
      }
    },
  },
  trustedOrigins: [
    'http://localhost:3000',
    'http://localhost:3001',
    'http://localhost:3002',
    ...(process.env.V0_RUNTIME_URL ? [process.env.V0_RUNTIME_URL] : []),
    ...(process.env.VERCEL_URL ? [`https://${process.env.VERCEL_URL}`] : []),
    ...(process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? [`https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`]
      : []),
    // Trust the apex domain, www, and ALL school subdomains
    ...(baseDomain
      ? [
          `https://${baseDomain}`,
          `https://www.${baseDomain}`,
          `https://*.${baseDomain}`,
        ]
      : []),
  ],
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 days
    updateAge: 60 * 60 * 24, // 1 day
  },
  databaseHooks: {
    user: {
      create: {
        after: async (newUser) => {
          // 1. Send welcome email
          const base = process.env.BETTER_AUTH_URL ?? 'https://obinacademy.com';
          sendWelcomeEmail({
            email:     newUser.email,
            name:      newUser.name ?? newUser.email,
            signInUrl: `${base}/learn/dashboard`,
          }).catch(console.error);

          // 2. Assign user to an organization by email domain.
          //    - If a matching org exists for their domain → assign to it.
          //    - If no match → create a new org for that domain and assign.
          //    - Generic/free email providers (gmail, yahoo, hotmail, outlook) are
          //      never used as org identifiers — those users fall back to the first org.
          try {
            const FREE_DOMAINS = new Set([
              'gmail.com','yahoo.com','hotmail.com','outlook.com','live.com',
              'icloud.com','me.com','aol.com','protonmail.com','yandex.com',
              'mail.com','zoho.com','gmx.com','inbox.com',
            ]);

            const emailDomain = newUser.email.split('@')[1]?.toLowerCase() ?? '';
            const orgs = await db.select().from(organization);

            // Try exact domain match first
            const matched = orgs.find(o => o.domain.toLowerCase() === emailDomain);

            let targetOrgId: string | null = matched?.id ?? null;

            if (!targetOrgId) {
              if (!FREE_DOMAINS.has(emailDomain) && emailDomain.includes('.')) {
                // Unknown custom domain → create a new org for it
                const orgName = emailDomain
                  .split('.')[0]
                  .replace(/-/g, ' ')
                  .replace(/\b\w/g, c => c.toUpperCase()); // e.g. "my-school.com" → "My School"

                const newOrgId = `org-${emailDomain.replace(/\./g, '-')}-${Date.now()}`;
                await db.insert(organization).values({
                  id:     newOrgId,
                  name:   orgName,
                  domain: emailDomain,
                });
                targetOrgId = newOrgId;
                console.log(`[auth] created new org "${orgName}" (${emailDomain}) for user ${newUser.email}`);
              } else {
                // Free/generic email → assign to the first org (platform default)
                targetOrgId = orgs[0]?.id ?? null;
              }
            }

            if (targetOrgId) {
              await db
                .update(userTable)
                .set({ organizationId: targetOrgId })
                .where(eq(userTable.id, newUser.id));
            }
          } catch (err) {
            console.error('[auth] failed to auto-assign user to org:', err);
          }
        },
      },
    },
  },
  rateLimit: {
    window: 60,   // 60-second window
    max: 10,      // allow 10 requests per window (default is very low)
    storage: 'memory',
  },
  advanced: {
    // Unique prefix prevents platform-admin cookies (set on the apex domain in a
    // previous config with domain: '.ObinAcademy.com') from colliding with school
    // user cookies on subdomains.
    cookiePrefix: 'ba',
    ...(process.env.NODE_ENV === 'development'
      ? { defaultCookieAttributes: { sameSite: 'none' as const, secure: true } }
      : {}),
  },
})
