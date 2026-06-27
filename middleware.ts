import { NextRequest, NextResponse } from 'next/server';

const BASE_DOMAIN = process.env.NEXT_PUBLIC_BASE_DOMAIN || 'localhost';

// Paths that should never be rewritten (API, static, Next internals)
const BYPASS = /^\/(api|_next|_static|favicon\.ico)/;

export function middleware(request: NextRequest) {
  const { pathname, searchParams } = request.nextUrl;

  if (BYPASS.test(pathname)) return NextResponse.next();

  const host = request.headers.get('host') || '';

  // ── Resolve school slug ──────────────────────────────────────────────────
  // 1. Subdomain: obin.platform.com  →  slug = "obin"
  // 2. Dev override: ?school=obin    →  slug = "obin"
  // 3. Apex / www                    →  no school (platform owner context)

  let schoolSlug: string | null = null;

  const baseDomainHost = BASE_DOMAIN.split(':')[0]; // strip port for matching
  const hostWithoutPort = host.split(':')[0];

  if (
    hostWithoutPort !== baseDomainHost &&
    hostWithoutPort !== `www.${baseDomainHost}` &&
    hostWithoutPort.endsWith(`.${baseDomainHost}`)
  ) {
    schoolSlug = hostWithoutPort.replace(`.${baseDomainHost}`, '');
  }

  // Dev convenience: ?school=slug
  if (!schoolSlug) {
    schoolSlug = searchParams.get('school');
  }

  // ── No school slug → platform owner context (apex domain) ───────────────
  if (!schoolSlug) {
    // Redirect bare / to platform dashboard
    if (pathname === '/') {
      return NextResponse.redirect(new URL('/platform', request.url));
    }
    return NextResponse.next();
  }

  // ── School context ────────────────────────────────────────────────────────
  // Already on an /s/[slug] internal path → pass through with header
  if (pathname.startsWith(`/s/${schoolSlug}`)) {
    const res = NextResponse.next();
    res.headers.set('x-school-slug', schoolSlug);
    return res;
  }

  // Rewrite school subdomain request to internal /s/[schoolSlug]/... path
  const rewriteUrl = request.nextUrl.clone();
  rewriteUrl.pathname = `/s/${schoolSlug}${pathname === '/' ? '' : pathname}`;

  const res = NextResponse.rewrite(rewriteUrl);
  res.headers.set('x-school-slug', schoolSlug);
  return res;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static (static files)
     * - _next/image  (image optimization)
     * - favicon.ico
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
};
