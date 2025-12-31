'use client';

import { useState, useTransition } from 'react';
import Image from 'next/image';
import { Loader2, Trash2, Upload } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { updateContest } from '@/features/contests/actions/update-contest';
import { deleteContestImage, uploadContestImage } from '@/features/contests/actions/upload-contest-image';
import { Database } from '@/libs/supabase/types';
import { zodResolver } from '@hookform/resolvers/zod';

import { ImageUploadModal } from './image-upload-modal';

type Contest = Database['public']['Tables']['contests']['Row'];

const DEFAULT_PRIMARY_COLOR = '#F97316';
const DEFAULT_SECONDARY_COLOR = '#D97706';

const colorSchema = z.object({
  primary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
  secondary_color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Invalid color format'),
});

type ColorFormData = z.infer<typeof colorSchema>;

interface BrandingSectionProps {
  contest: Contest;
}

export function BrandingSection({ contest }: BrandingSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [heroUploading, setHeroUploading] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [heroDeleting, setHeroDeleting] = useState(false);
  const [logoDeleting, setLogoDeleting] = useState(false);
  const [heroImageUrl, setHeroImageUrl] = useState(contest.hero_image_url);
  const [logoImageUrl, setLogoImageUrl] = useState(contest.org_image_url);
  const [heroModalOpen, setHeroModalOpen] = useState(false);
  const [logoModalOpen, setLogoModalOpen] = useState(false);

  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<ColorFormData>({
    resolver: zodResolver(colorSchema),
    defaultValues: {
      primary_color: contest.primary_color ?? DEFAULT_PRIMARY_COLOR,
      secondary_color: contest.secondary_color ?? DEFAULT_SECONDARY_COLOR,
    },
  });

  const primaryColor = watch('primary_color');
  const secondaryColor = watch('secondary_color');

  const handleHeroUpload = async (file: File) => {
    setHeroUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', 'hero');

      const result = await uploadContestImage(contest.id, formData);

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: result.error.message,
        });
        return;
      }

      if (result?.data?.url) {
        await updateContest(contest.id, { hero_image_url: result.data.url });
        setHeroImageUrl(result.data.url);
        setHeroModalOpen(false);
        toast({
          title: 'Image uploaded',
          description: 'Hero image has been updated.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setHeroUploading(false);
    }
  };

  const handleLogoUpload = async (file: File) => {
    setLogoUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('imageType', 'logo');

      const result = await uploadContestImage(contest.id, formData);

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Upload failed',
          description: result.error.message,
        });
        return;
      }

      if (result?.data?.url) {
        await updateContest(contest.id, { org_image_url: result.data.url });
        setLogoImageUrl(result.data.url);
        setLogoModalOpen(false);
        toast({
          title: 'Image uploaded',
          description: 'Organization logo has been updated.',
        });
      }
    } catch {
      toast({
        variant: 'destructive',
        title: 'Upload failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setLogoUploading(false);
    }
  };

  const handleHeroDelete = async () => {
    if (!heroImageUrl) return;

    setHeroDeleting(true);
    try {
      const deleteResult = await deleteContestImage(heroImageUrl);

      if (deleteResult?.error) {
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: deleteResult.error.message,
        });
        return;
      }

      await updateContest(contest.id, { hero_image_url: null });
      setHeroImageUrl(null);
      toast({
        title: 'Image removed',
        description: 'Hero image has been deleted.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setHeroDeleting(false);
    }
  };

  const handleLogoDelete = async () => {
    if (!logoImageUrl) return;

    setLogoDeleting(true);
    try {
      const deleteResult = await deleteContestImage(logoImageUrl);

      if (deleteResult?.error) {
        toast({
          variant: 'destructive',
          title: 'Delete failed',
          description: deleteResult.error.message,
        });
        return;
      }

      await updateContest(contest.id, { org_image_url: null });
      setLogoImageUrl(null);
      toast({
        title: 'Image removed',
        description: 'Organization logo has been deleted.',
      });
    } catch {
      toast({
        variant: 'destructive',
        title: 'Delete failed',
        description: 'An unexpected error occurred.',
      });
    } finally {
      setLogoDeleting(false);
    }
  };

  const onSubmit = (data: ColorFormData) => {
    startTransition(async () => {
      const result = await updateContest(contest.id, {
        primary_color: data.primary_color,
        secondary_color: data.secondary_color,
      });

      if (result?.error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: result.error.message,
        });
        return;
      }

      toast({
        title: 'Colors saved',
        description: 'Brand colors have been updated.',
      });
    });
  };

  return (
    <>
      <Card className="border-zinc-800 bg-zinc-900">
        <CardHeader>
          <CardTitle className="text-white">Branding</CardTitle>
          <CardDescription>Customize the look of your contest page.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          {/* Hero Image */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">Hero Image</Label>
              <p className="text-sm text-zinc-400">Displayed at the top of your contest page.</p>
            </div>

            {heroImageUrl && (
              <div className="relative aspect-[3/1] w-full max-w-md overflow-hidden rounded-lg border border-zinc-700">
                <Image src={heroImageUrl} alt="Hero image" fill className="object-cover" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setHeroModalOpen(true)}
                className="border-zinc-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                {heroImageUrl ? 'Replace' : 'Upload Image'}
              </Button>

              {heroImageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleHeroDelete}
                  disabled={heroDeleting}
                  className="border-zinc-700 text-red-400 hover:bg-red-950 hover:text-red-300"
                >
                  {heroDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Organization Logo */}
          <div className="space-y-4">
            <div>
              <Label className="text-base">Organization Logo</Label>
              <p className="text-sm text-zinc-400">Displayed alongside your contest name.</p>
            </div>

            {logoImageUrl && (
              <div className="relative h-24 w-24 overflow-hidden rounded-full border border-zinc-700">
                <Image src={logoImageUrl} alt="Organization logo" fill className="object-cover" />
              </div>
            )}

            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setLogoModalOpen(true)}
                className="border-zinc-700"
              >
                <Upload className="mr-2 h-4 w-4" />
                {logoImageUrl ? 'Replace' : 'Upload Image'}
              </Button>

              {logoImageUrl && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleLogoDelete}
                  disabled={logoDeleting}
                  className="border-zinc-700 text-red-400 hover:bg-red-950 hover:text-red-300"
                >
                  {logoDeleting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Trash2 className="mr-2 h-4 w-4" />
                  )}
                  Remove
                </Button>
              )}
            </div>
          </div>

          {/* Colors */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <Label className="text-base">Brand Colors</Label>
              <p className="text-sm text-zinc-400">Customize the colors used on your contest page.</p>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="primary_color">Primary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="primary_color"
                    type="color"
                    value={primaryColor}
                    onChange={(e) => setValue('primary_color', e.target.value, { shouldDirty: true })}
                    className="h-10 w-16 cursor-pointer border-zinc-700 bg-zinc-800 p-1"
                  />
                  <Input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setValue('primary_color', e.target.value.toUpperCase(), { shouldDirty: true })}
                    className="flex-1 border-zinc-700 bg-zinc-800 font-mono uppercase"
                    maxLength={7}
                    placeholder="#F97316"
                  />
                </div>
                {errors.primary_color && <p className="text-sm text-red-500">{errors.primary_color.message}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="secondary_color">Secondary Color</Label>
                <div className="flex gap-2">
                  <Input
                    id="secondary_color"
                    type="color"
                    value={secondaryColor}
                    onChange={(e) => setValue('secondary_color', e.target.value, { shouldDirty: true })}
                    className="h-10 w-16 cursor-pointer border-zinc-700 bg-zinc-800 p-1"
                  />
                  <Input
                    type="text"
                    value={secondaryColor}
                    onChange={(e) => setValue('secondary_color', e.target.value.toUpperCase(), { shouldDirty: true })}
                    className="flex-1 border-zinc-700 bg-zinc-800 font-mono uppercase"
                    maxLength={7}
                    placeholder="#D97706"
                  />
                </div>
                {errors.secondary_color && <p className="text-sm text-red-500">{errors.secondary_color.message}</p>}
              </div>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button type="submit" disabled={isPending || !isDirty}>
                {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Colors
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Hero Image Upload Modal */}
      <ImageUploadModal
        isOpen={heroModalOpen}
        onClose={() => setHeroModalOpen(false)}
        onUpload={handleHeroUpload}
        imageType="hero"
        isUploading={heroUploading}
      />

      {/* Logo Upload Modal */}
      <ImageUploadModal
        isOpen={logoModalOpen}
        onClose={() => setLogoModalOpen(false)}
        onUpload={handleLogoUpload}
        imageType="logo"
        isUploading={logoUploading}
      />
    </>
  );
}
