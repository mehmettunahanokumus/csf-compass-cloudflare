import { AlertTriangle, X } from 'lucide-react';

interface DeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: string;
  description?: string;
  onConfirm: () => void;
}

export default function DeleteConfirmDialog({
  open,
  onOpenChange,
  title = 'Are you sure?',
  description = 'This action cannot be undone.',
  onConfirm,
}: DeleteConfirmDialogProps) {
  if (!open) return null;

  const handleClose = () => onOpenChange(false);

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={handleClose}>
      <div
        className="bg-[#0E1018] border border-white/[0.07] rounded-2xl shadow-2xl max-w-md w-full mx-4"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-white/[0.06]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-500/10 border border-red-500/15 flex items-center justify-center">
              <AlertTriangle className="w-[18px] h-[18px] text-red-400" />
            </div>
            <h2 className="font-display text-lg font-bold text-[#F0F0F5]">{title}</h2>
          </div>
          <button onClick={handleClose} className="text-[#55576A] hover:text-[#F0F0F5] transition-colors p-1 rounded-lg hover:bg-white/[0.04]">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-6">
          <p className="font-sans text-sm text-[#8E8FA8] leading-relaxed">{description}</p>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 px-6 pb-6">
          <button
            onClick={handleClose}
            className="px-4 py-2.5 font-sans text-sm font-medium text-[#8E8FA8] border border-white/[0.07] rounded-lg hover:text-[#F0F0F5] hover:border-white/[0.12] transition-all"
          >
            Cancel
          </button>
          <button
            onClick={() => {
              onConfirm();
              handleClose();
            }}
            className="px-4 py-2.5 bg-red-500 text-white font-display text-sm font-semibold rounded-lg hover:bg-red-400 transition-colors"
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
