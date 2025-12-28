import type React from 'react';

import { Container } from '@/components/container';

export default function SupportPage(): React.ReactElement {
  return (
    <div className="flex flex-col">
      <HeroSection />
      <FAQSection />
      <ContactSection />
    </div>
  );
}

function HeroSection() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="mb-6 text-4xl font-bold text-griddo-text md:text-5xl">
            How can we help?
          </h1>
          <p className="text-lg text-zinc-400">
            Find answers to common questions or get in touch with our team
          </p>
        </div>
      </Container>
    </section>
  );
}

function FAQSection() {
  const faqs = [
    {
      question: 'How do I create a contest?',
      answer:
        'Sign up for an account, then click &quot;Create Contest&quot; from your dashboard. Give your contest a name, choose your sport, set the price per square, and add your payment options. Your contest will be ready to share in minutes.',
    },
    {
      question: 'How do participants claim squares?',
      answer:
        'Share your unique contest link with friends, family, or your organization. They can visit the link, pick an available square, enter their name and email, and claim it. No account needed for participants.',
    },
    {
      question: 'How do I track payments?',
      answer:
        'Griddo lets you mark squares as paid once you receive payment through your preferred method (Venmo, PayPal, cash, etc.). You can see at a glance which squares are claimed, paid, or still available from your dashboard.',
    },
    {
      question: 'How are winners determined?',
      answer:
        'Once all squares are claimed, you&apos;ll assign random numbers to each row and column. During the game, enter the scores for each quarter. Griddo automatically highlights the winning squares based on the last digit of each team&apos;s score.',
    },
    {
      question: 'Can I customize my contest?',
      answer:
        'Yes! You can add your team logos, customize colors, set your own payout structure, and configure how many squares each person can claim. Make it yours.',
    },
    {
      question: "What&apos;s included in the free plan?",
      answer:
        'The free plan lets you run one contest at a time with all core features included. You&apos;ll see a few small ads on your contest page. Upgrade to remove ads and run multiple contests simultaneously.',
    },
  ];

  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-3xl">
          <h2 className="mb-12 text-center text-3xl font-bold text-griddo-text md:text-4xl">
            Frequently Asked Questions
          </h2>
          <div>
            {faqs.map((faq) => (
              <div key={faq.question}>
                <h3 className="mb-2 text-lg font-semibold text-griddo-text">{faq.question}</h3>
                <p className="mb-6 text-zinc-400">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </section>
  );
}

function ContactSection() {
  return (
    <section className="py-20 lg:py-28">
      <Container>
        <div className="mx-auto max-w-3xl rounded-xl border border-zinc-800 bg-griddo-surface/50 p-8 text-center">
          <h2 className="mb-4 text-2xl font-bold text-griddo-text">Still need help?</h2>
          <p className="mb-6 text-zinc-400">
            Send us a message and we&apos;ll get back to you as soon as possible.
          </p>
          <p className="text-griddo-primary">
            Email us at{' '}
            <a
              href="mailto:support@battlebornusa.com"
              className="font-medium hover:underline"
            >
              support@battlebornusa.com
            </a>
          </p>
        </div>
      </Container>
    </section>
  );
}

