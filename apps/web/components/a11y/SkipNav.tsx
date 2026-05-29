export function SkipNav() {
  return (
    <a
      href="#main"
      className="sr-only focus:not-sr-only focus:fixed focus:top-3 focus:left-3 focus:z-[500]
                 focus:px-4 focus:py-2 focus:rounded-pill focus:bg-fg focus:text-bg focus:font-medium
                 focus:shadow-glow"
    >
      Skip to content
    </a>
  );
}
