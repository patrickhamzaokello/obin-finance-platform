'use client';

import { useState } from 'react';
import { uploadFile } from '@/app/actions/upload';
import { Input } from '@/components/ui/input';

interface FileOrUrlInputProps {
  value: string;
  onChange: (value: string) => void;
  fileType: 'video' | 'pdf' | 'thumbnail';
  label?: string;
  placeholder?: string;
}

export function FileOrUrlInput({
  value,
  onChange,
  fileType,
  label,
  placeholder,
}: FileOrUrlInputProps) {
  const [activeTab, setActiveTab] = useState<'url' | 'upload'>('url');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setUploadError(null);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('fileType', fileType);

    const result = await uploadFile(formData);

    if (result.success) {
      onChange(result.url!);
      setUploadError(null);
    } else {
      setUploadError(result.error || 'Upload failed');
    }

    setIsUploading(false);
    e.target.value = '';
  };

  const getAcceptTypes = () => {
    switch (fileType) {
      case 'video':
        return 'video/mp4,video/webm,video/quicktime,.mp4,.webm,.mov';
      case 'pdf':
        return 'application/pdf,.pdf';
      case 'thumbnail':
        return 'image/jpeg,image/png,image/webp,.jpg,.jpeg,.png,.webp';
      default:
        return '';
    }
  };

  return (
    <div className='space-y-2'>
      {label && <label className='text-sm font-medium text-foreground'>{label}</label>}

      {/* Tabs */}
      <div className='flex gap-2 border-b-2 border-border'>
        <button
          type='button'
          onClick={() => setActiveTab('url')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'url'
              ? 'border-b-2 border-primary text-primary -mb-[2px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          URL
        </button>
        <button
          type='button'
          onClick={() => setActiveTab('upload')}
          className={`px-4 py-2 font-medium transition-colors ${
            activeTab === 'upload'
              ? 'border-b-2 border-primary text-primary -mb-[2px]'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Upload File
        </button>
      </div>

      {/* Tab Content */}
      <div className='mt-4'>
        {activeTab === 'url' ? (
          <Input
            type='url'
            placeholder={placeholder || 'Enter URL'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        ) : (
          <div className='space-y-3'>
            <div className='border-2 border-dashed border-border rounded p-4 text-center'>
              <input
                type='file'
                accept={getAcceptTypes()}
                onChange={handleFileChange}
                disabled={isUploading}
                className='hidden'
                id={`file-input-${fileType}`}
              />
              <label
                htmlFor={`file-input-${fileType}`}
                className='block cursor-pointer'
              >
                <p className='text-sm font-medium text-foreground mb-1'>
                  {isUploading ? 'Uploading...' : 'Click to select file or drag and drop'}
                </p>
                <p className='text-xs text-muted-foreground'>
                  {fileType === 'video' && 'MP4, WebM, MOV (Max 100MB)'}
                  {fileType === 'pdf' && 'PDF (Max 50MB)'}
                  {fileType === 'thumbnail' && 'JPG, PNG, WebP (Max 5MB)'}
                </p>
              </label>
            </div>

            {uploadError && (
              <p className='text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded px-3 py-2'>
                {uploadError}
              </p>
            )}

            {value && activeTab === 'upload' && (
              <p className='text-sm text-primary font-medium'>✓ File uploaded successfully</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
