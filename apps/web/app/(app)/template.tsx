'use client';
import { motion } from 'framer-motion';

/**
 * Next remounts a template on every navigation, so this gives each app page a
 * fresh entrance animation while the layout (sidebar, topbar) stays mounted.
 * No AnimatePresence / mode="wait" → no "blank until refresh" trap.
 */
export default function AppTemplate({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}
