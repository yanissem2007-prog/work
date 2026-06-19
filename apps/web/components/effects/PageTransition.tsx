// Passthrough. Per-page entrance animation now lives in app/(app)/template.tsx,
// which Next remounts on each navigation WITHOUT remounting the app shell.
//
// The previous implementation wrapped every route in <AnimatePresence mode="wait">
// keyed on pathname. In the Next App Router that traps the incoming page behind
// the outgoing page's exit animation, so navigations appeared blank until a manual
// refresh. Rendering children directly removes that trap entirely.
export function PageTransition({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
