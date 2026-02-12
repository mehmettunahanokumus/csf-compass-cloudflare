import React, { useState, useRef, useCallback } from 'react';
import { Upload, AlertCircle, Loader2, X } from 'lucide-react';

interface FileUploaderProps {
  onUpload: (files: File[]) => Promise<void>;
  acceptedTypes?: string[];
  maxSizeMB?: number;
  disabled?: boolean;
}

const DEFAULT_ACCEPTED = ['.pdf', '.docx', '.xlsx', '.csv', '.txt', '.png', '.jpg', '.json', '.xml'];

const TYPE_LABELS: Record<string, string> = {
  '.pdf': 'PDF',
  '.docx': 'DOCX',
  '.xlsx': 'XLSX',
  '.csv': 'CSV',
  '.txt': 'TXT',
  '.png': 'PNG',
  '.jpg': 'JPG',
  '.json': 'JSON',
  '.xml': 'XML',
};

const FileUploader: React.FC<FileUploaderProps> = ({
  onUpload,
  acceptedTypes = DEFAULT_ACCEPTED,
  maxSizeMB = 10,
  disabled = false,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dragCounterRef = useRef(0);

  const validateFiles = useCallback(
    (files: File[]): string | null => {
      for (const file of files) {
        const ext = '.' + file.name.split('.').pop()?.toLowerCase();
        if (!acceptedTypes.includes(ext)) {
          return `File type "${ext}" is not accepted. Allowed: ${acceptedTypes.join(', ')}`;
        }
        if (file.size > maxSizeMB * 1024 * 1024) {
          return `File "${file.name}" exceeds the ${maxSizeMB}MB limit.`;
        }
      }
      return null;
    },
    [acceptedTypes, maxSizeMB]
  );

  const handleFiles = useCallback(
    async (files: File[]) => {
      if (disabled || files.length === 0) return;

      setError(null);
      const validationError = validateFiles(files);
      if (validationError) {
        setError(validationError);
        return;
      }

      setIsUploading(true);
      try {
        await onUpload(files);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Upload failed. Please try again.');
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, validateFiles, onUpload]
  );

  const handleDragEnter = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current += 1;
    if (dragCounterRef.current === 1) {
      setIsDragging(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    dragCounterRef.current -= 1;
    if (dragCounterRef.current === 0) {
      setIsDragging(false);
    }
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  }, []);

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragCounterRef.current = 0;
      setIsDragging(false);
      const files = Array.from(e.dataTransfer.files);
      handleFiles(files);
    },
    [handleFiles]
  );

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    handleFiles(files);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        style={{
          border: error
            ? '2px dashed var(--red)'
            : isDragging
              ? '2px dashed var(--accent)'
              : '2px dashed var(--border)',
          borderRadius: 'var(--radius-md)',
          padding: '32px 24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          cursor: disabled ? 'not-allowed' : 'pointer',
          background: isDragging ? 'var(--accent-subtle)' : 'transparent',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
      >
        {isUploading ? (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Loader2
                size={48}
                style={{ color: 'var(--accent)', animation: 'spin 1s linear infinite' }}
              />
            </div>
            <span
              style={{
                fontSize: '14px',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Uploading...
            </span>
            <div
              style={{
                width: '200px',
                height: '4px',
                borderRadius: '2px',
                background: 'var(--gray-subtle)',
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: '60%',
                  borderRadius: '2px',
                  background: 'var(--accent)',
                  animation: 'uploadProgress 1.5s ease-in-out infinite',
                }}
              />
            </div>
          </>
        ) : error ? (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--red-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <AlertCircle size={48} style={{ color: 'var(--red)' }} />
            </div>
            <span
              style={{
                fontSize: '14px',
                color: 'var(--red-text)',
                fontFamily: 'var(--font-sans)',
                textAlign: 'center',
                maxWidth: '400px',
              }}
            >
              {error}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '4px',
                padding: '6px 12px',
                border: '1px solid var(--border)',
                borderRadius: 'var(--radius-sm)',
                background: 'transparent',
                color: 'var(--text-2)',
                fontSize: '12px',
                fontFamily: 'var(--font-sans)',
                cursor: 'pointer',
              }}
            >
              <X size={12} />
              Dismiss
            </button>
          </>
        ) : (
          <>
            <div
              style={{
                width: '80px',
                height: '80px',
                borderRadius: '50%',
                background: 'var(--accent-subtle)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <Upload size={48} style={{ color: 'var(--accent)' }} />
            </div>
            <span
              style={{
                fontSize: '14px',
                color: 'var(--text-2)',
                fontFamily: 'var(--font-sans)',
              }}
            >
              Drag and drop files here, or click to browse
            </span>
            <div
              style={{
                display: 'flex',
                flexWrap: 'wrap',
                gap: '6px',
                justifyContent: 'center',
              }}
            >
              {acceptedTypes.map((type) => (
                <span
                  key={type}
                  style={{
                    padding: '2px 8px',
                    borderRadius: '4px',
                    background: 'var(--gray-subtle)',
                    color: 'var(--text-3)',
                    fontSize: '11px',
                    fontWeight: 500,
                    fontFamily: 'var(--font-mono)',
                  }}
                >
                  {TYPE_LABELS[type] || type.replace('.', '').toUpperCase()}
                </span>
              ))}
            </div>
          </>
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept={acceptedTypes.join(',')}
          onChange={handleInputChange}
          style={{ display: 'none' }}
        />
      </div>

      <style>{`
        @keyframes uploadProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(80%); }
          100% { transform: translateX(250%); }
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default FileUploader;
