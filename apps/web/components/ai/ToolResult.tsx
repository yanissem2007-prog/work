'use client';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Briefcase, Lightbulb, MessageCircleQuestion, FilePenLine, UserCog, MapPin, Sparkles } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';

interface Props { name: string; result: unknown }

export function ToolResult({ name, result }: Props) {
  const r = result as any;
  return (
    <motion.div
      initial={{ opacity: 0, y: 8, scale: 0.98 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
      className="mt-2 glass rounded-2xl p-3 border border-border"
    >
      {name === 'recommendJobs' && <Jobs items={r} />}
      {name === 'improveCvBullets' && <Bullets r={r} />}
      {name === 'suggestSkills' && <Skills r={r} />}
      {name === 'interviewQuestion' && <Interview r={r} />}
      {name === 'getMyProfile' && <Profile r={r} />}
    </motion.div>
  );
}

function Header({ icon: Icon, label }: { icon: React.ComponentType<{ size?: number }>; label: string }) {
  return (
    <p className="text-2xs uppercase tracking-caps text-muted mb-2 flex items-center gap-1.5">
      <Icon size={11} /> {label}
    </p>
  );
}

function Jobs({ items }: { items: any[] }) {
  if (!Array.isArray(items) || items.length === 0) {
    return <p className="text-xs text-muted">No matches right now. Broaden your search?</p>;
  }
  return (
    <>
      <Header icon={Briefcase} label={`${items.length} matching jobs`} />
      <ul className="space-y-2">
        {items.map((j) => (
          <li key={j.id}>
            <Link href={j.href} className="block p-2.5 rounded-xl hover:bg-surface-2 transition">
              <p className="text-sm font-medium leading-tight">{j.title}</p>
              <p className="text-xs text-muted">{j.company} · <span className="inline-flex items-center gap-1"><MapPin size={10} /> {j.location ?? '—'}</span></p>
              <div className="mt-1.5 flex flex-wrap gap-1">
                {j.salaryMin && <Badge variant="soft" className="text-[10px]">{Math.round(j.salaryMin / 1000)}k+ {j.currency}</Badge>}
                <Badge variant="outline" className="text-[10px] capitalize">{j.type?.replace('-', ' ')}</Badge>
                <Badge variant="outline" className="text-[10px]">{j.experienceLevel}</Badge>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}

function Bullets({ r }: { r: { bullets?: string[]; tip?: string } }) {
  return (
    <>
      <Header icon={FilePenLine} label="Rewrite suggestions" />
      <ul className="space-y-1 text-sm">
        {r.bullets?.map((b, i) => (
          <li key={i} className="flex gap-2">
            <span className="text-accent mt-1.5 size-1.5 rounded-full bg-accent shrink-0" />
            <span>{b}</span>
          </li>
        ))}
      </ul>
      {r.tip && <p className="mt-2 text-2xs text-muted">{r.tip}</p>}
    </>
  );
}

function Skills({ r }: { r: { skills?: string[] } }) {
  return (
    <>
      <Header icon={Lightbulb} label="Recommended skills" />
      <div className="flex flex-wrap gap-1.5">
        {(r.skills ?? []).map((s) => <Badge key={s} variant="accent">{s}</Badge>)}
      </div>
    </>
  );
}

function Interview({ r }: { r: { question?: string; rubric?: string[] } }) {
  return (
    <>
      <Header icon={MessageCircleQuestion} label="Practice question" />
      <p className="text-sm font-medium">{r.question}</p>
      {r.rubric && (
        <ul className="mt-2 space-y-1 text-xs text-muted">
          {r.rubric.map((b, i) => <li key={i}>• {b}</li>)}
        </ul>
      )}
    </>
  );
}

function Profile({ r }: { r: any }) {
  return (
    <>
      <Header icon={UserCog} label="Your profile snapshot" />
      <p className="text-sm font-medium">{r?.user?.name} <span className="text-muted">· @{r?.user?.handle}</span></p>
      <p className="text-xs text-muted">{r?.user?.headline ?? '—'}</p>
      {r?.user?.skills?.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {r.user.skills.map((s: string) => <Badge key={s} variant="soft">{s}</Badge>)}
        </div>
      )}
      {r?.latestCv && (
        <p className="mt-2 text-2xs text-muted flex items-center gap-1">
          <Sparkles size={10} className="text-accent" /> Latest CV · {r.latestCv.title}
        </p>
      )}
    </>
  );
}
