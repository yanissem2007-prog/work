'use client';
import { useTranslations } from 'next-intl';

/**
 * Thin alias so we type less:
 *   const t = useT('feed'); t('compose')
 */
export function useT(namespace?: string) {
  return useTranslations(namespace);
}
