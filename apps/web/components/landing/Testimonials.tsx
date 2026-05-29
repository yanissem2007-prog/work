'use client';
import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import { Avatar } from '@/components/ui/Avatar';
import { Reveal } from '@/components/motion/Reveal';
import 'swiper/css';
import 'swiper/css/effect-coverflow';

const QUOTES = [
  { quote: 'I landed a Senior PM role at Stripe in three weeks. The AI rewrote my CV and the matches were unreal.', name: 'Sara Bouali', role: 'Senior PM · Stripe', avatar: undefined },
  { quote: 'WORK feels like the future. It’s LinkedIn × Discord × Apple. I can’t go back.', name: 'Yacine Berrouba', role: 'Founder · Atlas', avatar: undefined },
  { quote: 'As a recruiter, the talent quality is 10x higher than anywhere else I’ve hired from.', name: 'Mia Tanaka', role: 'Head of Talent · Linear', avatar: undefined },
  { quote: 'The CV builder alone is worth it. Made me look like a senior in 20 minutes.', name: 'Omar K.', role: 'Designer · Figma', avatar: undefined },
  { quote: 'Communities here are alive. I made my next two co-founders on WORK.', name: 'Aïcha L.', role: 'CEO · Carto', avatar: undefined }
];

export function Testimonials() {
  return (
    <section className="relative py-section overflow-hidden">
      <div className="absolute inset-0 -z-10 mesh opacity-50" />

      <Reveal className="text-center max-w-2xl mx-auto px-6 mb-14">
        <p className="text-eyebrow mb-3">Loved by 240k+ professionals</p>
        <h2 className="font-display text-4xl md:text-5xl tracking-tighter">
          The new <span className="gradient-text">career stack.</span>
        </h2>
      </Reveal>

      <Swiper
        modules={[Autoplay, EffectCoverflow]}
        effect="coverflow"
        centeredSlides
        slidesPerView="auto"
        loop
        grabCursor
        autoplay={{ delay: 3800, disableOnInteraction: false }}
        coverflowEffect={{ rotate: 20, depth: 200, modifier: 1, slideShadows: false }}
        className="!pb-4"
      >
        {QUOTES.map((q, i) => (
          <SwiperSlide key={i} style={{ width: 420 }}>
            <figure className="glass-strong rounded-2xl p-7 h-full">
              <blockquote className="text-lg leading-snug tracking-snug font-display">
                “{q.quote}”
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3">
                <Avatar name={q.name} ring />
                <div>
                  <p className="text-sm font-medium">{q.name}</p>
                  <p className="text-xs text-muted">{q.role}</p>
                </div>
              </figcaption>
            </figure>
          </SwiperSlide>
        ))}
      </Swiper>
    </section>
  );
}
