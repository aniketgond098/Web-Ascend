import React from 'react';
import { Modal } from '../ui/Modal';
import { AlertTriangle, Trash2, RotateCcw } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  subtitle?: string;
  itemName?: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  icon?: 'trash' | 'alert' | 'reset';
}

export const ConfirmModal: React.FC<ConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  subtitle = 'SYSTEM AUTHORIZATION REQUIRED',
  itemName,
  message,
  confirmText = 'CONFIRM ACTION',
  cancelText = 'CANCEL',
  isDestructive = true,
  icon = 'trash',
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      subtitle={subtitle}
      maxWidth="sm"
    >
      <div className="space-y-4 text-xs font-mono">
        <div className="flex items-start gap-3.5 p-3 rounded-xl bg-[#090D18] border border-blue-900/30">
          <div
            className={`p-2.5 rounded-lg shrink-0 ${
              isDestructive
                ? 'bg-red-950/60 border border-red-500/40 text-red-400'
                : 'bg-amber-950/60 border border-amber-500/40 text-amber-400'
            }`}
          >
            {icon === 'reset' ? (
              <RotateCcw className="w-5 h-5" />
            ) : icon === 'trash' ? (
              <Trash2 className="w-5 h-5" />
            ) : (
              <AlertTriangle className="w-5 h-5" />
            )}
          </div>

          <div className="space-y-1 min-w-0">
            {itemName && (
              <div className="text-white font-bold font-sans text-sm truncate">
                {itemName}
              </div>
            )}
            <p className="text-slate-300 leading-relaxed font-sans text-xs">
              {message}
            </p>
          </div>
        </div>

        <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-blue-900/20">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-slate-900 hover:bg-slate-800 text-slate-300 font-mono text-xs transition-colors cursor-pointer border border-slate-700"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2 rounded-lg font-mono text-xs font-bold uppercase tracking-wider transition-all cursor-pointer shadow-sm ${
              isDestructive
                ? 'bg-red-600 hover:bg-red-500 text-white shadow-[0_0_12px_rgba(239,68,68,0.3)]'
                : 'bg-amber-600 hover:bg-amber-500 text-white shadow-[0_0_12px_rgba(245,158,11,0.3)]'
            }`}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </Modal>
  );
};
