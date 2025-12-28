import { redirect } from 'next/navigation';

import { getUser } from '@/features/account/controllers/get-session';

import { DashboardShell } from './dashboard-shell';

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const user = await getUser();

  if (!user) {
    redirect('/login');
  }

  const userEmail = user.email ?? 'User';

  return <DashboardShell userEmail={userEmail}>{children}</DashboardShell>;
}

