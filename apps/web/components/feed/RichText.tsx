import Link from 'next/link';
import { Fragment } from 'react';

// Tokenize plain post text into safe, clickable nodes. No dangerouslySetInnerHTML —
// every segment is rendered as a typed React node, so user content can never inject markup.
const TOKEN = /(#[\p{L}0-9_]+|@[a-z0-9_]{2,30}|https?:\/\/[^\s]+)/giu;

interface Props {
  text: string;
  className?: string;
}

export function RichText({ text, className }: Props) {
  const parts = text.split(TOKEN);

  return (
    <p className={className}>
      {parts.map((part, i) => {
        if (!part) return null;

        if (part.startsWith('#')) {
          const tag = part.slice(1);
          return (
            <Link
              key={i}
              href={`/search?q=${encodeURIComponent('#' + tag)}`}
              className="text-accent hover:underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        if (part.startsWith('@')) {
          return (
            <Link
              key={i}
              href={`/profile/${part.slice(1)}`}
              className="text-accent hover:underline underline-offset-2"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </Link>
          );
        }

        if (/^https?:\/\//i.test(part)) {
          let label = part.replace(/^https?:\/\//i, '').replace(/\/$/, '');
          if (label.length > 42) label = label.slice(0, 42) + '…';
          return (
            <a
              key={i}
              href={part}
              target="_blank"
              rel="noopener noreferrer nofollow"
              className="text-accent hover:underline underline-offset-2 break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {label}
            </a>
          );
        }

        return <Fragment key={i}>{part}</Fragment>;
      })}
    </p>
  );
}
