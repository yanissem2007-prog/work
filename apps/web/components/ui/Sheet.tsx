'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  /** Edge the panel slides in from. */
  side?: 'left' | 'right';
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

const widths = { sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-lg', xl: 'max-w-2xl' };

/**
 * Slide-over panel (drawer) built on Radix Dialog. Anchors to the left or right
 * edge, full height, with a header + scrollable body. Used for filters, apply
 * flows and order forms.
 */
export function Sheet({
  open, onOpenChange, title, description, children, side = 'right', size = 'md', className
}: SheetProps) {
  const offscreen = side === 'right' ? '100%' : '-100%';
  return (
    <Dialog.Root open={open} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {open && (
          <Dialog.Portal forceMount>
            <Dialog.Overlay asChild>
              <motion.div
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                className="fixed inset-0 z-[60] bg-black/40 backdrop-blur-md"
              />
            </Dialog.Overlay>
            <Dialog.Content asChild>
              <motion.div
                initial={{ x: offscreen }}
                animate={{ x: 0 }}
                exit={{ x: offscreen }}
                transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'fixed inset-y-0 z-[61] flex w-[92vw] flex-col glass-strong',
                  side === 'right' ? 'right-0 border-l border-border' : 'left-0 border-r border-border',
                  widths[size],
                  className
                )}
              >
                <header className="flex items-start justify-between gap-4 border-b border-border p-5">
                  <div className="min-w-0 flex-1">
                    {title
                      ? <Dialog.Title className="font-display text-xl tracking-snug truncate">{title}</Dialog.Title>
                      : <Dialog.Title className="sr-only">Panel</Dialog.Title>}
                    {description && <Dialog.Description className="mt-1 text-sm text-muted">{description}</Dialog.Description>}
                  </div>
                  <Dialog.Close
                    aria-label="Close"
                    className="-mr-1 rounded-lg p-1.5 text-muted transition-colors hover:bg-surface hover:text-fg"
                  >
                    <X size={18} />
                  </Dialog.Close>
                </header>
                <div className="flex-1 overflow-y-auto p-5">{children}</div>
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
