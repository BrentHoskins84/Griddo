'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Hash } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ManageNumbersModal } from '@/features/contests/components/manage-numbers-modal';

interface Contest {
  id: string;
  status: string;
  row_numbers: number[] | null;
  col_numbers: number[] | null;
  numbers_auto_generated: boolean | null;
  row_team_name: string | null;
  col_team_name: string | null;
}

interface ManageNumbersButtonProps {
  contest: Contest;
}

export function ManageNumbersButton({ contest }: ManageNumbersButtonProps) {
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);

  const handleSuccess = () => {
    router.refresh();
  };

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setIsOpen(true)}>
        <Hash className="mr-2 h-4 w-4" />
        Manage Numbers
      </Button>

      <ManageNumbersModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        contest={contest}
        onSuccess={handleSuccess}
      />
    </>
  );
}

