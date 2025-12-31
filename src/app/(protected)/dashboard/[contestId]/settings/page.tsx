import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft } from 'lucide-react';

import { getContestById, getPaymentOptionsForContest } from '@/features/contests/queries';
import { createSupabaseServerClient } from '@/libs/supabase/supabase-server-client';

import { AccessControlSection } from './access-control-section';
import { BasicInfoSection } from './basic-info-section';
import { BrandingSection } from './branding-section';
import { ContestStatusSection } from './contest-status-section';
import { DangerZoneSection } from './danger-zone-section';
import { PaymentOptionsSection } from './payment-options-section';
import { PricingPayoutsSection } from './pricing-payouts-section';

interface SettingsPageProps {
  params: Promise<{ contestId: string }>;
}

export default async function SettingsPage({ params }: SettingsPageProps) {
  const { contestId } = await params;
  const supabase = await createSupabaseServerClient();

  // Get current user
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Fetch contest
  const contest = await getContestById(contestId);

  // Check if contest exists and is not deleted
  if (!contest || contest.deleted_at) {
    notFound();
  }

  // Verify user owns the contest
  if (contest.owner_id !== user.id) {
    redirect('/dashboard');
  }

  // Fetch payment options
  const paymentOptions = await getPaymentOptionsForContest(contestId);

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href={`/dashboard/${contestId}`}
        className="inline-flex items-center gap-2 text-sm text-zinc-400 transition-colors hover:text-white"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to Contest
      </Link>

      {/* Page Title */}
      <div>
        <h1 className="text-2xl font-bold text-white lg:text-3xl">Contest Settings</h1>
        <p className="mt-1 text-sm text-zinc-400">{contest.name}</p>
      </div>

      {/* Settings Sections */}
      <div className="space-y-6">
        <BasicInfoSection contest={contest} />
        <ContestStatusSection contest={contest} />
        <PricingPayoutsSection contest={contest} />
        <PaymentOptionsSection contest={contest} paymentOptions={paymentOptions} />
        <AccessControlSection contest={contest} />
        <BrandingSection contest={contest} />
        <DangerZoneSection contest={contest} />
      </div>
    </div>
  );
}

