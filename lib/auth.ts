import { betterAuth } from 'better-auth'
import { pool } from '@/lib/db'

const baseDomain = process.env.NEXT_PUBLIC_BASE_DOMAIN; // e.g. "pkasemer.com"

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
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // cache session for 5 min to reduce DB reads
    },
  },
  advanced: {
    defaultCookieAttributes: process.env.NODE_ENV === 'development'
      ? {
          // In dev (v0 preview iframe), force cross-site cookies
          sameSite: 'none' as const,
          secure: true,
        }
      : {
          // In production, scope cookie to root domain so it works on
          // both pkasemer.com and any school subdomain (obin.pkasemer.com)
          sameSite: 'lax' as const,
          secure: true,
          ...(baseDomain ? { domain: `.${baseDomain}` } : {}),
        },
  },
})
