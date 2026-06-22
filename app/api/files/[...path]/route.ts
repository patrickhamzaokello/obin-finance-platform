import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { redirect } from 'next/navigation';

/**
 * API route to serve private Vercel Blob files to authenticated learners
 * Maps requests to blob storage and streams file content
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path: string[] }> }
) {
  try {
    // Check authentication
    const session = await auth.api.getSession({ headers: await headers() });
    if (!session?.user) {
      return new Response('Unauthorized', { status: 401 });
    }

    const resolvedParams = await params;
    const filePath = resolvedParams.path.join('/');

    // Validate file path to prevent directory traversal attacks
    if (!filePath || filePath.includes('..')) {
      return new Response('Invalid file path', { status: 400 });
    }

    // Allowed file paths - only course media
    if (!filePath.startsWith('course-media/')) {
      return new Response('Access denied', { status: 403 });
    }

    // Get the file from Vercel Blob using the BLOB_READ_WRITE_TOKEN
    const blobUrl = `https://blob.vercelusercontent.com/${filePath}`;
    
    const blobToken = process.env.BLOB_READ_WRITE_TOKEN;
    if (!blobToken) {
      console.error('[v0] BLOB_READ_WRITE_TOKEN not set');
      return new Response('Server error', { status: 500 });
    }

    // Request the file from Vercel Blob with authentication
    const blobResponse = await fetch(blobUrl, {
      headers: {
        'Authorization': `Bearer ${blobToken}`,
      },
    });

    if (!blobResponse.ok) {
      console.error('[v0] Blob fetch failed:', {
        status: blobResponse.status,
        path: filePath,
      });
      return new Response('File not found', { status: 404 });
    }

    // Get content type from blob response
    const contentType = blobResponse.headers.get('content-type') || 'application/octet-stream';
    
    // Stream the file to the client
    const buffer = await blobResponse.arrayBuffer();
    
    return new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Content-Length': buffer.byteLength.toString(),
        'Cache-Control': 'public, max-age=31536000', // Cache for 1 year since content is immutable
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch (error) {
    console.error('[v0] Error serving file:', error);
    return new Response('Server error', { status: 500 });
  }
}
