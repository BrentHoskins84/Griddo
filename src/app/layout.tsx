import { PropsWithChildren, Suspense } from 'react';
import type { Metadata } from 'next';
import { Montserrat, Montserrat_Alternates } from 'next/font/google';

import { RouteProgress } from '@/components/shared';
import { Toaster } from '@/components/ui/toaster';
import { cn } from '@/utils/cn';
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from "@vercel/speed-insights/next"

import '@/styles/globals.css';

export const dynamic = 'force-dynamic';

const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
});

const montserratAlternates = Montserrat_Alternates({
  variable: '--font-montserrat-alternates',
  weight: ['500', '600', '700'],
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'Fundwell - Game Day Squares Fundraiser',
  description: 'Host your game day squares fundraiser with Fundwell. Create contests, let participants claim squares, and manage payments easily.',
};

export default function RootLayout({ children }: PropsWithChildren) {
  return (
    <html lang='en' className='h-full'>
      <body className={cn('h-full font-sans antialiased', montserrat.variable, montserratAlternates.variable)}>
        <Suspense fallback={null}>
          <RouteProgress />
        </Suspense>
        {children}
        <Toaster />
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
