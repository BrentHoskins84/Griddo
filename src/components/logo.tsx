import Image from 'next/image';
import Link from 'next/link';

export function Logo() {
  return (
    <Link href='/' className='flex w-fit items-center gap-2'>
      {/* Logo image - commented out for now, can be added back later */}
      {/* <Image
        src='/logo.png'
        width={40}
        height={40}
        priority
        quality={100}
        alt='Fundwell logo mark'
      /> */}
      <span className='bg-gradient-to-r from-fundwell-primary to-fundwell-accent bg-clip-text font-alt text-2xl font-bold text-transparent'>Fundwell</span>
    </Link>
  );
}
