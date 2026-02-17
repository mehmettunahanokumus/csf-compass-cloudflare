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

  const borderClass = error
    ? 'border-red-500/50'
    : isDragging
      ? 'border-amber-500/60 bg-amber-500/[0.05]'
      : 'border-white/[0.12] hover:border-amber-500/40 bg-white/[0.02]';

  return (
    <div>
      <div
        onClick={handleClick}
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className={`border-2 border-dashed rounded-xl p-8 flex flex-col items-center gap-4 transition-all cursor-pointer ${borderClass} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        {isUploading ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-amber-400 animate-spin" />
            </div>
            <span className="font-sans text-sm text-[#8E8FA8]">
              Uploading...
            </span>
            <div className="w-48 h-1 bg-white/[0.06] rounded-full overflow-hidden">
              <div className="h-full w-3/5 bg-amber-500 rounded-full animate-[uploadProgress_1.5s_ease-in-out_infinite]" />
            </div>
          </>
        ) : error ? (
          <>
            <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-red-400" />
            </div>
            <span className="font-sans text-sm text-red-400 text-center max-w-[400px]">
              {error}
            </span>
            <button
              onClick={(e) => {
                e.stopPropagation();
                setError(null);
              }}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white/[0.04] border border-white/[0.07] text-[#8E8FA8] font-sans text-xs rounded-lg hover:border-white/[0.15] hover:text-[#F0F0F5] transition-all"
            >
              <X className="w-3 h-3" />
              Dismiss
            </button>
          </>
        ) : (
          <>
            <div className="w-16 h-16 rounded-2xl bg-amber-500/10 border border-amber-500/15 flex items-center justify-center group-hover:bg-amber-500/15 transition-colors">
              <Upload className="w-8 h-8 text-amber-500/60" />
            </div>
            <span className="font-sans text-sm text-[#8E8FA8]">
              Drop files here or click to upload
            </span>
            <div className="flex flex-wrap gap-1.5 justify-center">
              {acceptedTypes.map((type) => (
                <span
                  key={type}
                  className="font-mono text-[10px] font-medium bg-white/[0.05] text-[#55576A] px-2 py-0.5 rounded"
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
          className="hidden"
        />
      </div>

      <style>{`
        @keyframes uploadProgress {
          0% { transform: translateX(-100%); }
          50% { transform: translateX(80%); }
          100% { transform: translateX(250%); }
        }
      `}</style>
    </div>
  );
};

export default FileUploader;
