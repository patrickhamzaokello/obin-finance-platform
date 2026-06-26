import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { db } from '@/lib/db';
import { school } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { headers } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';

const s3 = new S3Client({
  region: process.env.AWS_REGION!,
  credentials: {
    accessKeyId:     process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
  },
});

const BUCKET  = 'learningplatform';
const CF_BASE = (process.env.AWS_CLOUDFRONT_DOMAIN || '').replace(/\/$/, '');

const ALLOWED_TYPES: Record<string, string[]> = {
  thumbnail: ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/gif'],
  video:     ['video/mp4', 'video/webm', 'video/quicktime'],
  pdf:       ['application/pdf'],
};

const FOLDERS: Record<string, string> = {
  thumbnail: 'thumbnails',
  video:     'videos',
  pdf:       'pdfs',
};

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Admin-only
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user || (session.user as any).role !== 'admin') {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { fileType: string; fileName: string; contentType: string; schoolSlug: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
  }

  const { fileType, fileName, contentType, schoolSlug } = body;

  if (!schoolSlug) {
    return NextResponse.json({ error: 'schoolSlug is required' }, { status: 400 });
  }

  // Validate slug exists in DB
  const slugSafe = schoolSlug.toLowerCase().replace(/[^a-z0-9-]/g, '-');
  const schoolRows = await db.select().from(school).where(eq(school.slug, slugSafe)).limit(1);
  if (!schoolRows.length) {
    return NextResponse.json({ error: `School "${slugSafe}" not found` }, { status: 404 });
  }

  if (!ALLOWED_TYPES[fileType]?.includes(contentType)) {
    return NextResponse.json(
      { error: `Content type ${contentType} not allowed for ${fileType}` },
      { status: 400 }
    );
  }

  const folder   = FOLDERS[fileType];
  const safeName = fileName.replace(/\s+/g, '-').toLowerCase();
  const key      = `schools/${slugSafe}/course-media/${folder}/${Date.now()}-${safeName}`;

  const command = new PutObjectCommand({
    Bucket:      BUCKET,
    Key:         key,
    ContentType: contentType,
  });

  const presignedUrl = await getSignedUrl(s3, command, { expiresIn: 300 });
  const publicUrl    = CF_BASE
    ? `${CF_BASE}/${key}`
    : `https://${BUCKET}.s3.${process.env.AWS_REGION}.amazonaws.com/${key}`;

  return NextResponse.json({ presignedUrl, publicUrl, key });
}
