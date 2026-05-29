'use client';
import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles } from 'lucide-react';
import { AIPanel } from './AIPanel';
import { useAuthStore } from '@/stores/authStore';

export function FloatingAIButton() {
  const [open, setOpen] = useState(false);
  const user = useAuthStore((s) => s.user);

  // Keyboard shortcut: ⌘ + I
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'i') {
        e.preventDefault();
        setOpen((v) => !v);
      }
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, []);

  if (!user) return null;

  return (
    <>
      <motion.button
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.6, type: 'spring', stiffness: 380, damping: 22 }}
        onClick={() => setOpen(true)}
        aria-label="Open WORK AI"
        className="fixed bottom-20 lg:bottom-6 right-4 sm:right-6 z-[80] group"
      >
        <span className="absolute inset-0 rounded-full bg-grad-accent blur-xl opacity-50 group-hover:opacity-80 transition-opacity animate-pulse-glow" />
        <span className="relative flex items-center gap-2 pl-3 pr-4 py-2.5 rounded-full bg-grad-accent text-accent-fg font-medium text-sm shadow-glow hover:scale-105 active:scale-95 transition">
          <Sparkles size={15} />
          <span className="hidden sm:inline">Ask AI</span>
          <kbd className="hidden md:inline-flex text-[10px] px-1.5 py-0.5 rounded-md bg-black/20 text-accent-fg/80">⌘ I</kbd>
        </span>
      </motion.button>

      <AIPanel open={open} onOpenChange={setOpen} />
    </>
  );
}
