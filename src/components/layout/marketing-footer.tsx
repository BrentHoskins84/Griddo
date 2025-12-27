'use client';

import Link from 'next/link';

import { Container } from '@/components/container';
import { Logo } from '@/components/logo';

export function MarketingFooter() {
  return (
    <footer className="mt-8 text-neutral-400 lg:mt-32">
      <Container className="flex flex-col gap-8">
        <div className="flex flex-col justify-between gap-8 lg:flex-row">
          <div>
            <Logo />
          </div>
          <div className="grid grid-cols-2 gap-8 sm:grid-cols-3">
            <div className="flex flex-col gap-2 lg:gap-6">
              <div className="font-semibold text-neutral-100">Product</div>
              <nav className="flex flex-col gap-2 lg:gap-6">
                <Link href="/pricing">Pricing</Link>
                <Link href="/about-us">About</Link>
              </nav>
            </div>
            <div className="flex flex-col gap-2 lg:gap-6">
              <div className="font-semibold text-neutral-100">Legal</div>
              <nav className="flex flex-col gap-2 lg:gap-6">
                <Link href="/terms">Terms</Link>
                <Link href="/privacy">Privacy</Link>
              </nav>
            </div>
            <div className="flex flex-col gap-2 lg:gap-6">
              <div className="font-semibold text-neutral-100">Support</div>
              <nav className="flex flex-col gap-2 lg:gap-6">
                <Link href="/support">Get Help</Link>
              </nav>
            </div>
          </div>
        </div>
        <div className="border-t border-zinc-800 py-6 text-center">
          <span className="text-xs text-neutral-500">Copyright {new Date().getFullYear()} © Griddo</span>
        </div>
      </Container>
    </footer>
  );
}
