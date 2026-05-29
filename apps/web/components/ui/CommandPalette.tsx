'use client';
import { Command } from 'cmdk';
import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, Briefcase, Home, MessageSquare, Sparkles, Users, FileText, Settings } from 'lucide-react';
import { useUIStore } from '@/stores/uiStore';

const COMMANDS = [
  { label: 'Open Feed', href: '/feed', icon: Home },
  { label: 'Browse Jobs', href: '/jobs', icon: Briefcase },
  { label: 'Open Messages', href: '/messages', icon: MessageSquare },
  { label: 'AI Studio', href: '/ai', icon: Sparkles },
  { label: 'Communities', href: '/communities', icon: Users },
  { label: 'CV Builder', href: '/cv-builder', icon: FileText },
  { label: 'Settings', href: '/settings', icon: Settings }
];

export function CommandPalette() {
  const router = useRouter();
  const { cmdkOpen, setCmdk } = useUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setCmdk(!cmdkOpen);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [cmdkOpen, setCmdk]);

  return (
    <AnimatePresence>
      {cmdkOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/40 backdrop-blur-md"
            onClick={() => setCmdk(false)}
          />
          <motion.div
            initial={{ opacity: 0, y: -16, scale: 0.97, filter: 'blur(8px)' }}
            animate={{ opacity: 1, y: 0, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, y: -8, scale: 0.98, filter: 'blur(6px)' }}
            transition={{ duration: 0.28, ease: [0.16, 1, 0.3, 1] }}
            className="fixed left-1/2 top-[18%] z-[71] w-[92vw] max-w-xl -translate-x-1/2"
          >
            <Command className="glass-strong rounded-2xl overflow-hidden border border-glass">
              <div className="flex items-center gap-2 px-4 border-b border-border">
                <Search size={16} className="text-muted" />
                <Command.Input placeholder="Search or jump to…"
                  className="flex-1 h-12 bg-transparent outline-none text-sm" />
                <kbd className="text-2xs text-muted px-1.5 py-0.5 rounded border border-border">ESC</kbd>
              </div>
              <Command.List className="max-h-80 overflow-auto p-2">
                <Command.Empty className="px-3 py-6 text-center text-sm text-muted">No results.</Command.Empty>
                <Command.Group heading="Navigation" className="text-2xs uppercase tracking-caps text-muted px-2 py-1">
                  {COMMANDS.map(({ label, href, icon: Icon }) => (
                    <Command.Item
                      key={href}
                      onSelect={() => { router.push(href); setCmdk(false); }}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm cursor-pointer data-[selected=true]:bg-surface-2"
                    >
                      <Icon size={16} className="text-muted" /> {label}
                    </Command.Item>
                  ))}
                </Command.Group>
              </Command.List>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
