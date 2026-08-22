import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'
import { sendWelcomeEmail } from '@/lib/plunk'

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
    // Trust the apex domain and ALL school subdomains
    ...(baseDomain
      ? [
          `https://${baseDomain}`,
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
