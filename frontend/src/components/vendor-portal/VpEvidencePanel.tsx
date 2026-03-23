/**
 * VpEvidencePanel - Compact evidence file upload panel for vendor portal
 *
 * Embeddable in ControlItem or VpConsolidatedQuestion cards.
 * Handles upload, list, download, and delete of evidence files.
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import { Upload, Trash2, Download, FileText, Image, File, Loader2, AlertCircle, X } from 'lucide-react';
import { T, card } from '../../tokens';
import { vendorInvitationsApi } from '../../api/vendor-invitations';
import type { EvidenceFile } from '../../types';
import { API_BASE_URL } from '../../api/client';

interface VpEvidencePanelProps {
  token: string;
  itemId: string;
  assessmentId: string;
}

/** Human-readable file size */
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Icon component based on MIME type */
function FileIcon({ type }: { type?: string }) {
  const size = 16;
  const color = T.textMuted;
  if (type?.startsWith('image/')) return <Image size={size} color={color} />;
  if (type === 'application/pdf') return <FileText size={size} color="#ef4444" />;
  return <File size={size} color={color} />;
}

export default function VpEvidencePanel({ token, itemId, assessmentId }: VpEvidencePanelProps) {
  const [files, setFiles] = useState<EvidenceFile[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load evidence files
  const loadFiles = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await vendorInvitationsApi.getEvidenceForItem(token, itemId);
      setFiles(result);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to load evidence files';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [token, itemId]);

  useEffect(() => {
    loadFiles();
  }, [loadFiles]);

  // Upload handler
  const handleUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setUploading(true);
      setError(null);
      setUploadProgress(`Uploading ${file.name}...`);
      const uploaded = await vendorInvitationsApi.uploadEvidence(token, file, itemId);
      setFiles(prev => [uploaded, ...prev]);
      setUploadProgress(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to upload file';
      // Try to extract API error message
      const apiErr = err as { response?: { data?: { error?: string } } };
      setError(apiErr?.response?.data?.error || message);
      setUploadProgress(null);
    } finally {
      setUploading(false);
      // Reset file input so the same file can be re-selected
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  }, [token, itemId]);

  // Delete handler
  const handleDelete = useCallback(async (evidenceId: string) => {
    try {
      setDeleting(evidenceId);
      setError(null);
      await vendorInvitationsApi.deleteEvidence(token, evidenceId);
      setFiles(prev => prev.filter(f => f.id !== evidenceId));
      setDeleteConfirmId(null);
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to delete file';
      setError(message);
    } finally {
      setDeleting(null);
    }
  }, [token]);

  // Build download URL
  const getDownloadUrl = (file: EvidenceFile) => {
    if (file.download_url) {
      return `${API_BASE_URL}${file.download_url}`;
    }
    return '#';
  };

  return (
    <div style={{
      marginTop: 12,
      padding: 12,
      background: T.bg,
      border: `1px solid ${T.borderLight}`,
      borderRadius: 8,
    }}>
      {/* Header row */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: files.length > 0 || loading ? 8 : 0,
      }}>
        <span style={{
          fontFamily: T.fontSans,
          fontSize: 11,
          fontWeight: 700,
          letterSpacing: '0.05em',
          textTransform: 'uppercase' as const,
          color: T.textMuted,
        }}>
          Evidence Files
          {files.length > 0 && (
            <span style={{
              marginLeft: 6,
              fontWeight: 600,
              fontSize: 10,
              color: T.textFaint,
            }}>
              ({files.length})
            </span>
          )}
        </span>

        {/* Upload button */}
        <label style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          padding: '4px 10px',
          borderRadius: 6,
          border: `1px solid ${T.accentBorder}`,
          background: T.accentLight,
          color: T.accent,
          fontFamily: T.fontSans,
          fontSize: 11,
          fontWeight: 600,
          cursor: uploading ? 'not-allowed' : 'pointer',
          opacity: uploading ? 0.6 : 1,
          transition: 'opacity 0.15s',
        }}>
          {uploading ? (
            <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          ) : (
            <Upload size={12} />
          )}
          {uploading ? 'Uploading...' : 'Upload'}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.docx,.txt,.png,.jpg,.jpeg,.csv,.xlsx"
            onChange={handleUpload}
            disabled={uploading}
            style={{ display: 'none' }}
          />
        </label>
      </div>

      {/* Upload progress */}
      {uploadProgress && (
        <div style={{
          padding: '6px 10px',
          borderRadius: 6,
          background: T.skyLight,
          color: T.sky,
          fontFamily: T.fontSans,
          fontSize: 11,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <Loader2 size={12} style={{ animation: 'spin 1s linear infinite' }} />
          {uploadProgress}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div style={{
          padding: '6px 10px',
          borderRadius: 6,
          background: T.dangerLight,
          color: T.danger,
          fontFamily: T.fontSans,
          fontSize: 11,
          marginBottom: 8,
          display: 'flex',
          alignItems: 'center',
          gap: 6,
        }}>
          <AlertCircle size={12} />
          {error}
          <button
            onClick={() => setError(null)}
            style={{
              marginLeft: 'auto',
              background: 'none',
              border: 'none',
              cursor: 'pointer',
              padding: 0,
              color: T.danger,
              display: 'flex',
            }}
          >
            <X size={12} />
          </button>
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: 16,
          color: T.textMuted,
        }}>
          <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}

      {/* File list */}
      {!loading && files.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {files.map(file => (
            <div
              key={file.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                padding: '6px 8px',
                borderRadius: 6,
                background: T.card,
                border: `1px solid ${T.borderLight}`,
              }}
            >
              {/* File icon */}
              <FileIcon type={file.file_type} />

              {/* File info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontFamily: T.fontSans,
                  fontSize: 12,
                  fontWeight: 500,
                  color: T.textPrimary,
                  whiteSpace: 'nowrap' as const,
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {file.file_name}
                </div>
                <div style={{
                  fontFamily: T.fontSans,
                  fontSize: 10,
                  color: T.textFaint,
                }}>
                  {formatFileSize(file.file_size)}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                {/* Download */}
                <a
                  href={getDownloadUrl(file)}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    width: 26,
                    height: 26,
                    borderRadius: 4,
                    background: 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    color: T.textMuted,
                    textDecoration: 'none',
                    transition: 'color 0.15s',
                  }}
                  title="Download file"
                >
                  <Download size={13} />
                </a>

                {/* Delete */}
                {deleteConfirmId === file.id ? (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleting === file.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: T.dangerLight,
                        border: `1px solid ${T.dangerBorder}`,
                        cursor: deleting === file.id ? 'not-allowed' : 'pointer',
                        color: T.danger,
                        fontFamily: T.fontSans,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      {deleting === file.id ? (
                        <Loader2 size={10} style={{ animation: 'spin 1s linear infinite' }} />
                      ) : (
                        'Yes'
                      )}
                    </button>
                    <button
                      onClick={() => setDeleteConfirmId(null)}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        padding: '2px 6px',
                        borderRadius: 4,
                        background: T.card,
                        border: `1px solid ${T.border}`,
                        cursor: 'pointer',
                        color: T.textMuted,
                        fontFamily: T.fontSans,
                        fontSize: 10,
                        fontWeight: 600,
                      }}
                    >
                      No
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirmId(file.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      width: 26,
                      height: 26,
                      borderRadius: 4,
                      background: 'transparent',
                      border: 'none',
                      cursor: 'pointer',
                      color: T.textMuted,
                      transition: 'color 0.15s',
                    }}
                    title="Delete file"
                  >
                    <Trash2 size={13} />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Empty state (not loading, no files) */}
      {!loading && files.length === 0 && !error && (
        <div style={{
          padding: '8px 0 0',
          fontFamily: T.fontSans,
          fontSize: 11,
          color: T.textFaint,
          textAlign: 'center' as const,
        }}>
          No evidence files uploaded yet.
        </div>
      )}

      {/* CSS animation for spinner */}
      <style>{`
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
