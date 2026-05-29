'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { EffectCoverflow, Autoplay, Pagination } from 'swiper/modules';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Reveal } from '@/components/motion/Reveal';
import { ArrowRight, MapPin, Sparkles } from 'lucide-react';
import 'swiper/css';
import 'swiper/css/effect-coverflow';
import 'swiper/css/pagination';

const JOBS = [
  { title: 'Senior Product Engineer', company: 'Stripe', location: 'Remote · Global', salary: '$220k–$280k', tags: ['TypeScript', 'React', 'GraphQL'], match: 96 },
  { title: 'Design Engineer', company: 'Linear', location: 'San Francisco', salary: '$190k–$240k', tags: ['Motion', 'Design Systems'], match: 94 },
  { title: 'Founding Engineer', company: 'Vercel', location: 'NYC · Hybrid', salary: '$240k–$320k', tags: ['Next.js', 'Edge'], match: 92 },
  { title: 'Staff ML Engineer', company: 'Anthropic', location: 'Remote', salary: '$330k–$420k', tags: ['LLM', 'PyTorch'], match: 89 },
  { title: 'iOS Engineer', company: 'Arc', location: 'NYC', salary: '$200k–$260k', tags: ['Swift', 'UIKit'], match: 87 },
  { title: 'Brand Designer', company: 'Framer', location: 'Amsterdam', salary: '€90k–€130k', tags: ['Identity', 'Motion'], match: 84 }
];

export function TrendingJobs() {
  return (
    <section className="relative py-section overflow-hidden">
      <div className="absolute inset-0 -z-10 mesh opacity-40" />

      <Reveal className="text-center max-w-2xl mx-auto px-6 mb-14">
        <p className="text-eyebrow mb-3">Trending jobs · this week</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tighter">
          Roles that <span className="gradient-text">match you</span>, ranked by our AI.
        </h2>
        <p className="mt-4 text-muted">
          We index 200k+ jobs every day. You see the 0.1% that fit your skills, salary, and ambitions.
        </p>
      </Reveal>

      <Swiper
        modules={[EffectCoverflow, Autoplay, Pagination]}
        effect="coverflow"
        centeredSlides
        slidesPerView="auto"
        loop
        autoplay={{ delay: 3200, disableOnInteraction: false }}
        coverflowEffect={{ rotate: 28, stretch: 0, depth: 220, modifier: 1, slideShadows: false }}
        pagination={{ clickable: true }}
        className="!pb-14"
      >
        {JOBS.map((j, i) => (
          <SwiperSlide key={i} style={{ width: 360 }}>
            <JobCardLanding {...j} />
          </SwiperSlide>
        ))}
      </Swiper>

      <div className="flex justify-center mt-6">
        <Button variant="glass" size="lg">
          Browse all jobs <ArrowRight size={16} />
        </Button>
      </div>
    </section>
  );
}

function JobCardLanding({ title, company, location, salary, tags, match }: typeof JOBS[number]) {
  return (
    <div className="glass-strong rounded-2xl p-6 h-[360px] flex flex-col">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-muted">{company}</p>
          <h3 className="mt-1 font-display text-xl tracking-snug leading-tight">{title}</h3>
        </div>
        <Badge variant="accent" dot>
          <Sparkles size={10} /> {match}% match
        </Badge>
      </div>
      <p className="mt-4 text-sm text-muted flex items-center gap-1.5">
        <MapPin size={13} /> {location}
      </p>
      <p className="mt-1 text-sm font-medium">{salary}</p>
      <div className="mt-4 flex flex-wrap gap-1.5">
        {tags.map((t) => <Badge key={t} variant="soft">{t}</Badge>)}
      </div>
      <div className="mt-auto flex gap-2">
        <Button variant="accent" className="flex-1">Apply</Button>
        <Button variant="glass" size="icon">★</Button>
      </div>
    </div>
  );
}
