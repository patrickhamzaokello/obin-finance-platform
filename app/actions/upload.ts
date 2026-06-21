'use server';

import { writeFile, mkdir } from 'fs/promises';
import { join } from 'path';
import { getUserWithRole } from '@/lib/user-utils';
import { headers } from 'next/headers';

const UPLOAD_DIR = join(process.cwd(), 'public/uploads');
const ALLOWED_VIDEO_TYPES = ['video/mp4', 'video/webm', 'video/quicktime'];
const ALLOWED_PDF_TYPES = ['application/pdf'];
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_FILE_SIZE = 100 * 1024 * 1024; // 100MB for videos, 50MB for others

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
    let uploadPath: string;
    let allowedTypes: string[];
    let maxSize: number;

    switch (fileType) {
      case 'video':
        uploadPath = join(UPLOAD_DIR, 'videos');
        allowedTypes = ALLOWED_VIDEO_TYPES;
        maxSize = 100 * 1024 * 1024; // 100MB
        break;
      case 'pdf':
        uploadPath = join(UPLOAD_DIR, 'pdfs');
        allowedTypes = ALLOWED_PDF_TYPES;
        maxSize = 50 * 1024 * 1024; // 50MB
        break;
      case 'thumbnail':
        uploadPath = join(UPLOAD_DIR, 'thumbnails');
        allowedTypes = ALLOWED_IMAGE_TYPES;
        maxSize = 5 * 1024 * 1024; // 5MB
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

    // Ensure upload directory exists
    console.log('[v0] Creating upload directory:', uploadPath);
    await mkdir(uploadPath, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${randomString}-${originalName}`;
    const filepath = join(uploadPath, filename);

    console.log('[v0] Writing file to:', filepath);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const publicUrl = `/uploads/${fileType}s/${filename}`;

    console.log('[v0] File uploaded successfully:', { publicUrl, size: file.size });

    return {
      success: true,
      url: publicUrl,
      filename,
    };
  } catch (error) {
    console.error('[v0] Error uploading file:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to upload file';
    return { success: false, error: errorMessage };
  }
}
