import Link from 'next/link';
import { Menu } from 'lucide-react';

import { AccountMenu } from '@/components/account-menu';
import { Logo } from '@/components/logo';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTrigger } from '@/components/ui/sheet';
import { getSession } from '@/features/account/controllers/get-session';
import { signOut } from '@/features/auth/auth-actions';

export async function Navigation() {
  const session = await getSession();

  return (
    <div className='relative flex items-center gap-6'>
      {session ? (
        <AccountMenu signOut={signOut} />
      ) : (
        <>
          <nav className="hidden items-center gap-6 lg:flex">
            <Link href="/pricing" className="text-zinc-400 transition-colors hover:text-griddo-text">
              Pricing
            </Link>
          </nav>
          <Button variant="orange" className="hidden flex-shrink-0 lg:flex" asChild>
            <Link href="/signup">Get started for free</Link>
          </Button>
          <Sheet>
            <SheetTrigger className="block lg:hidden">
              <Menu className="h-7 w-7" />
            </SheetTrigger>
            <SheetContent className="w-full bg-black">
              <SheetHeader>
                <Logo />
                <SheetDescription className="py-8">
                  <Link
                    href="/pricing"
                    className="mb-4 block text-zinc-400 transition-colors hover:text-griddo-text"
                  >
                    Pricing
                  </Link>
                  <Button variant="orange" className="flex-shrink-0" asChild>
                    <Link href="/signup">Get started for free</Link>
                  </Button>
                </SheetDescription>
              </SheetHeader>
            </SheetContent>
          </Sheet>
        </>
      )}
    </div>
  );
}
