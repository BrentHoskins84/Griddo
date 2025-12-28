import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function Logo({ href = '/', className = '', size = 'lg' }: LogoProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-xl',
    lg: 'text-2xl',
  };

  const content = (
    <span className={`bg-gradient-to-r from-fundwell-primary to-fundwell-accent bg-clip-text font-alt font-bold text-transparent ${sizeClasses[size]}`}>
      Fundwell
    </span>
  );

  if (href) {
    return (
      <Link href={href} className={`flex w-fit items-center gap-2 ${className}`}>
        {/* Logo image - commented out for now, can be added back later */}
        {/* <Image
          src='/logo.png'
          width={40}
          height={40}
          priority
          quality={100}
          alt='Fundwell logo mark'
        /> */}
        {content}
      </Link>
    );
  }

  return (
    <div className={`flex w-fit items-center gap-2 ${className}`}>
      {/* Logo image - commented out for now, can be added back later */}
      {/* <Image
        src='/logo.png'
        width={40}
        height={40}
        priority
        quality={100}
        alt='Fundwell logo mark'
      /> */}
      {content}
    </div>
  );
}
