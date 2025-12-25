'use client';

import Link from 'next/link';
import { IoLogoFacebook, IoLogoInstagram, IoLogoTwitter } from 'react-icons/io5';

import { Logo } from '@/components/logo';

export function MarketingFooter() {
  return (
    <footer className="mt-8 flex flex-col gap-8 text-neutral-400 lg:mt-32">
      <div className="flex flex-col justify-between gap-8 lg:flex-row">
        <div>
          <Logo />
        </div>
        <div className="grid grid-cols-2 gap-8 sm:grid-cols-4 lg:grid-cols-4 lg:gap-16">
          <div className="flex flex-col gap-2 lg:gap-6">
            <div className="font-semibold text-neutral-100">Product</div>
            <nav className="flex flex-col gap-2 lg:gap-6">
              <Link href="/pricing">Pricing</Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2 lg:gap-6">
            <div className="font-semibold text-neutral-100">Company</div>
            <nav className="flex flex-col gap-2 lg:gap-6">
              <Link href="/about-us">About Us</Link>
              <Link href="/privacy">Privacy</Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2 lg:gap-6">
            <div className="font-semibold text-neutral-100">Support</div>
            <nav className="flex flex-col gap-2 lg:gap-6">
              <Link href="/support">Get Support</Link>
            </nav>
          </div>
          <div className="flex flex-col gap-2 lg:gap-6">
            <div className="font-semibold text-neutral-100">Follow us</div>
            <nav className="flex flex-col gap-2 lg:gap-6">
              <Link href="#">
                <span className="flex items-center gap-2">
                  <IoLogoTwitter size={22} /> <span>Twitter</span>
                </span>
              </Link>
              <Link href="#">
                <span className="flex items-center gap-2">
                  <IoLogoFacebook size={22} /> <span>Facebook</span>
                </span>
              </Link>
              <Link href="#">
                <span className="flex items-center gap-2">
                  <IoLogoInstagram size={22} /> <span>Instagram</span>
                </span>
              </Link>
            </nav>
          </div>
        </div>
      </div>
      <div className="border-t border-zinc-800 py-6 text-center">
        <span className="text-neutral-500 text-xs">Copyright {new Date().getFullYear()} © Griddo</span>
      </div>
    </footer>
  );
}

