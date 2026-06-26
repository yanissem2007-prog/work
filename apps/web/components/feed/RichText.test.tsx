import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { RichText } from './RichText';

// next/link needs a router context; stub it to a plain anchor for unit tests.
vi.mock('next/link', () => ({
  default: ({ href, children, ...p }: any) => <a href={href} {...p}>{children}</a>
}));

describe('RichText', () => {
  it('linkifies hashtags to search', () => {
    render(<RichText text="I love #react today" />);
    const tag = screen.getByText('#react');
    expect(tag.tagName).toBe('A');
    expect(tag.getAttribute('href')).toContain('%23react');
  });

  it('linkifies @mentions to profiles', () => {
    render(<RichText text="thanks @sara" />);
    expect(screen.getByText('@sara').getAttribute('href')).toBe('/profile/sara');
  });

  it('renders external links safely (target + rel)', () => {
    render(<RichText text="see https://example.com/page now" />);
    const a = screen.getByText(/example\.com/);
    expect(a.getAttribute('target')).toBe('_blank');
    expect(a.getAttribute('rel')).toContain('noopener');
  });

  it('renders plain text unchanged', () => {
    render(<RichText text="just some words" />);
    expect(screen.getByText('just some words')).toBeInTheDocument();
  });
});
