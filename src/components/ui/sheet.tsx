import * as React from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface SheetProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  children: React.ReactNode;
  side?: 'top' | 'right' | 'bottom' | 'left';
  className?: string;
  title?: string;
}

export function Sheet({
  open,
  onOpenChange,
  children,
  side = 'right',
  className,
  title,
}: SheetProps) {
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onOpenChange(false);
      }
    };
    if (open) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  const sideAnimations = {
    top: 'inset-x-0 top-0 border-b border-slate-800 animate-in slide-in-from-top duration-300',
    bottom: 'inset-x-0 bottom-0 border-t border-slate-800 animate-in slide-in-from-bottom duration-300',
    left: 'inset-y-0 left-0 h-full w-3/4 max-w-sm border-r border-slate-800 animate-in slide-in-from-left duration-300',
    right: 'inset-y-0 right-0 h-full w-full max-w-md border-l border-slate-800 animate-in slide-in-from-right duration-300',
  };

  return createPortal(
    <div className="fixed inset-0 z-50 flex">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-sm transition-opacity"
        onClick={() => onOpenChange(false)}
        aria-hidden="true"
      />

      {/* Sheet Content */}
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title || 'Panel'}
        className={cn(
          'fixed z-50 flex flex-col bg-slate-950 p-6 shadow-2xl transition ease-in-out',
          sideAnimations[side],
          className
        )}
      >
        <div className="flex items-center justify-between pb-4 border-b border-slate-800">
          {title ? (
            <h2 className="text-lg font-bold text-white tracking-tight">{title}</h2>
          ) : (
            <div />
          )}
          <button
            onClick={() => onOpenChange(false)}
            className="rounded-lg p-1.5 text-slate-400 hover:text-white hover:bg-slate-800 transition-colors focus:outline-none focus:ring-2 focus:ring-sky-500"
            aria-label="Kapat"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-4">
          {children}
        </div>
      </div>
    </div>,
    document.body
  );
}
