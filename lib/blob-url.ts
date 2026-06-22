/**
 * Converts a Vercel Blob URL to a local API route URL for authenticated access
 * This allows learners to access private blob files through our secure API
 */
export function convertBlobUrlToApiUrl(blobUrl: string): string {
  if (!blobUrl) return '';
  
  // Extract file path from blob URL
  // Blob URLs look like: https://blob.vercelusercontent.com/[hash]/course-media/...
  // We need to extract just the course-media/... part
  
  try {
    const url = new URL(blobUrl);
    const pathname = url.pathname;
    
    // Remove leading slash and extract the file path after the hash
    // pathname is usually /[hash]/course-media/...
    const parts = pathname.split('/').filter(Boolean);
    
    if (parts.length < 2) {
      return blobUrl; // Fallback to original if parsing fails
    }
    
    // Find where course-media starts (it should be at index 1 or later)
    const courseMediaIndex = parts.findIndex(p => p.startsWith('course-media'));
    if (courseMediaIndex === -1) {
      return blobUrl;
    }
    
    // Reconstruct the path from course-media onwards
    const filePath = parts.slice(courseMediaIndex).join('/');
    
    // Return the new API URL
    return `/api/files/${filePath}`;
  } catch (error) {
    console.error('[v0] Error converting blob URL:', error);
    return blobUrl;
  }
}

/**
 * Check if a URL is a Vercel Blob URL
 */
export function isBlobUrl(url: string): boolean {
  return typeof url === 'string' && url.includes('blob.vercelusercontent.com');
}
