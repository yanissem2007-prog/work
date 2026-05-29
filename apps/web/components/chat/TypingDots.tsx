'use client';
export function TypingDots({ name }: { name?: string }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 text-xs text-muted">
      <span className="inline-flex gap-0.5">
        {[0, 0.15, 0.3].map((d, i) => (
          <span key={i}
            className="size-1.5 rounded-full bg-muted animate-[dot-bounce_1.2s_infinite]"
            style={{ animationDelay: `${d}s` }} />
        ))}
      </span>
      {name ? `${name} is typing…` : 'Typing…'}
    </div>
  );
}
