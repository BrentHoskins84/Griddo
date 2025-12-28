import Link from 'next/link';
import {
  BarChart3,
  Bell,
  LayoutGrid,
  Lock,
  Palette,
  Share2,
  Trophy,
  Wallet,
} from 'lucide-react';

import { Container } from '@/components/container';
import { Button } from '@/components/ui/button';

export default function HomePage() {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <HowItWorksSection />
      <FeaturesSection />
      <CTASection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="relative overflow-hidden py-20 lg:py-32">
      {/* Background gradient */}
      <div className="absolute inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-griddo-background via-griddo-surface to-griddo-background" />
        <div className="absolute right-0 top-0 h-[500px] w-[500px] rounded-full bg-griddo-primary/10 blur-3xl" />
        <div className="absolute bottom-0 left-0 h-[400px] w-[400px] rounded-full bg-griddo-accent/10 blur-3xl" />
      </div>

      <Container className="relative z-10">
        <div className="mx-auto max-w-3xl text-center">
          {/* Badge */}
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-griddo-primary/30 bg-griddo-primary/10 px-4 py-2">
            <Trophy className="h-4 w-4 text-griddo-primary" />
            <span className="text-sm font-medium text-griddo-primary">
              The easiest way to run squares fundraisers
            </span>
          </div>

          {/* Main headline */}
          <h1 className="mb-6 text-4xl font-bold tracking-tight text-griddo-text md:text-5xl lg:text-6xl">
            Host your{' '}
            <span className="bg-gradient-to-r from-griddo-primary to-griddo-accent bg-clip-text text-transparent">
              game day
            </span>{' '}
            fundraiser
          </h1>

          {/* Subheadline */}
          <p className="mb-10 text-lg text-zinc-400 md:text-xl">
            Create a 10×10 squares grid for Super Bowl, March Madness, World Series, or any big game.
            Share with friends, track payments, and announce winners—all in one place.
          </p>

          {/* CTA Buttons */}
          <div className="flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Button asChild variant="orange" size="lg" className="text-base font-semibold">
              <Link href="/signup">Start your fundraiser</Link>
            </Button>
            <Button asChild variant="outline" size="lg" className="border-zinc-700 text-base text-zinc-300 hover:bg-zinc-800 hover:text-griddo-text">
              <Link href="/pricing">View pricing</Link>
            </Button>
          </div>
        </div>

        {/* Grid visualization */}
        <div className="mt-16 flex justify-center">
          <div className="relative">
            {/* Glow effect */}
            <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-griddo-primary/20 via-griddo-accent/20 to-griddo-secondary/20 blur-xl" />
            
            {/* Mini grid preview */}
            <div className="relative grid grid-cols-10 gap-1 rounded-2xl border border-zinc-700/50 bg-griddo-surface/80 p-4 backdrop-blur-sm">
              {Array.from({ length: 100 }).map((_, i) => {
                const isHighlighted = [12, 34, 45, 67, 78, 89].includes(i);
                const isClaimed = [3, 15, 22, 38, 41, 56, 63, 71, 84, 92].includes(i);
                return (
                  <div
                    key={i}
                    className={`h-4 w-4 rounded-sm transition-colors sm:h-6 sm:w-6 ${
                      isHighlighted
                        ? 'bg-griddo-primary'
                        : isClaimed
                        ? 'bg-griddo-accent/60'
                        : 'bg-zinc-700/50'
                    }`}
                  />
                );
              })}
            </div>
          </div>
        </div>
      </Container>
    </section>
  );
}

function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'Create your contest',
      description:
        'Set up your squares grid in minutes. Add your branding, set the price per square, and configure payment options.',
      icon: LayoutGrid,
    },
    {
      number: '02',
      title: 'Share & collect',
      description:
        'Share your unique link. Participants claim squares and pay through your preferred payment methods like Venmo or PayPal.',
      icon: Share2,
    },
    {
      number: '03',
      title: 'Track & announce',
      description:
        'Monitor payments, enter scores each quarter, and let the system automatically determine and announce winners.',
      icon: Trophy,
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-griddo-text md:text-4xl">
            How it works
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Running a squares fundraiser has never been easier. Get started in three simple steps.
          </p>
        </div>

        <div className="grid gap-8 md:grid-cols-3">
          {steps.map((step, index) => (
            <div
              key={step.number}
              className="group relative rounded-2xl border border-zinc-800 bg-griddo-surface/50 p-8 transition-all hover:border-griddo-primary/50 hover:bg-griddo-surface"
            >
              {/* Step number */}
              <div className="mb-6 flex items-center gap-4">
                <span className="text-5xl font-bold text-griddo-primary/20 transition-colors group-hover:text-griddo-primary/40">
                  {step.number}
                </span>
                <step.icon className="h-8 w-8 text-griddo-primary" />
              </div>

              <h3 className="mb-3 text-xl font-semibold text-griddo-text">{step.title}</h3>
              <p className="text-zinc-400">{step.description}</p>

              {/* Connector line (except last item) */}
              {index < steps.length - 1 && (
                <div className="absolute -right-4 top-1/2 hidden h-px w-8 bg-gradient-to-r from-zinc-700 to-transparent md:block" />
              )}
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function FeaturesSection() {
  const features = [
    {
      icon: LayoutGrid,
      title: '10×10 Squares Grid',
      description: 'Classic 100-square grid with randomized numbers for fair play.',
    },
    {
      icon: Palette,
      title: 'Custom Branding',
      description: 'Add your team logos, colors, and contest name for a personal touch.',
    },
    {
      icon: Wallet,
      title: 'Payment Tracking',
      description: 'Connect Venmo, PayPal, or other options. Track who has paid.',
    },
    {
      icon: BarChart3,
      title: 'Live Score Entry',
      description: 'Enter scores each quarter and watch winners get highlighted.',
    },
    {
      icon: Bell,
      title: 'Email Notifications',
      description: 'Automatic reminders for unpaid squares and winner announcements.',
    },
    {
      icon: Lock,
      title: 'Secure & Private',
      description: 'Your contest is only visible to people with your unique link.',
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <div className="absolute inset-0 -z-10 bg-gradient-to-b from-transparent via-griddo-surface/30 to-transparent" />
      
      <Container>
        <div className="mb-16 text-center">
          <h2 className="mb-4 text-3xl font-bold text-griddo-text md:text-4xl">
            Everything you need to run your fundraiser
          </h2>
          <p className="mx-auto max-w-2xl text-lg text-zinc-400">
            Griddo handles all the details so you can focus on the game.
          </p>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="group rounded-xl border border-zinc-800/50 bg-gradient-to-br from-griddo-surface/80 to-griddo-background p-6 transition-all hover:border-zinc-700"
            >
              <div className="mb-4 inline-flex rounded-lg bg-griddo-primary/10 p-3">
                <feature.icon className="h-6 w-6 text-griddo-primary" />
              </div>
              <h3 className="mb-2 text-lg font-semibold text-griddo-text">{feature.title}</h3>
              <p className="text-sm text-zinc-400">{feature.description}</p>
            </div>
          ))}
        </div>
      </Container>
    </section>
  );
}

function CTASection() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="relative overflow-hidden rounded-3xl border border-zinc-800 bg-gradient-to-br from-griddo-surface to-griddo-background p-12 text-center lg:p-20">
          {/* Background decorations */}
          <div className="absolute -left-20 -top-20 h-64 w-64 rounded-full bg-griddo-primary/10 blur-3xl" />
          <div className="absolute -bottom-20 -right-20 h-64 w-64 rounded-full bg-griddo-accent/10 blur-3xl" />
          
          <div className="relative z-10">
            <h2 className="mb-4 text-3xl font-bold text-griddo-text md:text-4xl lg:text-5xl">
              Ready to host your{' '}
              <span className="bg-gradient-to-r from-griddo-primary to-griddo-accent bg-clip-text text-transparent">
                game day fundraiser
              </span>
              ?
            </h2>
            <p className="mx-auto mb-8 max-w-xl text-lg text-zinc-400">
              Start running professional game day fundraisers today.
            </p>
            <Button asChild variant="orange" size="lg" className="text-base font-semibold">
              <Link href="/signup">Get started for free</Link>
            </Button>
          </div>
        </div>
      </Container>
    </section>
  );
}
