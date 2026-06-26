type FileType = 'thumbnail' | 'video' | 'pdf';

/**
 * Upload a file directly from the browser to S3 via a presigned URL.
 * The file bytes never touch the Next.js server.
 * Returns the CloudFront public URL on success.
 */
export async function uploadToBlob(
  file: File,
  fileType: FileType,
  schoolSlug: string,
  onProgress?: (pct: number) => void
): Promise<{ success: true; url: string } | { success: false; error: string }> {
  try {
    // 1. Ask the server for a presigned S3 URL
    const tokenRes = await fetch('/api/upload', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ fileType, fileName: file.name, contentType: file.type, schoolSlug }),
    });

    if (!tokenRes.ok) {
      const err = await tokenRes.json().catch(() => ({}));
      return { success: false, error: err.error || 'Failed to get upload URL' };
    }

    const { presignedUrl, publicUrl } = await tokenRes.json();

    // 2. PUT the file directly to S3 using the presigned URL
    await uploadWithProgress(presignedUrl, file, onProgress);

    return { success: true, url: publicUrl };
  } catch (error) {
    return { success: false, error: error instanceof Error ? error.message : 'Upload failed' };
  }
}

function uploadWithProgress(
  url: string,
  file: File,
  onProgress?: (pct: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open('PUT', url, true);
    xhr.setRequestHeader('Content-Type', file.type);

    if (onProgress) {
      xhr.upload.addEventListener('progress', (e) => {
        if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100));
      });
    }

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) resolve();
      else reject(new Error(`S3 upload failed: ${xhr.status}`));
    });
    xhr.addEventListener('error', () => reject(new Error('Network error during upload')));
    xhr.send(file);
  });
}
