// ============================================================================
// HALLWAY STORAGE QUOTA SYSTEM
// Per-user storage budget enforcement for Supabase Free Tier (1 GB total)
// ============================================================================

import { supabase } from './supabaseClient';

// QUOTAS
export const STORAGE_QUOTA = 50 * 1024 * 1024;      // 50 MB total per user
export const MAX_IMAGE_SIZE = 5 * 1024 * 1024;        // 5 MB per image
export const MAX_VIDEO_SIZE = 20 * 1024 * 1024;       // 20 MB per video

// ============================================================================
// STORAGE ACCOUNTING HELPERS
//
// `profiles.storage_used` must track real bytes. Uploads add the true file
// size, so deletes have to free the true file size too. A hardcoded estimate
// ("~200KB per image") drifts the counter in both directions and eventually
// locks a user out of uploading even though they have plenty of room.
// ============================================================================

/**
 * Byte size of a single object in a storage bucket.
 * Returns 0 if the object is missing or unreadable.
 */
export const getObjectSize = async (bucket, filePath) => {
  if (!bucket || !filePath) return 0;
  try {
    const parts = filePath.split('/');
    const folder = parts.slice(0, -1).join('/');
    const name = parts[parts.length - 1];

    const { data, error } = await supabase.storage
      .from(bucket)
      .list(folder, { search: name });

    if (error || !data || data.length === 0) return 0;
    const size = Number(data[0]?.size);
    return Number.isFinite(size) && size > 0 ? size : 0;
  } catch {
    return 0;
  }
};

/**
 * Remove an object and return the number of bytes actually freed.
 * The size is read BEFORE removal, because afterwards the object is gone.
 */
export const removeObjectAndGetSize = async (bucket, filePath) => {
  const size = await getObjectSize(bucket, filePath);
  try {
    await supabase.storage.from(bucket).remove([filePath]);
  } catch {
    return 0;
  }
  return size;
};

// Format bytes to human-readable string
export const formatBytes = (bytes) => {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
};

// Get storage usage as a percentage (0-100)
export const getStoragePercentage = (used) => {
  return Math.min(100, Math.round(((used || 0) / STORAGE_QUOTA) * 100));
};

// Validate a single file's size before upload
export const validateFileSize = (file) => {
  if (!file) return { valid: false, message: 'No file selected' };
  
  const isVideo = file.type.startsWith('video/');
  const maxSize = isVideo ? MAX_VIDEO_SIZE : MAX_IMAGE_SIZE;
  
  if (file.size > maxSize) {
    return { 
      valid: false, 
      message: `${isVideo ? 'Video' : 'Image'} is too large. Max size is ${formatBytes(maxSize)}.` 
    };
  }
  
  return { valid: true };
};

// Check if a file upload would exceed the user's quota
export const checkQuota = (currentUsed, fileSize) => {
  const projectedTotal = (currentUsed || 0) + fileSize;
  
  if (projectedTotal > STORAGE_QUOTA) {
    return { 
      allowed: false, 
      message: `Storage quota exceeded. You have ${formatBytes(STORAGE_QUOTA - (currentUsed || 0))} remaining.` 
    };
  }
  
  return { allowed: true };
};
