'use client';
import type { Cv, CvSection } from '@work/types';

type Personal = { name?: string; headline?: string; email?: string; phone?: string; location?: string; website?: string };
type ExpItem = { company?: string; role?: string; start?: string; end?: string; current?: boolean; location?: string; description?: string };
type EduItem = { school?: string; degree?: string; field?: string; start?: string; end?: string };
type ProjectItem = { title?: string; description?: string; url?: string };
type SkillItem = { name?: string } | string;
type LinkItem = { label?: string; url?: string };

function personal(s?: CvSection): Personal {
  return (s?.items?.[0] as Personal) ?? {};
}

function fmtDate(d?: string) {
  if (!d) return '';
  const dt = new Date(d);
  if (Number.isNaN(dt.getTime())) return d;
  return dt.toLocaleDateString(undefined, { month: 'short', year: 'numeric' });
}

interface PreviewProps { cv: Cv }

/* ─── MINIMAL ─── */
export function MinimalTemplate({ cv }: PreviewProps) {
  const visible = cv.sections.filter((s) => s.visible);
  const p = personal(visible.find((s) => s.type === 'personal'));
  return (
    <article className="p-12 text-black font-sans leading-relaxed" style={{ fontSize: 11 }}>
      <header className="mb-6">
        <h1 className="text-3xl tracking-tight font-semibold">{p.name || 'Your Name'}</h1>
        <p className="text-base text-neutral-600 mt-1">{p.headline}</p>
        <p className="text-xs text-neutral-500 mt-2">
          {[p.email, p.phone, p.location, p.website].filter(Boolean).join(' · ')}
        </p>
      </header>

      {visible.map((s) => {
        if (s.type === 'personal') return null;
        return (
          <section key={s.id} className="mb-5">
            <h2 className="text-[10px] uppercase tracking-[0.18em] text-neutral-500 font-medium mb-2"
              style={{ borderBottom: `2px solid ${cv.accent}`, paddingBottom: 4 }}>
              {s.title ?? s.type}
            </h2>
            <SectionBody section={s} />
          </section>
        );
      })}
    </article>
  );
}

/* ─── EDITORIAL — two columns ─── */
export function EditorialTemplate({ cv }: PreviewProps) {
  const visible = cv.sections.filter((s) => s.visible);
  const p = personal(visible.find((s) => s.type === 'personal'));
  const main = visible.filter((s) => ['summary', 'experience', 'projects'].includes(s.type));
  const side = visible.filter((s) => ['skills', 'education', 'languages', 'certifications', 'links'].includes(s.type));

  return (
    <article className="text-black font-serif leading-relaxed" style={{ fontSize: 11 }}>
      <div className="p-10 text-white" style={{ background: cv.accent }}>
        <h1 className="text-4xl tracking-tighter font-bold">{p.name || 'Your Name'}</h1>
        <p className="text-lg mt-1 opacity-90">{p.headline}</p>
      </div>
      <div className="grid grid-cols-[1fr_180px] gap-8 p-10">
        <div>
          <p className="text-xs text-neutral-500 mb-6">
            {[p.email, p.phone, p.location, p.website].filter(Boolean).join(' · ')}
          </p>
          {main.map((s) => (
            <section key={s.id} className="mb-6">
              <h2 className="font-bold text-base mb-2 italic" style={{ color: cv.accent }}>
                {s.title ?? s.type}
              </h2>
              <SectionBody section={s} />
            </section>
          ))}
        </div>
        <aside className="space-y-6">
          {side.map((s) => (
            <section key={s.id}>
              <h3 className="text-[10px] uppercase tracking-caps text-neutral-500 font-bold mb-2">
                {s.title ?? s.type}
              </h3>
              <SectionBody section={s} dense />
            </section>
          ))}
        </aside>
      </div>
    </article>
  );
}

/* ─── BRUTALIST ─── */
export function BrutalistTemplate({ cv }: PreviewProps) {
  const visible = cv.sections.filter((s) => s.visible);
  const p = personal(visible.find((s) => s.type === 'personal'));
  return (
    <article className="p-10 text-black bg-white font-mono leading-snug" style={{ fontSize: 10.5 }}>
      <header className="border-4 border-black p-4 mb-6">
        <h1 className="text-3xl font-black uppercase tracking-tighter">{p.name || 'YOUR NAME'}</h1>
        <p className="text-sm uppercase mt-1">{p.headline}</p>
        <p className="text-[10px] mt-2">{[p.email, p.phone, p.location].filter(Boolean).join(' / ')}</p>
      </header>
      {visible.map((s) => {
        if (s.type === 'personal') return null;
        return (
          <section key={s.id} className="mb-5 border-l-4 pl-3" style={{ borderColor: cv.accent }}>
            <h2 className="text-xs font-black uppercase tracking-tight mb-1">— {s.title ?? s.type}</h2>
            <SectionBody section={s} mono />
          </section>
        );
      })}
    </article>
  );
}

/* ─── MONO — premium dark/light typographic ─── */
export function MonoTemplate({ cv }: PreviewProps) {
  const visible = cv.sections.filter((s) => s.visible);
  const p = personal(visible.find((s) => s.type === 'personal'));
  return (
    <article className="p-12 text-neutral-900 bg-[#fafaf7] leading-relaxed" style={{ fontSize: 11 }}>
      <header className="flex items-end justify-between mb-8 pb-4 border-b border-neutral-200">
        <div>
          <h1 className="text-2xl font-medium tracking-tight">{p.name}</h1>
          <p className="text-sm text-neutral-500 mt-0.5">{p.headline}</p>
        </div>
        <div className="text-right text-xs text-neutral-500 leading-tight">
          {p.email && <p>{p.email}</p>}
          {p.phone && <p>{p.phone}</p>}
          {p.location && <p>{p.location}</p>}
          {p.website && <p>{p.website}</p>}
        </div>
      </header>
      {visible.map((s) => {
        if (s.type === 'personal') return null;
        return (
          <section key={s.id} className="mb-6 grid grid-cols-[110px_1fr] gap-4">
            <h2 className="text-[10px] uppercase tracking-[0.2em] text-neutral-500 pt-1">{s.title ?? s.type}</h2>
            <div><SectionBody section={s} /></div>
          </section>
        );
      })}
    </article>
  );
}

/* ─── Body renderer ─── */
function SectionBody({ section: s, dense, mono }: { section: CvSection; dense?: boolean; mono?: boolean }) {
  switch (s.type) {
    case 'summary':
      return <p className="text-sm">{s.content || '—'}</p>;

    case 'experience':
      return (
        <div className="space-y-3">
          {(s.items as ExpItem[]).map((it, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-4">
                <p className={mono ? 'font-bold uppercase' : 'font-medium'}>
                  {it.role || '—'} <span className="text-neutral-500">· {it.company}</span>
                </p>
                <p className="text-[10px] text-neutral-500 shrink-0">
                  {fmtDate(it.start)} – {it.current ? 'Present' : fmtDate(it.end)}
                </p>
              </div>
              {it.location && <p className="text-[10px] text-neutral-500">{it.location}</p>}
              {it.description && (
                <p className="mt-1 text-[11px] whitespace-pre-line text-neutral-700">{it.description}</p>
              )}
            </div>
          ))}
        </div>
      );

    case 'education':
      return (
        <div className="space-y-2">
          {(s.items as EduItem[]).map((it, i) => (
            <div key={i}>
              <div className="flex items-baseline justify-between gap-4">
                <p className={mono ? 'font-bold uppercase' : 'font-medium'}>{it.school}</p>
                <p className="text-[10px] text-neutral-500">{fmtDate(it.start)} – {fmtDate(it.end)}</p>
              </div>
              <p className="text-[10px] text-neutral-600">{[it.degree, it.field].filter(Boolean).join(' · ')}</p>
            </div>
          ))}
        </div>
      );

    case 'skills':
      return (
        <div className={dense ? 'flex flex-col gap-0.5' : 'flex flex-wrap gap-1.5'}>
          {(s.items as SkillItem[]).map((it, i) => {
            const label = typeof it === 'string' ? it : it.name ?? '';
            return dense
              ? <span key={i} className="text-[11px]">{label}</span>
              : <span key={i} className="text-[10px] px-1.5 py-0.5 border border-neutral-300 rounded">{label}</span>;
          })}
        </div>
      );

    case 'projects':
      return (
        <div className="space-y-2">
          {(s.items as ProjectItem[]).map((p, i) => (
            <div key={i}>
              <p className="font-medium">{p.title}{p.url && <span className="text-neutral-500 text-[10px]"> · {p.url}</span>}</p>
              {p.description && <p className="text-[11px] text-neutral-600">{p.description}</p>}
            </div>
          ))}
        </div>
      );

    case 'links':
      return (
        <ul className="space-y-0.5">
          {(s.items as LinkItem[]).map((l, i) => (
            <li key={i} className="text-[11px]">
              <span className="text-neutral-500">{l.label}: </span>{l.url}
            </li>
          ))}
        </ul>
      );

    default:
      return <p className="text-xs text-neutral-500">{s.content}</p>;
  }
}

export const TEMPLATES_MAP = {
  minimal: MinimalTemplate,
  editorial: EditorialTemplate,
  brutalist: BrutalistTemplate,
  mono: MonoTemplate
};
