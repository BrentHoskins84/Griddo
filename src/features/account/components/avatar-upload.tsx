'use client';

import { useRef, useState, useTransition } from 'react';
import Image from 'next/image';
import { Loader2, Upload } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useToast } from '@/components/ui/use-toast';

import { uploadAvatar } from '../actions/upload-avatar';

interface AvatarUploadProps {
  currentAvatarUrl: string | null;
  userEmail: string;
}

const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const MAX_SIZE = 2 * 1024 * 1024; // 2MB

export function AvatarUpload({ currentAvatarUrl, userEmail }: AvatarUploadProps) {
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isPending, startTransition] = useTransition();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileSelect = (file: File) => {
    // Validate file type
    if (!ACCEPTED_TYPES.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please use JPEG, PNG, or WebP.',
      });
      return;
    }

    // Validate file size
    if (file.size > MAX_SIZE) {
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Maximum size is 2MB.',
      });
      return;
    }

    setSelectedFile(file);
    const reader = new FileReader();
    reader.onloadend = () => {
      setPreviewUrl(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    // Reset input so same file can be selected again
    e.target.value = '';
  };

  const handleUpload = () => {
    if (!selectedFile) return;

    startTransition(async () => {
      try {
        const formData = new FormData();
        formData.append('file', selectedFile);

        const result = await uploadAvatar(formData);

        if (result?.error) {
          toast({
            variant: 'destructive',
            title: 'Upload failed',
            description: result.error.message || 'Something went wrong. Please try again.',
          });
          return;
        }

        toast({
          title: 'Avatar updated',
          description: 'Your avatar has been updated successfully.',
        });

        // Clear preview and selected file
        setPreviewUrl(null);
        setSelectedFile(null);
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
        });
      }
    });
  };

  const handleCancel = () => {
    setPreviewUrl(null);
    setSelectedFile(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const displayUrl = previewUrl || currentAvatarUrl;
  const showFallback = !displayUrl;

  return (
    <div className="space-y-4">
      {/* Avatar Display */}
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={() => fileInputRef.current?.click()}
          disabled={isPending}
          className="relative flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-orange-500/20 transition-opacity hover:opacity-80 disabled:opacity-50"
        >
          {showFallback ? (
            <span className="text-xl font-medium uppercase text-orange-500">
              {userEmail.charAt(0)}
            </span>
          ) : (
            <Image
              src={displayUrl}
              alt="Avatar"
              fill
              className="object-cover"
              sizes="64px"
            />
          )}
        </button>

        <div className="flex-1">
          <p className="text-sm font-medium text-zinc-200">Profile Picture</p>
          <p className="text-xs text-zinc-500">JPEG, PNG, or WebP. Max 2MB.</p>
        </div>
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleInputChange}
        className="hidden"
        disabled={isPending}
      />

      {/* Preview and Actions */}
      {selectedFile && (
        <div className="space-y-3 rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="flex items-center gap-3">
            <div className="relative h-12 w-12 overflow-hidden rounded-full">
              {previewUrl && (
                <Image
                  src={previewUrl}
                  alt="Preview"
                  fill
                  className="object-cover"
                  sizes="48px"
                />
              )}
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-zinc-200">{selectedFile.name}</p>
              <p className="text-xs text-zinc-500">
                {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
              </p>
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              type="button"
              variant="orange"
              onClick={handleUpload}
              disabled={isPending}
              size="sm"
            >
              {isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Upload
                </>
              )}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              disabled={isPending}
              size="sm"
              className="border-zinc-700"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

