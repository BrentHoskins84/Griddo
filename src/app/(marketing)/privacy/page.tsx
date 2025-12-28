import React from 'react';
import Link from 'next/link';

import { Container } from '@/components/container';

export default function PrivacyPage(): React.ReactElement {
  return (
    <div className="flex flex-col">
      <section className="py-20">
        <Container>
          <div className="mx-auto max-w-4xl">
            <h1 className="mb-4 text-4xl font-bold text-griddo-text md:text-5xl">
              Privacy Policy
            </h1>
            <p className="mb-6 text-sm text-zinc-500">Last updated: December 27, 2025</p>
            <p className="text-lg text-zinc-400">
              Your privacy is important to us. This policy explains how we collect, use, and
              protect your information.
            </p>
          </div>
        </Container>
      </section>
      <section className="pb-20">
        <Container>
          <div className="mx-auto max-w-4xl">
            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-griddo-text">Information We Collect</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                When you create an account, we collect your email address and basic profile
                information through our authentication provider, Supabase. When you create contests,
                we store contest details including the contest name, settings, and branding you
                provide.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                For participants who claim squares on your contests, we collect their name and email
                address so you can track who has claimed each square and communicate with them about
                the fundraiser.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-griddo-text">
                How We Use Your Information
              </h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                We use your information to provide and improve Griddo&apos;s services. This includes
                displaying your contests, sending email notifications through Resend when numbers
                are revealed or winners are announced, and helping you manage your fundraisers.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                We do not sell your personal information to third parties. We only share data with
                service providers necessary to operate Griddo, such as our database provider and
                email service.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-griddo-text">Data Storage & Security</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Your data is stored securely using Supabase, which provides enterprise-grade
                security including encryption at rest and in transit. We implement row-level
                security policies to ensure users can only access their own data.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Griddo does not process payments directly. When participants pay for squares, they
                do so through your own Venmo, PayPal, or other payment methods. We only track
                whether a square has been marked as paid—we never handle actual payment
                transactions for squares.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                For subscription billing, we use Stripe. Stripe handles all payment processing and
                stores payment information securely. We do not store your credit card details on our
                servers.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-griddo-text">Your Rights</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                You have the right to access, update, or delete your personal information at any
                time. You can update your account information through your account settings. If you
                wish to delete your account and all associated data, please contact us through our
                support page.
              </p>
              <p className="mb-4 leading-relaxed text-zinc-400">
                Contest managers can delete their contests at any time, which will remove all
                associated square and participant data.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-griddo-text">Cookies & Analytics</h2>
              <p className="mb-4 leading-relaxed text-zinc-400">
                We use essential cookies to maintain your session and keep you logged in. We may use
                analytics tools to understand how people use Griddo so we can improve the service.
                These tools collect anonymized usage data and do not track you across other
                websites.
              </p>
            </div>

            <div className="mb-12">
              <h2 className="mb-4 text-2xl font-bold text-griddo-text">Contact Us</h2>
              <p className="leading-relaxed text-zinc-400">
                If you have any questions about this privacy policy or how we handle your data,
                please reach out through our{' '}
                <Link href="/support" className="text-griddo-primary hover:underline">
                  support page
                </Link>
                . We&apos;re happy to help.
              </p>
            </div>
          </div>
        </Container>
      </section>
    </div>
  );
}

