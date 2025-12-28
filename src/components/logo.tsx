import { ReactElement } from 'react';
import Link from 'next/link';

import { cn } from '@/utils/cn';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ href = '/', className = '', size = 'lg' }: LogoProps): ReactElement {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <span className={cn('bg-gradient-to-r from-fundwell-primary to-fundwell-accent bg-clip-text font-alt font-bold text-transparent', sizeClasses[size])}>
      Fundwell
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={`flex w-fit items-center gap-2 ${className}`}>
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex w-fit items-center gap-2 ${className}`}>
      {content}
    </div>
  );
}
