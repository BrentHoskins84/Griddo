import { PropsWithChildren } from 'react';

import { MarketingFooter } from '@/components/layout/marketing-footer';
import { Logo } from '@/components/logo';

import { Navigation } from '../navigation';

export default function MarketingLayout({ children }: PropsWithChildren) {
  return (
    <div className="m-auto flex h-full max-w-[1440px] flex-col px-4">
      <AppBar />
      <main className="relative flex-1">
        <div className="relative h-full">{children}</div>
      </main>
      <MarketingFooter />
    </div>
  );
}

async function AppBar() {
  return (
    <header className="flex items-center justify-between py-8">
      <Logo />
      <Navigation />
    </header>
  );
}

export { MarketingFooter };

