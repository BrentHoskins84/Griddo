'use client';

import { useCallback, useRef, useState } from 'react';
import { Check, Copy, Download, QrCode } from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { logger } from '@/utils/logger';

interface ShareQrModalProps {
  isOpen: boolean;
  onClose: () => void;
  contestUrl: string;
  contestCode: string | null;
  contestName: string;
}

export function ShareQrModal({ isOpen, onClose, contestUrl, contestCode, contestName }: ShareQrModalProps) {
  const [copied, setCopied] = useState(false);
  const qrRef = useRef<HTMLDivElement>(null);

  const handleCopyLink = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(contestUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      logger.error('share-qr-modal', error);
    }
  }, [contestUrl]);

  const handleDownloadQr = useCallback(() => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;

    const url = canvas.toDataURL('image/png');
    const link = document.createElement('a');
    link.download = `${contestName.toLowerCase().replace(/\s+/g, '-')}-qr-code.png`;
    link.href = url;
    link.click();
  }, [contestName]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <QrCode className="h-5 w-5 text-orange-500" />
            Share Contest
          </DialogTitle>
          <DialogDescription>Share this QR code or link with participants</DialogDescription>
        </DialogHeader>

        <div className="flex flex-col items-center gap-6 py-4">
          {/* QR Code */}
          <div
            ref={qrRef}
            className="rounded-xl bg-white p-4"
          >
            <QRCodeCanvas
              value={contestUrl}
              size={200}
              level="H"
              marginSize={0}
            />
          </div>

          {/* Contest Code (only show if set) */}
          {contestCode && (
            <div className="rounded-lg bg-zinc-800 px-6 py-3 text-center">
              <p className="text-xs uppercase tracking-wider text-zinc-400">Access PIN</p>
              <p className="mt-1 font-mono text-2xl font-bold tracking-widest text-orange-400">
                {contestCode}
              </p>
            </div>
          )}

          {/* URL Display */}
          <div className="w-full rounded-lg border border-zinc-700 bg-zinc-800/50 px-4 py-3">
            <p className="truncate text-center text-sm text-zinc-300">{contestUrl}</p>
          </div>

          {/* Action Buttons */}
          <div className="flex w-full gap-3">
            <Button
              variant="default"
              className="flex-1"
              onClick={handleCopyLink}
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Link
                </>
              )}
            </Button>
            <Button
              variant="orange"
              className="flex-1"
              onClick={handleDownloadQr}
            >
              <Download className="mr-2 h-4 w-4" />
              Download QR
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

