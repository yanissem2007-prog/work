'use client';
import * as Dialog from '@radix-ui/react-dialog';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ModalProps {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'glass' | 'surface';
  className?: string;
}

const sizes = {
  sm: 'max-w-sm', md: 'max-w-md', lg: 'max-w-2xl', xl: 'max-w-4xl'
};

export function Modal({ open, onOpenChange, title, description, children, size = 'md', variant = 'glass', className }: ModalProps) {
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
                initial={{ opacity: 0, y: 24, scale: 0.96, filter: 'blur(8px)' }}
                animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: 12, scale: 0.97, filter: 'blur(6px)' }}
                transition={{ duration: 0.32, ease: [0.16, 1, 0.3, 1] }}
                className={cn(
                  'fixed left-1/2 top-1/2 z-[61] w-[92vw] -translate-x-1/2 -translate-y-1/2',
                  'rounded-2xl p-7',
                  variant === 'glass' ? 'glass-strong' : 'bg-bg-elev border border-border shadow-xl',
                  sizes[size],
                  className
                )}
              >
                <div className="flex items-start justify-between gap-4 mb-4">
                  <div className="flex-1">
                    {title && <Dialog.Title className="font-display text-xl tracking-snug">{title}</Dialog.Title>}
                    {description && <Dialog.Description className="text-sm text-muted mt-1">{description}</Dialog.Description>}
                  </div>
                  <Dialog.Close className="text-muted hover:text-fg transition rounded-lg p-1 -mr-1 -mt-1">
                    <X size={18} />
                  </Dialog.Close>
                </div>
                {children}
              </motion.div>
            </Dialog.Content>
          </Dialog.Portal>
        )}
      </AnimatePresence>
    </Dialog.Root>
  );
}
