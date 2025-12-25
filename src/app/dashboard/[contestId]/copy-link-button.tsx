'use client';

import { useState } from 'react';
import { ShareIcon } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { ShareQrModal } from '@/features/contests/components/share-qr-modal';

interface CopyLinkButtonProps {
  url: string;
  code: string;
  contestName: string;
}

export function CopyLinkButton({ url, code, contestName }: CopyLinkButtonProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <>
      <Button variant="orange" size="sm" className="px-4" onClick={() => setIsModalOpen(true)}>
        <ShareIcon className="mr-2 size-4 shrink-0" />
        Share
      </Button>

      <ShareQrModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        contestUrl={url}
        contestCode={code}
        contestName={contestName}
      />
    </>
  );
}
