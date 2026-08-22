import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
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
        after: async (user) => {
          const base = process.env.BETTER_AUTH_URL ?? 'https://obinacademy.com';
          sendWelcomeEmail({
            email:    user.email,
            name:     user.name ?? user.email,
            signInUrl: `${base}/learn/dashboard`,
          }).catch(console.error);
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
