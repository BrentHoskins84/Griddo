import { redirect } from 'next/navigation';

import { getUser } from '@/features/account/controllers/get-user';
import { signInWithEmail, signInWithOAuth } from '@/features/auth/auth-actions';
import { AuthUI } from '@/features/auth/auth-ui';

export default async function SignUp({
  searchParams,
}: {
  searchParams: Promise<{ redirect?: string }>;
}) {
  const user = await getUser();

  if (user) {
    redirect('/dashboard');
  }

  const { redirect: redirectParam } = await searchParams;
  const redirectUrl = redirectParam && redirectParam.startsWith('/') ? redirectParam : null;

  return (
    <section className='py-xl m-auto flex h-full max-w-lg items-center'>
      <AuthUI
        mode='signup'
        signInWithOAuth={signInWithOAuth}
        signInWithEmail={signInWithEmail}
        redirectUrl={redirectUrl}
      />
    </section>
  );
}
