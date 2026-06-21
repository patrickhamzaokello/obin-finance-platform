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
      return { success: false, error: 'Unauthorized: Admin access required' };
    }

    const file = formData.get('file') as File;
    const fileType = formData.get('fileType') as string;

    if (!file) {
      return { success: false, error: 'No file provided' };
    }

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
        return { success: false, error: 'Invalid file type' };
    }

    // Validate file size
    if (file.size > maxSize) {
      return { success: false, error: `File size exceeds ${maxSize / 1024 / 1024}MB limit` };
    }

    // Validate MIME type
    if (!allowedTypes.includes(file.type)) {
      return { success: false, error: `Invalid file type. Allowed: ${allowedTypes.join(', ')}` };
    }

    // Ensure upload directory exists
    await mkdir(uploadPath, { recursive: true });

    // Generate unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const originalName = file.name.replace(/\s+/g, '-').toLowerCase();
    const filename = `${timestamp}-${randomString}-${originalName}`;
    const filepath = join(uploadPath, filename);

    // Convert file to buffer and write
    const bytes = await file.arrayBuffer();
    await writeFile(filepath, Buffer.from(bytes));

    const publicUrl = `/uploads/${fileType}s/${filename}`;

    return {
      success: true,
      url: publicUrl,
      filename,
    };
  } catch (error) {
    console.error('[v0] Error uploading file:', error);
    return { success: false, error: 'Failed to upload file' };
  }
}
