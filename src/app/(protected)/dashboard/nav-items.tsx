'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CreditCard, LayoutGrid, LucideIcon, User } from 'lucide-react';

import { cn } from '@/utils/cn';

export interface NavItem {
  href: string;
  label: string;
  icon: LucideIcon;
}

export const navItems: NavItem[] = [
  { href: '/dashboard', label: 'My Contests', icon: LayoutGrid },
  { href: '/dashboard/account', label: 'Account', icon: User },
  { href: '/dashboard/billing', label: 'Billing', icon: CreditCard },
];

interface NavItemsProps {
  onClick?: () => void;
}

export function NavItems({ onClick }: NavItemsProps) {
  const pathname = usePathname();

  return (
    <>
      {navItems.map((item) => {
        const isActive = pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href));
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onClick}
            className={cn(
              'flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors',
              isActive ? 'bg-orange-500/10 text-orange-500' : 'text-zinc-400 hover:bg-zinc-800 hover:text-white'
            )}
          >
            <item.icon className='h-5 w-5' />
            {item.label}
          </Link>
        );
      })}
    </>
  );
}

