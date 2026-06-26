'use client';

import { useState } from 'react';
import { uploadToBlob } from '@/lib/upload-client';

interface FileOrUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  fileType: 'video' | 'pdf' | 'thumbnail';
  schoolSlug: string;
  label?: string;
  placeholder?: string;
}

export function FileOrUrlInput({ value, onChange, fileType, schoolSlug, label, placeholder }: FileOrUrlInputProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress]       = useState(0);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const accept =
    fileType === 'video'     ? 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov' :
    fileType === 'pdf'       ? 'application/pdf,.pdf' :
                               'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!schoolSlug) { setUploadError('No school selected — choose a school for this course first'); return; }
    setIsUploading(true);
    setUploadError(null);
    setProgress(0);

    const result = await uploadToBlob(file, fileType, schoolSlug, setProgress);

    if (result.success) {
      onChange(result.url);
    } else {
      setUploadError(result.error);
    }
    setIsUploading(false);
    e.target.value = '';
  };

  return (
    <div className='space-y-2'>
      {label && <label className='text-sm font-medium text-foreground'>{label}</label>}

      <input
        type='text'
        placeholder={placeholder || 'https://…'}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='w-full px-3 py-2 text-sm border border-border rounded focus:border-primary focus:outline-none focus:ring-1 focus:ring-primary/20 bg-white'
      />

      <div className='flex items-center gap-3'>
        <span className='text-xs text-muted-foreground'>or</span>
        <label className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-border rounded text-xs font-semibold cursor-pointer transition-colors ${isUploading || !schoolSlug ? 'opacity-60 cursor-not-allowed' : 'hover:bg-secondary'}`}>
          <input
            type='file'
            accept={accept}
            onChange={handleFileChange}
            disabled={isUploading || !schoolSlug}
            className='hidden'
          />
          {isUploading ? `Uploading… ${progress}%` : 'Upload file'}
        </label>
        {value && !isUploading && (
          <span className='text-xs text-accent font-semibold'>✓ Uploaded</span>
        )}
      </div>

      {isUploading && (
        <div className='w-full h-1.5 bg-border rounded-full overflow-hidden'>
          <div className='h-full bg-primary rounded-full transition-all' style={{ width: `${progress}%` }} />
        </div>
      )}

      {uploadError && (
        <p className='text-xs text-destructive bg-destructive/8 border border-destructive/20 rounded px-3 py-2'>{uploadError}</p>
      )}

      {!schoolSlug && (
        <p className='text-xs text-muted-foreground'>Select a school above to enable file uploads.</p>
      )}
    </div>
  );
}
