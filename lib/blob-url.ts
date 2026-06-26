const CF_BASE = process.env.NEXT_PUBLIC_CLOUDFRONT_DOMAIN || process.env.AWS_CLOUDFRONT_DOMAIN || '';

/**
 * Resolve any stored media URL to a directly-servable URL.
 * - CloudFront / S3 URLs → returned as-is (publicly served via CloudFront)
 * - Legacy Vercel Blob URLs → proxied through /api/files (backward compat)
 * - Anything else → returned as-is
 */
export function convertBlobUrlToApiUrl(url: string): string {
  if (!url) return '';
  if (isLegacyBlobUrl(url)) {
    // Proxy old Vercel Blob files through the /api/files route
    try {
      const parsed   = new URL(url);
      const parts    = parsed.pathname.split('/').filter(Boolean);
      const idx      = parts.findIndex((p) => p.startsWith('course-media'));
      if (idx !== -1) return `/api/files/${parts.slice(idx).join('/')}`;
    } catch { /* fall through */ }
  }
  return url;
}

/** True if this is an old Vercel Blob URL that needs the /api/files proxy */
export function isLegacyBlobUrl(url: string): boolean {
  return typeof url === 'string' && url.includes('blob.vercelusercontent.com');
}

/** True for any URL that is already a directly-servable media URL (S3 / CloudFront / external) */
export function isBlobUrl(url: string): boolean {
  // Keep the old name for call-site compatibility; now also matches CloudFront URLs
  if (!url) return false;
  if (isLegacyBlobUrl(url)) return true;
  if (CF_BASE && url.startsWith(CF_BASE)) return true;
  return false;
}
