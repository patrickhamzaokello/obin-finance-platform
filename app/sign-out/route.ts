import { NextResponse } from 'next/server';

/**
 * GET /sign-out — used by sidebar links in admin and studio layouts.
 * Redirects to the Better Auth sign-out endpoint which clears the session cookie,
 * then sends the user to /sign-in.
 */
export async function GET() {
  // Better Auth's sign-out endpoint handles cookie clearing
  return NextResponse.redirect(
    new URL('/api/auth/sign-out', process.env.BETTER_AUTH_URL ?? 'http://localhost:3000'),
    { status: 302 }
  );
}
