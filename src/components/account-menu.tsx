'use client';

import { ReactElement } from 'react';
import Link from 'next/link';
import { CircleUser } from 'lucide-react';

import {
  DropdownMenu,
  DropdownMenuArrow,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { signOut } from '@/features/auth/auth-actions';

async function handleSignOut() {
  await signOut();
}

export function AccountMenu(): ReactElement {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className='rounded-full'>
        <CircleUser className="h-6 w-6" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className='me-4'>
        <DropdownMenuItem asChild>
          <Link href='/account'>Account</Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild className='cursor-pointer p-0'>
          <form action={handleSignOut} className='w-full'>
            <button type='submit' className='w-full px-2 py-1.5 text-left'>
              Log Out
            </button>
          </form>
        </DropdownMenuItem>
        <DropdownMenuArrow className='me-4 fill-white' />
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
