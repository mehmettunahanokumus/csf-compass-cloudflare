import React from 'react';
import { FileText, Image, FileSpreadsheet, Download, Trash2, Upload } from 'lucide-react';

interface EvidenceFile {
  id: string;
  fileName: string;
  fileSize: number;
  mimeType: string;
  uploadedAt: string | number;
}

interface EvidenceListProps {
  files: EvidenceFile[];
  onDownload: (fileId: string) => void;
  onDelete: (fileId: string) => void;
  isLoading?: boolean;
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function formatDate(dateValue: string | number): string {
  const date = typeof dateValue === 'number' ? new Date(dateValue * 1000) : new Date(dateValue);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getFileIcon(mimeType: string) {
  if (mimeType.startsWith('image/')) return Image;
  if (
    mimeType.includes('spreadsheet') ||
    mimeType.includes('excel') ||
    mimeType.includes('csv')
  ) {
    return FileSpreadsheet;
  }
  return FileText;
}

const EvidenceList: React.FC<EvidenceListProps> = ({
  files,
  onDownload,
  onDelete,
  isLoading = false,
}) => {
  if (isLoading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="skeleton"
            style={{ height: '52px', borderRadius: 'var(--radius-sm)' }}
          />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '8px',
          padding: '32px 16px',
        }}
      >
        <Upload size={32} style={{ color: 'var(--text-4)' }} />
        <span
          style={{
            fontSize: '13px',
            color: 'var(--text-3)',
            fontFamily: 'var(--font-sans)',
          }}
        >
          No files uploaded yet
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
      {files.map((file) => {
        const Icon = getFileIcon(file.mimeType);

        return (
          <div
            key={file.id}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '12px',
              padding: '10px 12px',
              borderRadius: 'var(--radius-sm)',
              border: '1px solid var(--border)',
              background: 'var(--card)',
              transition: 'border-color 0.15s ease',
            }}
            onMouseEnter={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border-hover)';
            }}
            onMouseLeave={(e) => {
              (e.currentTarget as HTMLDivElement).style.borderColor = 'var(--border)';
            }}
          >
            <div
              style={{
                width: '36px',
                height: '36px',
                borderRadius: 'var(--radius-sm)',
                background: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Icon size={18} style={{ color: 'var(--accent)' }} />
            </div>

            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 500,
                  color: 'var(--text-1)',
                  fontFamily: 'var(--font-sans)',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}
              >
                {file.fileName}
              </div>
              <div
                style={{
                  fontSize: '11px',
                  color: 'var(--text-3)',
                  fontFamily: 'var(--font-sans)',
                  marginTop: '2px',
                }}
              >
                {formatDate(file.uploadedAt)} · {formatFileSize(file.fileSize)}
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', flexShrink: 0 }}>
              <button
                onClick={() => onDownload(file.id)}
                title="Download"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--accent-subtle)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--accent)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
                }}
              >
                <Download size={16} />
              </button>
              <button
                onClick={() => onDelete(file.id)}
                title="Delete"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  width: '32px',
                  height: '32px',
                  border: 'none',
                  borderRadius: 'var(--radius-sm)',
                  background: 'transparent',
                  color: 'var(--text-3)',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'var(--red-subtle)';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--red-text)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLButtonElement).style.background = 'transparent';
                  (e.currentTarget as HTMLButtonElement).style.color = 'var(--text-3)';
                }}
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EvidenceList;
