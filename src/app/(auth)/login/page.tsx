import { redirect } from 'next/navigation';

import { getUser } from '@/features/account/controllers/get-session';
import { signInWithEmail, signInWithOAuth } from '@/features/auth/auth-actions';
import { AuthUI } from '@/features/auth/auth-ui';

export default async function LoginPage() {
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  }

  return (
    <section className='py-xl m-auto flex h-full max-w-lg items-center'>
      <AuthUI mode='login' signInWithOAuth={signInWithOAuth} signInWithEmail={signInWithEmail} />
    </section>
  );
}
