'use client';
import {  } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { Printer } from 'lucide-react';
import type { Cv } from '@work/types';
import { api } from '@/lib/api';
import { TEMPLATES_MAP } from '@/components/cv/templates';
import { Spinner } from '@/components/ui/Spinner';
import { Button } from '@/components/ui/Button';

export default function PublicCvPage() {
  const { slug } = useParams();
  const { data: cv, isLoading } = useQuery<Cv>({
    queryKey: ['public-cv', slug],
    queryFn: async () => (await api.get(`/cv/public/${slug}`)).data.data
  });

  if (isLoading) return <div className="grid place-items-center min-h-dvh"><Spinner /></div>;
  if (!cv) return <p className="grid place-items-center min-h-dvh text-muted">CV not found.</p>;

  const Template = TEMPLATES_MAP[cv.template];

  return (
    <main className="min-h-dvh bg-neutral-200/40 dark:bg-neutral-900/50 print:bg-white">
      <div className="max-w-3xl mx-auto py-8 px-4 print:py-0 print:px-0">
        <header className="flex items-center justify-between mb-4 no-print">
          <p className="text-sm text-muted">{cv.title}</p>
          <Button size="sm" variant="accent" onClick={() => window.print()}>
            <Printer size={13} /> Print
          </Button>
        </header>
        <div className="cv-page bg-white text-black shadow-xl mx-auto" style={{ width: '210mm', maxWidth: '100%' }}>
          <Template cv={cv} />
        </div>
      </div>
      <style jsx global>{`
        @media print {
          .no-print { display: none !important; }
          html, body { background: #fff !important; }
          .cv-page { box-shadow: none !important; width: 100% !important; }
        }
        @page { size: A4; margin: 0; }
      `}</style>
    </main>
  );
}
