import { redirect } from 'next/navigation';

import { getUser } from '@/features/account/controllers/get-user';
import { getUserProfile } from '@/features/account/controllers/get-user-profile';

import { DashboardShell } from './dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const userEmail = user.email ?? 'User';
  const userProfile = await getUserProfile();
  const avatarUrl = userProfile?.avatar_url ?? null;

  return (
    <DashboardShell userEmail={userEmail} avatarUrl={avatarUrl}>
      {children}
    </DashboardShell>
  );
}

