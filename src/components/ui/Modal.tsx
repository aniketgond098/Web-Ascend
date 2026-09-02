import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: React.ReactNode;
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl';
  showCloseButton?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'md',
  showCloseButton = true,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const maxStyles = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 overflow-y-auto">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-[#04060a]/80 backdrop-blur-md"
          />

          {/* Dialog Body */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 15 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 15 }}
            transition={{ type: 'spring', duration: 0.35, bounce: 0.1 }}
            className={`
              relative w-full ${maxStyles[maxWidth]} my-8
              bg-[#0a0f1d] border border-slate-700/80 rounded-2xl p-6
              shadow-[0_0_40px_rgba(0,0,0,0.8),0_0_20px_rgba(56,189,248,0.15)]
              z-10
            `}
          >
            {/* Tech Corner Accents */}
            <div className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 border-[#ff334b] rounded-tl-xl" />
            <div className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 border-[#ff334b] rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 border-[#38bdf8] rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 border-[#38bdf8] rounded-br-xl" />

            {/* Header */}
            <div className="flex justify-between items-start mb-5 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-lg font-bold text-white uppercase tracking-wider font-['Chakra_Petch']">
                  {title}
                </h3>
                {subtitle && (
                  <p className="text-xs text-slate-400 font-mono mt-0.5 tracking-wide">
                    {subtitle}
                  </p>
                )}
              </div>
              {showCloseButton && (
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
                  aria-label="Close modal"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>

            {/* Content */}
            <div className="text-slate-200">{children}</div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
