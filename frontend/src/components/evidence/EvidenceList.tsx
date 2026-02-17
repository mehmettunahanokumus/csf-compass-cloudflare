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
      <div className="space-y-2">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-[52px] bg-white/[0.06] rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (files.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2 py-8">
        <Upload className="w-8 h-8 text-[#55576A]" />
        <span className="font-sans text-sm text-[#55576A]">
          No files uploaded yet
        </span>
      </div>
    );
  }

  return (
    <div className="space-y-1.5">
      {files.map((file) => {
        const Icon = getFileIcon(file.mimeType);

        return (
          <div
            key={file.id}
            className="flex items-center gap-3 bg-[#0E1018] border border-white/[0.07] rounded-lg p-3 hover:border-white/[0.12] transition-colors group"
          >
            <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center flex-shrink-0">
              <Icon className="w-4 h-4 text-amber-500/70" />
            </div>

            <div className="flex-1 min-w-0">
              <div className="font-sans text-sm font-medium text-[#F0F0F5] truncate">
                {file.fileName}
              </div>
              <div className="font-mono text-[10px] text-[#55576A] mt-0.5">
                {formatDate(file.uploadedAt)} · {formatFileSize(file.fileSize)}
              </div>
            </div>

            <div className="flex items-center gap-1 flex-shrink-0">
              <button
                onClick={() => onDownload(file.id)}
                title="Download"
                className="p-1.5 rounded-md text-[#55576A] hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
              >
                <Download className="w-4 h-4" />
              </button>
              <button
                onClick={() => onDelete(file.id)}
                title="Delete"
                className="p-1.5 rounded-md text-[#55576A] hover:text-red-400 hover:bg-red-500/10 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default EvidenceList;
