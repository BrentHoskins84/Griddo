import Link from 'next/link';
import { Eye, GraduationCap, Heart, MessageSquare, Shuffle, Trophy, Users, Wallet, Zap } from 'lucide-react';
import type { ReactElement } from 'react';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';

export default function AboutUsPage(): ReactElement {
  return (
    <div className='flex flex-col'>
      <HeroSection />
      <WhoItsForSection />
      <StorySection />
      <ValuesSection />
      <CTASection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className='relative overflow-hidden py-20 lg:py-28'>
      <div className='absolute inset-0 -z-10'>
        <div className='absolute inset-0 bg-gradient-to-br from-fundwell-background via-fundwell-surface to-fundwell-background' />
        <div className='bg-fundwell-primary/10 absolute right-0 top-0 h-[500px] w-[500px] rounded-full blur-3xl' />
        <div className='bg-fundwell-accent/10 absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full blur-3xl' />
      </div>

      <Container className='relative z-10'>
        <div className='mx-auto max-w-3xl text-center'>
          <div className='border-fundwell-primary/30 bg-fundwell-primary/10 mb-6 inline-flex items-center gap-2 rounded-full border px-4 py-2'>
            <Users className='h-4 w-4 text-fundwell-primary' />
            <span className='text-sm font-medium text-fundwell-primary'>Our Story</span>
          </div>

          <h1 className='mb-6 text-4xl font-bold tracking-tight md:text-5xl lg:text-6xl'>
            <span className='bg-gradient-to-r from-fundwell-primary to-fundwell-accent bg-clip-text text-transparent'>
              About Fundwell
            </span>
          </h1>

          <p className='mb-10 text-lg text-zinc-400 md:text-xl'>Making game day fundraisers simple for everyone</p>
        </div>
      </Container>
    </section>
  );
}

function StorySection() {
  return (
    <section className='py-20 lg:py-28'>
      <Container>
        <div className='mx-auto max-w-3xl text-center'>
          <h2 className='mb-8 text-3xl font-bold text-fundwell-text md:text-4xl'>Why Fundwell exists</h2>
          <div className='space-y-6 text-lg text-zinc-400'>
            <p>
              We saw coaches spending hours managing spreadsheets and paper grids for game day fundraisers. Whether
              it&apos;s youth baseball, softball, basketball, or football teams, coaches were juggling practices, games,
              AND fundraising administration.
            </p>
            <p>
              Tracking payments manually, coordinating with dozens of participants, and figuring out winners—it was a
              lot of work for something that should be fun.
            </p>
            <p>
              We built Fundwell to simplify all of this, so you can focus on what really matters: raising funds and
              bringing your community together.
            </p>
            <p>
              That&apos;s why we offer a free plan—you can run one contest at a time and only see a few ads. Our paid
              plans are intentionally affordable because we&apos;re not here to make a fortune. We just want to cover
              our server costs and keep Fundwell running for everyone who needs it.
            </p>
          </div>
        </div>
      </Container>
    </section>
  );
}

function WhoItsForSection() {
  const audiences = [
    {
      icon: GraduationCap,
      title: 'Schools & PTAs',
      description: 'Fund classroom supplies, field trips, and school events.',
    },
    {
      icon: Trophy,
      title: 'Sports Teams',
      description: 'Cover equipment, travel, and tournament fees.',
    },
    {
      icon: Heart,
      title: 'Nonprofits',
      description: 'Support your cause with engaging game day events.',
    },
  ];

  return (
    <section className='relative py-20 lg:py-28'>
      <div className='via-fundwell-surface/30 absolute inset-0 -z-10 bg-gradient-to-b from-transparent to-transparent' />
      <Container>
        <h2 className='mb-12 text-center text-3xl font-bold text-fundwell-text md:text-4xl'>
          Built for your organization
        </h2>
        <div className='grid gap-6 sm:grid-cols-3'>
          {audiences.map((item) => (
            <div
              key={item.title}
              className='bg-fundwell-surface/80 rounded-xl border border-zinc-800/50 p-6 text-center'
            >
              <div className='bg-fundwell-primary/10 mb-4 inline-flex rounded-lg p-3'>
                <item.icon className='h-6 w-6 text-fundwell-primary' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-fundwell-text'>{item.title}</h3>
              <p className='text-sm text-zinc-400'>{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function ValuesSection() {
  const values = [
    {
      icon: Zap,
      title: 'Simple',
      description: 'No complicated setup or training needed.',
    },
    {
      icon: Eye,
      title: 'Transparent',
      description: 'Clear pricing, no hidden fees.',
    },
    {
      icon: Users,
      title: 'Community-focused',
      description: 'Built by fundraisers, for fundraisers.',
    },
    {
      icon: Wallet,
      title: 'You keep 100% of funds',
      description: 'We never touch the money. Participants pay you directly through your own Venmo/PayPal, so every dollar raised goes to your team.',
    },
    {
      icon: MessageSquare,
      title: 'No experience needed',
      description: 'If you can send a text, you can run a squares contest. Share your link and we handle the rest.',
    },
    {
      icon: Shuffle,
      title: 'Fair & random',
      description: 'Numbers are randomly assigned after all squares are claimed, ensuring every participant has an equal chance to win.',
    },
  ];

  return (
    <section className='py-20 lg:py-28'>
      <Container>
        <h2 className='mb-12 text-center text-3xl font-bold text-fundwell-text md:text-4xl'>What makes us different</h2>
        <div className='grid gap-8 sm:grid-cols-2 lg:grid-cols-3'>
          {values.map((item) => (
            <div
              key={item.title}
              className='bg-fundwell-surface/80 rounded-xl border border-zinc-800/50 p-6 text-center'
            >
              <div className='bg-fundwell-primary/10 mb-4 inline-flex rounded-lg p-3'>
                <item.icon className='h-6 w-6 text-fundwell-primary' />
              </div>
              <h3 className='mb-2 text-lg font-semibold text-fundwell-text'>{item.title}</h3>
              <p className='text-sm text-zinc-400'>{item.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CTASection() {
  return (
    <section className='py-20 lg:py-28'>
      <Container>
        <div className='relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-fundwell-surface to-fundwell-background p-12 text-center lg:p-20'>
          <div className='bg-fundwell-primary/10 absolute -left-20 -top-20 h-64 w-64 rounded-full blur-3xl' />
          <div className='bg-fundwell-accent/10 absolute -bottom-20 -right-20 h-64 w-64 rounded-full blur-3xl' />

          <div className='relative z-10'>
            <h2 className='mb-8 text-3xl font-bold text-fundwell-text md:text-4xl'>Ready to get started?</h2>
            <Button asChild variant='orange' size='lg' className='text-base font-semibold'>
              <Link href='/signup'>Start your fundraiser</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
