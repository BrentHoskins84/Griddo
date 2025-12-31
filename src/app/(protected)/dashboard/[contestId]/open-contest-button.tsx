'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Play } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { openContest } from './actions';

interface OpenContestButtonProps {
  contestId: string;
  className?: string;
}

export function OpenContestButton({ contestId, className }: OpenContestButtonProps) {
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const router = useRouter();

  async function handleOpen() {
    setIsLoading(true);
    try {
      const result = await openContest(contestId);

      if (!result || result.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result?.error?.message ?? 'Failed to open contest',
        });
      } else {
        toast({
          title: 'Contest Opened!',
          description: 'Your contest is now open for participants to claim squares.',
        });
        router.refresh();
      }
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Something went wrong. Please try again.',
      });
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Button variant="orange" onClick={handleOpen} disabled={isLoading} className={className}>
      <Play className="mr-2 h-4 w-4" />
      {isLoading ? 'Opening...' : 'Open Contest'}
    </Button>
  );
}

