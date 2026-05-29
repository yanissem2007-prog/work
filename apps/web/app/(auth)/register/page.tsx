'use client';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { z } from 'zod';
import { toast } from 'sonner';
import { GraduationCap, Briefcase, Building2, School, ArrowRight, ArrowLeft, Mail, Lock, User, AtSign, Sparkles, Check } from 'lucide-react';

import { Button } from '@/components/ui/Button';
import { Input, FloatingInput } from '@/components/ui/Input';
import { Badge } from '@/components/ui/Badge';
import { OAuthButtons } from '@/components/auth/OAuthButtons';
import { StepIndicator } from '@/components/auth/StepIndicator';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/authStore';
import { cn } from '@/lib/utils';

const ROLES = [
  { id: 'student', label: 'Student', desc: 'Find internships, build CV, learn.', icon: GraduationCap, color: 'oklch(72% 0.2 264)' },
  { id: 'recruiter', label: 'Recruiter', desc: 'Hire top talent, fast.', icon: Briefcase, color: 'oklch(70% 0.24 340)' },
  { id: 'company', label: 'Company', desc: 'Manage roles + brand page.', icon: Building2, color: 'oklch(80% 0.14 200)' },
  { id: 'university', label: 'University', desc: 'Verify students, share programs.', icon: School, color: 'oklch(85% 0.18 130)' }
] as const;

type Role = typeof ROLES[number]['id'];

const STEPS = ['You', 'Account', 'Details', 'Done'];

const schemas = {
  account: z.object({
    name: z.string().min(2, 'Too short'),
    handle: z.string().min(3).regex(/^[a-z0-9_]+$/, 'lowercase letters, digits, underscores'),
    email: z.string().email('Invalid email'),
    password: z.string().min(8, 'At least 8 characters')
  })
};

export default function RegisterPage() {
  const router = useRouter();
  const setUser = useAuthStore((s) => s.setUser);
  const setToken = useAuthStore((s) => s.setAccessToken);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState(1);
  const [role, setRole] = useState<Role>('student');
  const [form, setForm] = useState({
    name: '', handle: '', email: '', password: '',
    companyName: '', universityName: '', yearOfStudy: 1, headline: ''
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [submitting, setSubmitting] = useState(false);

  const go = (n: number) => { setDir(n > step ? 1 : -1); setStep(n); };

  function validateAccount() {
    const r = schemas.account.safeParse(form);
    if (!r.success) {
      setErrors(Object.fromEntries(r.error.issues.map((i) => [i.path[0], i.message])));
      return false;
    }
    setErrors({});
    return true;
  }

  async function submit() {
    setSubmitting(true);
    try {
      const payload: Record<string, unknown> = {
        name: form.name, handle: form.handle, email: form.email,
        password: form.password, role, headline: form.headline || undefined
      };
      if (role === 'recruiter' || role === 'company') payload.companyName = form.companyName;
      if (role === 'university') payload.universityName = form.universityName;
      if (role === 'student') payload.universityName = form.universityName || undefined;
      if (role === 'student') payload.yearOfStudy = form.yearOfStudy;

      const { data } = await api.post('/auth/register', payload);
      setToken(data.data.accessToken);
      setUser(data.data.user);
      go(3);
    } catch (e: any) {
      const msg = e?.response?.data?.error?.message ?? 'Something went wrong';
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  }

  const variants = {
    enter: (d: number) => ({ opacity: 0, x: d * 40, filter: 'blur(8px)' }),
    center: { opacity: 1, x: 0, filter: 'blur(0px)' },
    exit: (d: number) => ({ opacity: 0, x: -d * 40, filter: 'blur(8px)' })
  };

  return (
    <div className="w-full max-w-lg">
      <div className="glass-strong rounded-3xl p-7 sm:p-9">
        <div className="flex items-center justify-between mb-7">
          <Badge variant="glass" dot dotColor="var(--accent)">Step {step + 1} / {STEPS.length}</Badge>
          <StepIndicator steps={STEPS} current={step} />
        </div>

        <AnimatePresence mode="wait" custom={dir}>
          <motion.div
            key={step}
            custom={dir}
            variants={variants}
            initial="enter" animate="center" exit="exit"
            transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
          >
            {step === 0 && (
              <>
                <h1 className="font-display text-3xl tracking-tighter">Welcome to <span className="gradient-text">WORK</span>.</h1>
                <p className="mt-2 text-sm text-muted">Pick what you are. We'll tailor the experience.</p>
                <div className="mt-6 grid grid-cols-2 gap-3">
                  {ROLES.map((r) => (
                    <button
                      key={r.id}
                      onClick={() => setRole(r.id)}
                      className={cn(
                        'group relative text-left rounded-2xl p-4 border transition-all duration-normal ease-out-expo',
                        'hover:-translate-y-0.5 hover:shadow-md',
                        role === r.id ? 'border-accent bg-surface-2 shadow-glow' : 'border-border bg-surface'
                      )}
                    >
                      <div className="size-10 rounded-xl grid place-items-center mb-3 shadow-glow"
                        style={{ background: `linear-gradient(135deg, ${r.color}, oklch(70% 0.24 340))` }}>
                        <r.icon size={18} className="text-white" />
                      </div>
                      <p className="font-medium">{r.label}</p>
                      <p className="text-xs text-muted mt-1">{r.desc}</p>
                      {role === r.id && (
                        <motion.div layoutId="role-check" className="absolute top-3 right-3 size-5 rounded-full bg-accent text-accent-fg grid place-items-center">
                          <Check size={12} />
                        </motion.div>
                      )}
                    </button>
                  ))}
                </div>
                <Button variant="accent" size="lg" magnetic className="w-full mt-6" onClick={() => go(1)}>
                  Continue <ArrowRight size={16} />
                </Button>
              </>
            )}

            {step === 1 && (
              <>
                <h1 className="font-display text-3xl tracking-tighter">Create your account</h1>
                <p className="mt-2 text-sm text-muted">Use your real name — your network can find you.</p>
                <div className="mt-5 space-y-3">
                  <Input label="Full name" leading={<User size={16} />}
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} error={errors.name} />
                  <Input label="Handle" leading={<AtSign size={16} />}
                    value={form.handle} onChange={(e) => setForm({ ...form, handle: e.target.value.toLowerCase() })} error={errors.handle}
                    placeholder="sara_bouali" />
                  <Input label="Email" type="email" leading={<Mail size={16} />}
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} error={errors.email} />
                  <Input label="Password" type="password" leading={<Lock size={16} />}
                    value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} error={errors.password}
                    hint="At least 8 characters." />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="glass" size="lg" onClick={() => go(0)}><ArrowLeft size={16} /> Back</Button>
                  <Button variant="accent" size="lg" magnetic className="flex-1"
                    onClick={() => validateAccount() && go(2)}>
                    Continue <ArrowRight size={16} />
                  </Button>
                </div>
                <div className="mt-6 flex items-center gap-3 text-2xs uppercase tracking-caps text-muted">
                  <span className="flex-1 h-px bg-border" /> or <span className="flex-1 h-px bg-border" />
                </div>
                <div className="mt-4"><OAuthButtons /></div>
              </>
            )}

            {step === 2 && (
              <>
                <h1 className="font-display text-3xl tracking-tighter">A few last details</h1>
                <p className="mt-2 text-sm text-muted">
                  {role === 'student' && 'Tell us where you study.'}
                  {(role === 'recruiter' || role === 'company') && 'Which company do you represent?'}
                  {role === 'university' && 'What institution are you registering?'}
                </p>
                <div className="mt-5 space-y-3">
                  {role === 'student' && (
                    <>
                      <FloatingInput label="University (optional)" value={form.universityName}
                        onChange={(e) => setForm({ ...form, universityName: e.target.value })} />
                      <FloatingInput label="Year of study" type="number" min={1} max={10}
                        value={String(form.yearOfStudy)} onChange={(e) => setForm({ ...form, yearOfStudy: Number(e.target.value) })} />
                    </>
                  )}
                  {(role === 'recruiter' || role === 'company') && (
                    <FloatingInput label="Company name" value={form.companyName}
                      onChange={(e) => setForm({ ...form, companyName: e.target.value })} />
                  )}
                  {role === 'university' && (
                    <FloatingInput label="University name" value={form.universityName}
                      onChange={(e) => setForm({ ...form, universityName: e.target.value })} />
                  )}
                  <FloatingInput label="Headline (optional)" value={form.headline}
                    onChange={(e) => setForm({ ...form, headline: e.target.value })} />
                </div>
                <div className="mt-6 flex gap-2">
                  <Button variant="glass" size="lg" onClick={() => go(1)}><ArrowLeft size={16} /> Back</Button>
                  <Button variant="accent" size="lg" magnetic loading={submitting} className="flex-1" onClick={submit}>
                    Create my account <Sparkles size={14} />
                  </Button>
                </div>
              </>
            )}

            {step === 3 && (
              <div className="text-center py-4">
                <motion.div
                  initial={{ scale: 0, rotate: -90 }} animate={{ scale: 1, rotate: 0 }}
                  transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="mx-auto size-20 rounded-2xl bg-grad-accent shadow-glow grid place-items-center animate-pulse-glow"
                >
                  <Check size={32} className="text-accent-fg" />
                </motion.div>
                <h1 className="mt-6 font-display text-3xl tracking-tighter">You're in.</h1>
                <p className="mt-2 text-muted">
                  We sent a verification link to <span className="text-fg">{form.email}</span>.
                </p>
                <Button variant="accent" size="lg" magnetic className="mt-6 w-full" onClick={() => router.push('/feed')}>
                  Enter WORK <ArrowRight size={16} />
                </Button>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {step !== 3 && (
          <p className="mt-7 text-center text-xs text-muted">
            Already have an account? <Link href="/login" className="text-fg underline-offset-4 hover:underline">Sign in</Link>
          </p>
        )}
      </div>
    </div>
  );
}
