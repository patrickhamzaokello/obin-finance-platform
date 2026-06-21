'use server';

import { put } from '@vercel/blob';
import { getUserWithRole } from '@/lib/user-utils';

const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

export async function uploadFile(formData: FormData) {
  try {
    const userWithRole = await getUserWithRole();
    if (!userWithRole || userWithRole.role !== 'admin') {
      console.error('[v0] Unauthorized upload attempt. User:', userWithRole?.id, 'Role:', userWithRole?.role);
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      console.error('[v0] No file provided in upload');
      return { success: false, error: 'No file provided' };
    }

    console.log('[v0] Uploading file:', { name: file.name, type: file.type, size: file.size, fileType });

    // Validate file type
    let allowedTypes: string[];
    let maxSize: number;
    let storageFolder: string;

    switch (fileType) {
      case 'video':
        allowedTypes = ALLOWED_VIDEO_TYPES;
        maxSize = 100 * 1024 * 1024; // 100MB
        storageFolder = 'videos';
        break;
      case 'pdf':
        allowedTypes = ALLOWED_PDF_TYPES;
        maxSize = 50 * 1024 * 1024; // 50MB
        storageFolder = 'pdfs';
        break;
      case 'thumbnail':
        allowedTypes = ALLOWED_IMAGE_TYPES;
        maxSize = 5 * 1024 * 1024; // 5MB
        storageFolder = 'thumbnails';
        break;
      default:
        console.error('[v0] Invalid file type:', fileType);
        return { success: false, error: 'Invalid file type' };
    }

    // Validate file size
    if (file.size > maxSize) {
      const limitMB = maxSize / 1024 / 1024;
      console.error(`[v0] File size ${file.size} exceeds ${limitMB}MB limit`);
      return { success: false, error: `File size exceeds ${limitMB}MB limit` };
    }

    // Validate MIME type - allow more flexible matching
    const isValidType = allowedTypes.includes(file.type) || 
                       (fileType === 'video' && file.type.startsWith('video/')) ||
                       (fileType === 'pdf' && file.type === 'application/pdf') ||
                       (fileType === 'thumbnail' && file.type.startsWith('image/'));
    
    if (!isValidType) {
      console.error('[v0] Invalid MIME type:', { actual: file.type, allowed: allowedTypes });
      return { success: false, error: `Invalid file type. Expected: ${fileType}` };
    }

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${randomString}-${originalName}`;
    const blobPath = `course-media/${storageFolder}/${filename}`;

    console.log('[v0] Uploading to Vercel Blob:', { blobPath, size: file.size });

    // Convert file to buffer and upload to Vercel Blob
    const bytes = await file.arrayBuffer();
    const blob = await put(blobPath, bytes, {
      access: 'public',
      contentType: file.type,
    });

    console.log('[v0] File uploaded successfully to Blob:', { url: blob.url, size: file.size });

    return {
      success: true,
      url: blob.url,
      filename,
    };
  } catch (error) {
    console.error('[v0] Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return { success: false, error: errorMessage };
  }
}
