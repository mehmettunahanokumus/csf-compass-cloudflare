/**
 * R2 Storage Utilities
 *
 * Handles file operations with Cloudflare R2:
 * - File uploads
 * - Presigned download URLs (JWT-based)
 * - File deletions
 */

import jwt from '@tsndr/cloudflare-worker-jwt';

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
 * Generate a signed download token (JWT)
 *
 * @param jwtSecret - Secret key for signing
 * @param r2Key - R2 file path
 * @param expiresIn - Expiration time in seconds (default: 1 hour)
 * @returns Signed JWT token
 */
export async function generateDownloadToken(
  jwtSecret: string,
  r2Key: string,
  expiresIn: number = 3600
): Promise<string> {
  const exp = Math.floor(Date.now() / 1000) + expiresIn;
  const token = await jwt.sign({ key: r2Key, exp }, jwtSecret);
  return token;
}

/**
 * Validate and decode signed download token
 *
 * @param jwtSecret - Secret key for verification
 * @param token - JWT token
 * @returns Decoded payload with file path or null if invalid
 */
export async function validateDownloadToken(
  jwtSecret: string,
  token: string
): Promise<{ key: string } | null> {
  try {
    const isValid = await jwt.verify(token, jwtSecret);
    if (!isValid) return null;

    const { payload } = jwt.decode(token) as { payload: Record<string, unknown> };
    if (typeof payload.exp === 'number' && payload.exp < Math.floor(Date.now() / 1000)) {
      return null;
    }
    if (!payload.key || typeof payload.key !== 'string') {
      return null;
    }
    return { key: payload.key };
  } catch {
    return null;
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
 * Magic byte signatures for allowed file types.
 * Used to verify file content matches declared MIME type.
 */
const MAGIC_BYTES: Record<string, number[][]> = {
  'application/pdf': [[0x25, 0x50, 0x44, 0x46]], // %PDF
  'image/png': [[0x89, 0x50, 0x4E, 0x47]], // .PNG
  'image/jpeg': [[0xFF, 0xD8, 0xFF]], // JFIF/EXIF
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': [[0x50, 0x4B, 0x03, 0x04]], // PK (ZIP)
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': [[0x50, 0x4B, 0x03, 0x04]], // PK (ZIP)
};

/**
 * Validate file type, size, and content magic bytes
 *
 * @param contentType - MIME type
 * @param size - File size in bytes
 * @param fileBytes - Optional first bytes of file for magic byte validation
 * @returns Validation result
 */
export function validateFile(contentType: string, size: number, fileBytes?: Uint8Array): {
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

  // Verify magic bytes if available (skip for text types)
  if (fileBytes && MAGIC_BYTES[contentType]) {
    const signatures = MAGIC_BYTES[contentType];
    const matches = signatures.some(sig =>
      sig.every((byte, i) => fileBytes[i] === byte)
    );
    if (!matches) {
      return {
        valid: false,
        error: 'File content does not match declared file type',
      };
    }
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
