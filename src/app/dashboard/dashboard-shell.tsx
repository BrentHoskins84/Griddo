'use client';

import { useState } from 'react';
import Link from 'next/link';
import { LogOut, Menu } from 'lucide-react';

import { Logo } from '@/components/logo';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { signOut } from '@/features/auth/auth-actions';
import { cn } from '@/utils/cn';

import { NavItems } from './nav-items';

async function handleSignOut() {
  await signOut();
}

function LogoutButton({ onClick, className }: { onClick?: () => void; className?: string }) {
  return (
    <form action={handleSignOut}>
      <button
        type='submit'
        onClick={onClick}
        className={cn(
          'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-zinc-400 transition-colors hover:bg-zinc-800 hover:text-white',
          className
        )}
      >
        <LogOut className='h-5 w-5' />
        Log out
      </button>
    </form>
  );
}

interface DashboardShellProps {
  children: React.ReactNode;
  userEmail: string;
}

export function DashboardShell({ children, userEmail }: DashboardShellProps) {
  const [mobileNavOpen, setMobileNavOpen] = useState(false);

  return (
    <div className='flex min-h-screen flex-col bg-zinc-900'>
      <div className='flex flex-1'>
        {/* Desktop Sidebar */}
        <aside className='sticky top-0 hidden h-screen w-64 flex-shrink-0 border-r border-zinc-800 bg-zinc-950 lg:block'>
          <div className='flex h-full flex-col'>
            {/* Logo */}
            <div className='flex h-16 items-center border-b border-zinc-800 px-6'>
              <Logo />
            </div>

            {/* Navigation */}
            <nav className='flex-1 space-y-1 px-3 py-4'>
              <NavItems />
            </nav>

            {/* Sidebar Footer */}
            <div className='border-t border-zinc-800 p-4'>
              <LogoutButton />
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <div className='flex flex-1 flex-col overflow-y-auto'>
          {/* Header */}
          <header className='sticky top-0 z-40 flex h-16 flex-shrink-0 items-center justify-between border-b border-zinc-800 bg-zinc-900/95 px-4 backdrop-blur supports-[backdrop-filter]:bg-zinc-900/60 lg:px-6'>
            {/* Mobile Menu Button */}
            <div className='flex items-center gap-4 lg:hidden'>
              <Sheet open={mobileNavOpen} onOpenChange={setMobileNavOpen}>
                <SheetTrigger asChild>
                  <button className='rounded-lg p-2 text-zinc-400 hover:bg-zinc-800 hover:text-white'>
                    <Menu className='h-6 w-6' />
                    <span className='sr-only'>Open menu</span>
                  </button>
                </SheetTrigger>
                <SheetContent side='left' className='w-72 border-zinc-800 bg-zinc-950 p-0'>
                  <SheetHeader className='border-b border-zinc-800 px-6 py-4'>
                    <SheetTitle>
                      <Logo size='md' href={undefined} />
                    </SheetTitle>
                  </SheetHeader>
                  <nav className='flex-1 space-y-1 px-3 py-4'>
                    <NavItems onClick={() => setMobileNavOpen(false)} />
                  </nav>
                  <div className='border-t border-zinc-800 p-4'>
                    <LogoutButton onClick={() => setMobileNavOpen(false)} />
                  </div>
                </SheetContent>
              </Sheet>
              <Logo href='/dashboard' size='sm' />
            </div>

            {/* Desktop: Empty space or breadcrumbs */}
            <div className='hidden lg:block' />

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className='flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-zinc-300 transition-colors hover:bg-zinc-800'>
                  <div className='flex h-8 w-8 items-center justify-center rounded-full bg-orange-500/20 text-orange-500'>
                    <span className='text-sm font-medium uppercase'>{userEmail.charAt(0)}</span>
                  </div>
                  <span className='hidden max-w-[150px] truncate md:inline'>{userEmail}</span>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align='end' className='w-56 border-zinc-700 bg-zinc-800'>
                <DropdownMenuLabel className='text-zinc-400'>
                  <span className='block truncate text-sm font-normal'>{userEmail}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator className='bg-zinc-700' />
                <DropdownMenuItem asChild className='cursor-pointer text-zinc-300 focus:bg-zinc-700 focus:text-white'>
                  <Link href='/dashboard/account'>Account</Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild className='cursor-pointer text-zinc-300 focus:bg-zinc-700 focus:text-white'>
                  <Link href='/dashboard/billing'>Billing</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator className='bg-zinc-700' />
                <DropdownMenuItem asChild className='cursor-pointer p-0 text-zinc-300 focus:bg-zinc-700 focus:text-white'>
                  <form action={handleSignOut} className='w-full'>
                    <button type='submit' className='w-full px-2 py-1.5 text-left'>
                      Log out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </header>

          {/* Page Content */}
          <main className='flex-1 p-4 lg:p-6'>{children}</main>
        </div>
      </div>
    </div>
  );
}
