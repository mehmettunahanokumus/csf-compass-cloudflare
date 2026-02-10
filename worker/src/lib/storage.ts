/**
 * R2 Storage Utilities
 *
 * Handles file operations with Cloudflare R2:
 * - File uploads
 * - Presigned download URLs (JWT-based)
 * - File deletions
 */

/**
 * File path structure: evidence/{orgId}/{assessmentId}/{timestamp}-{filename}
 */
export function generateR2Key(
  orgId: string,
  assessmentId: string,
  filename: string
): string {
  const timestamp = Date.now();
  // Sanitize filename: remove special characters, keep alphanumeric, dots, hyphens, underscores
  const sanitizedFilename = filename.replace(/[^a-zA-Z0-9._-]/g, '_');
  return `evidence/${orgId}/${assessmentId}/${timestamp}-${sanitizedFilename}`;
}

/**
 * Upload file to R2 bucket
 *
 * @param bucket - R2 bucket binding
 * @param key - File path in R2
 * @param file - File content as ArrayBuffer
 * @param metadata - File metadata
 * @returns Upload result
 */
export async function uploadFile(
  bucket: R2Bucket,
  key: string,
  file: ArrayBuffer,
  metadata?: Record<string, string>
): Promise<void> {
  await bucket.put(key, file, {
    httpMetadata: metadata ? {
      contentType: metadata.contentType,
    } : undefined,
    customMetadata: metadata,
  });
}

/**
 * Download file from R2 bucket
 *
 * @param bucket - R2 bucket binding
 * @param key - File path in R2
 * @returns File object or null if not found
 */
export async function downloadFile(
  bucket: R2Bucket,
  key: string
): Promise<R2ObjectBody | null> {
  return await bucket.get(key);
}

/**
 * Delete file from R2 bucket
 *
 * @param bucket - R2 bucket binding
 * @param key - File path in R2
 */
export async function deleteFile(
  bucket: R2Bucket,
  key: string
): Promise<void> {
  await bucket.delete(key);
}

/**
 * Check if file exists in R2 bucket
 *
 * @param bucket - R2 bucket binding
 * @param key - File path in R2
 * @returns True if file exists
 */
export async function fileExists(
  bucket: R2Bucket,
  key: string
): Promise<boolean> {
  const object = await bucket.head(key);
  return object !== null;
}

/**
 * Generate a presigned download token (JWT)
 *
 * @param r2Key - R2 file path
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns JWT token
 */
export async function generateDownloadToken(
  r2Key: string,
  expiresIn: number = 3600
): Promise<string> {
  const payload = {
    key: r2Key,
    exp: Math.floor(Date.now() / 1000) + expiresIn,
  };

  // Simple base64 encoding for demo (in production, use proper JWT with signature)
  // For production: Use @tsndr/cloudflare-worker-jwt or similar
  const token = btoa(JSON.stringify(payload));
  return token;
}

/**
 * Validate and decode download token
 *
 * @param token - JWT token
 * @returns Decoded payload with file path or null if invalid
 */
export async function validateDownloadToken(
  token: string
): Promise<{ key: string } | null> {
  try {
    // Simple base64 decoding for demo
    const decoded = JSON.parse(atob(token));

    // Check expiration
    if (decoded.exp && decoded.exp < Math.floor(Date.now() / 1000)) {
      return null; // Token expired
    }

    if (!decoded.key) {
      return null; // Invalid token
    }

    return { key: decoded.key };
  } catch (error) {
    return null; // Invalid token format
  }
}

/**
 * Allowed file types for evidence uploads
 */
export const ALLOWED_FILE_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document', // DOCX
  'text/plain',
  'image/png',
  'image/jpeg',
  'text/csv',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', // XLSX
];

/**
 * Maximum file size (10 MB)
 */
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10 MB in bytes

/**
 * Validate file type and size
 *
 * @param contentType - MIME type
 * @param size - File size in bytes
 * @returns Validation result
 */
export function validateFile(contentType: string, size: number): {
  valid: boolean;
  error?: string;
} {
  // Check file type
  if (!ALLOWED_FILE_TYPES.includes(contentType)) {
    return {
      valid: false,
      error: `File type not allowed. Allowed types: PDF, DOCX, TXT, PNG, JPG, CSV, XLSX`,
    };
  }

  // Check file size
  if (size > MAX_FILE_SIZE) {
    return {
      valid: false,
      error: `File size exceeds maximum limit of 10 MB`,
    };
  }

  return { valid: true };
}

/**
 * Get file extension from filename
 */
export function getFileExtension(filename: string): string {
  const parts = filename.split('.');
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : '';
}

/**
 * Get content type from file extension
 */
export function getContentTypeFromExtension(extension: string): string {
  const contentTypes: Record<string, string> = {
    pdf: 'application/pdf',
    docx: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    txt: 'text/plain',
    png: 'image/png',
    jpg: 'image/jpeg',
    jpeg: 'image/jpeg',
    csv: 'text/csv',
    xlsx: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  };

  return contentTypes[extension] || 'application/octet-stream';
}
