'use client';

import { useTransition } from 'react';
import { useRouter } from 'next/navigation';
import { Trophy } from 'lucide-react';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { updateContest } from '@/features/contests/actions/update-contest';
import { Database } from '@/libs/supabase/types';

type Contest = Database['public']['Tables']['contests']['Row'];

interface SuperBowlSectionProps {
  contest: Contest;
}

export function SuperBowlSection({ contest }: SuperBowlSectionProps) {
  const [isPending, startTransition] = useTransition();
  const router = useRouter();
  const { toast } = useToast();

  // Only show for football contests
  if (contest.sport_type !== 'football') return null;

  function handleToggle(checked: boolean) {
    startTransition(async () => {
      const result = await updateContest(contest.id, { is_super_bowl: checked });
      if (result?.error) {
        toast({ variant: 'destructive', title: 'Error', description: result.error.message });
      } else {
        toast({
          title: checked ? 'Super Bowl tracking enabled' : 'Super Bowl tracking disabled',
          description: checked
            ? 'This contest will be included in automated score tracking.'
            : 'This contest will no longer be tracked automatically.',
        });
        router.refresh();
      }
    });
  }

  return (
    <Card className='border-zinc-800 bg-zinc-900'>
      <CardHeader>
        <CardTitle className='flex items-center gap-2 text-white'>
          <Trophy className='h-5 w-5 text-amber-400' />
          Super Bowl Automation
        </CardTitle>
        <CardDescription>
          Enable automated score tracking for this contest during the Super Bowl. Scores will be
          fetched from ESPN, winners determined automatically, and notification emails sent.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4'>
          <div>
            <p className='text-sm font-medium text-zinc-300'>Automated Score Tracking</p>
            <p className='mt-1 text-xs text-zinc-500'>
              {(contest as Contest & { is_super_bowl?: boolean }).is_super_bowl
                ? 'Scores will be tracked automatically on game day'
                : 'Enable to include in Super Bowl automation'}
            </p>
          </div>
          <Switch
            checked={(contest as Contest & { is_super_bowl?: boolean }).is_super_bowl || false}
            onCheckedChange={handleToggle}
            disabled={isPending}
          />
        </div>
      </CardContent>
    </Card>
  );
}
