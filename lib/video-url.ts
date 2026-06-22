/**
 * YouTube Video URL Utilities
 * Handles detection, validation, and conversion of YouTube URLs
 */

/**
 * Extract YouTube video ID from various URL formats
 * Supports:
 * - https://www.youtube.com/watch?v=VIDEO_ID
 * - https://youtu.be/VIDEO_ID
 * - https://www.youtube.com/embed/VIDEO_ID
 * - Just the VIDEO_ID
 */
export function extractYouTubeId(url: string): string | null {
  if (!url) return null;

  try {
    // If it looks like just an ID (11 characters, alphanumeric with - and _)
    if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
      return url;
    }

    // Try to parse as URL
    try {
      const urlObj = new URL(url);
      
      // youtube.com/watch?v=VIDEO_ID
      if (urlObj.hostname.includes('youtube.com')) {
        const videoId = urlObj.searchParams.get('v');
        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }
      
      // youtu.be/VIDEO_ID
      if (urlObj.hostname.includes('youtu.be')) {
        const videoId = urlObj.pathname.slice(1);
        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }
      
      // youtube.com/embed/VIDEO_ID
      if (urlObj.pathname.includes('/embed/')) {
        const videoId = urlObj.pathname.split('/embed/')[1];
        if (videoId && /^[a-zA-Z0-9_-]{11}$/.test(videoId)) {
          return videoId;
        }
      }
    } catch (e) {
      // Not a valid URL, might be just an ID
      if (/^[a-zA-Z0-9_-]{11}$/.test(url)) {
        return url;
      }
    }
  } catch (error) {
    console.error('[v0] Error extracting YouTube ID:', error);
  }

  return null;
}

/**
 * Check if a URL is a YouTube URL
 */
export function isYouTubeUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('youtube.com') || urlObj.hostname.includes('youtu.be');
  } catch {
    // Check if it's just a video ID
    return /^[a-zA-Z0-9_-]{11}$/.test(url);
  }
}

/**
 * Get YouTube embed URL for iframe
 */
export function getYouTubeEmbedUrl(videoId: string): string {
  return `https://www.youtube.com/embed/${videoId}?rel=0`;
}

/**
 * Get YouTube thumbnail URL
 * Uses the highest quality thumbnail available
 */
export function getYouTubeThumbnail(videoId: string, quality: 'maxres' | 'high' | 'medium' | 'default' = 'high'): string {
  // Quality order: maxres (1280x720) > high (480x360) > medium (320x180) > default (120x90)
  const qualityMap = {
    maxres: `https://img.youtube.com/vi/${videoId}/maxresdefault.jpg`,
    high: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
    medium: `https://img.youtube.com/vi/${videoId}/mqdefault.jpg`,
    default: `https://img.youtube.com/vi/${videoId}/default.jpg`,
  };

  return qualityMap[quality];
}

/**
 * Get standardized YouTube watch URL
 */
export function getYouTubeWatchUrl(videoId: string): string {
  return `https://www.youtube.com/watch?v=${videoId}`;
}

/**
 * Validate YouTube URL and return video ID if valid
 */
export function validateYouTubeUrl(url: string): { valid: boolean; videoId: string | null } {
  if (!url) return { valid: false, videoId: null };

  const videoId = extractYouTubeId(url);
  return {
    valid: !!videoId,
    videoId,
  };
}

/**
 * Check if video URL is from Blob storage (uploaded video)
 */
export function isBlobVideoUrl(url: string): boolean {
  if (!url) return false;
  try {
    const urlObj = new URL(url);
    return urlObj.hostname.includes('blob.vercelusercontent.com');
  } catch {
    return false;
  }
}

/**
 * Determine video source type
 */
export type VideoSourceType = 'youtube' | 'blob' | 'api' | 'unknown';

export function getVideoSourceType(url: string): VideoSourceType {
  if (!url) return 'unknown';
  
  if (isYouTubeUrl(url)) {
    return 'youtube';
  }
  
  if (isBlobVideoUrl(url)) {
    return 'blob';
  }
  
  if (url.includes('/api/files/')) {
    return 'api';
  }
  
  return 'unknown';
}

/**
 * Get the appropriate video URL for playback
 * Priority: YouTube > API route > Direct URL
 */
export function getPlaybackUrl(videoUrl: string | null | undefined, youtubeUrl: string | null | undefined): string | null {
  // YouTube URL takes priority
  if (youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (videoId) {
      return getYouTubeEmbedUrl(videoId);
    }
  }

  // Fall back to uploaded video (blob)
  if (videoUrl) {
    // Convert blob URL to API route if needed
    if (isBlobVideoUrl(videoUrl)) {
      return `/api/files/${videoUrl.split('/').pop()}`;
    }
    return videoUrl;
  }

  return null;
}

/**
 * Get video preview info for UI display
 */
export interface VideoPreviewInfo {
  source: VideoSourceType;
  videoId?: string;
  thumbnail?: string;
  watchUrl?: string;
  isYouTube: boolean;
}

export function getVideoPreviewInfo(videoUrl: string | null | undefined, youtubeUrl: string | null | undefined): VideoPreviewInfo {
  // Check YouTube first
  if (youtubeUrl) {
    const videoId = extractYouTubeId(youtubeUrl);
    if (videoId) {
      return {
        source: 'youtube',
        videoId,
        thumbnail: getYouTubeThumbnail(videoId),
        watchUrl: getYouTubeWatchUrl(videoId),
        isYouTube: true,
      };
    }
  }

  // Fall back to uploaded video
  if (videoUrl) {
    return {
      source: getVideoSourceType(videoUrl),
      isYouTube: false,
    };
  }

  return {
    source: 'unknown',
    isYouTube: false,
  };
}
