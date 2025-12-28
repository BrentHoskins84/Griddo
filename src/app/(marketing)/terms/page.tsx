import Link from 'next/link';
import type { ReactElement } from 'react';

import { Container } from '@/components/container';

export default function TermsPage(): ReactElement {
  return (
    <div className="flex flex-col">
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-4xl font-bold text-fundwell-text md:text-5xl">
              Terms of Service
            </h1>
            <p className="mb-6 text-sm text-zinc-500">Last updated: December 27, 2025</p>
            <p className="text-lg text-zinc-400">
              By using Fundwell, you agree to these terms. Please read them carefully.
            </p>
          </div>
        </Container>
      </section>

      <section className="pb-20">
        <Container>
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Acceptance of Terms</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                By accessing or using Fundwell, you agree to be bound by these Terms of Service. If
                you do not agree to these terms, please do not use our service.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Service Description</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Fundwell provides a platform for creating and managing game day squares fundraisers.
                We offer tools to create 10x10 grids, share them with participants, track square
                claims and payments, and announce winners based on game scores.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Fundwell is a tool for organizing fundraisers. We do not guarantee any specific
                fundraising outcomes, and success depends on your own efforts and community
                engagement.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">User Accounts</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                You must be at least 18 years old to create an account on Fundwell. You are
                responsible for maintaining the security of your account and for all activities
                that occur under your account.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                You agree to provide accurate information when creating your account and to keep
                your account information up to date.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Contest Management</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                As a contest manager, you are solely responsible for your contests, including
                setting rules, collecting payments from participants, and distributing prizes. You
                must ensure your fundraiser complies with all applicable local, state, and federal
                laws.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Fundwell is not responsible for disputes between contest managers and participants.
                You are responsible for communicating contest rules clearly to your participants.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Payment & Subscriptions</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Fundwell does not process payments for squares. When participants pay for squares,
                they do so directly through your own payment methods such as Venmo, PayPal, Zelle,
                or cash. We only provide a way to track whether squares have been marked as paid.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                For Fundwell subscription plans, we use Stripe to process payments. Subscription fees
                are billed according to the plan you select. You can cancel your subscription at any
                time through your account settings.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Prohibited Uses</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                You may not use Fundwell for any illegal purposes or in violation of any applicable
                laws. You may not use our service to run unauthorized gambling operations or to
                defraud participants.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                You may not attempt to access other users&apos; accounts, interfere with the service, or
                use automated tools to scrape or interact with our platform without permission.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Termination</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                We reserve the right to suspend or terminate your account at any time for violation
                of these terms or for any other reason at our discretion. You may also delete your
                account at any time by contacting support.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Upon termination, your access to your contests and data will be removed. We
                recommend exporting any important information before closing your account.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Limitation of Liability</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Fundwell is provided &quot;as is&quot; without warranties of any kind. We do not guarantee that
                the service will be available at all times or that it will be free of errors.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                To the fullest extent permitted by law, Fundwell shall not be liable for any
                indirect, incidental, special, or consequential damages arising from your use of
                the service.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Changes to Terms</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                We may update these terms from time to time. If we make significant changes, we
                will notify you by email or through the service. Your continued use of Fundwell after
                changes are posted constitutes acceptance of the updated terms.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-fundwell-text">Contact Us</h2>
              <p className="leading-relaxed text-zinc-400">
                If you have questions about these terms, please reach out through our{' '}
                <Link href="/support" className="text-fundwell-primary hover:underline">
                  support page
                </Link>
                . We&apos;re here to help.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

