'use client';

import { useState, useTransition } from 'react';
import { Eye, EyeOff, Loader2, RefreshCw } from 'lucide-react';
import { Controller, useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/components/ui/use-toast';
import { updateContest } from '@/features/contests/actions/update-contest';
import { Database } from '@/libs/supabase/types';
import { zodResolver } from '@hookform/resolvers/zod';

type Contest = Database['public']['Tables']['contests']['Row'];

const accessControlSchema = z.object({
  is_public: z.boolean(),
  require_pin: z.boolean(),
  access_pin: z
    .string()
    .max(6, 'PIN must be 6 characters or less')
    .regex(/^[A-Za-z0-9]*$/, 'PIN must be alphanumeric')
    .optional()
    .nullable(),
}).refine(
  (data) => {
    if (data.require_pin && (!data.access_pin || data.access_pin.length === 0)) {
      return false;
    }
    return true;
  },
  { message: 'PIN is required when PIN access is enabled', path: ['access_pin'] }
);

type AccessControlFormData = z.infer<typeof accessControlSchema>;

interface AccessControlSectionProps {
  contest: Contest;
}

function generatePin(): string {
  const alphabet = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += alphabet.charAt(Math.floor(Math.random() * alphabet.length));
  }
  return pin;
}

export function AccessControlSection({ contest }: AccessControlSectionProps) {
  const [isPending, startTransition] = useTransition();
  const [showPin, setShowPin] = useState(false);
  const { toast } = useToast();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<AccessControlFormData>({
    resolver: zodResolver(accessControlSchema),
    defaultValues: {
      is_public: contest.is_public,
      require_pin: !!contest.access_pin,
      access_pin: contest.access_pin ?? '',
    },
  });

  const requirePin = watch('require_pin');

  const handleGeneratePin = () => {
    const newPin = generatePin();
    setValue('access_pin', newPin, { shouldDirty: true });
  };

  const onSubmit = (data: AccessControlFormData) => {
    startTransition(async () => {
      const result = await updateContest(contest.id, {
        is_public: data.is_public,
        access_pin: data.require_pin ? data.access_pin : null,
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
        title: 'Settings saved',
        description: 'Access control settings have been updated.',
      });
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Access Control</CardTitle>
        <CardDescription>Control who can view and access your contest.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Public Visibility */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="is_public" className="text-base">Make contest public</Label>
              <p className="text-sm text-zinc-400">
                When enabled, anyone with the link can view the contest
              </p>
            </div>
            <Controller
              name="is_public"
              control={control}
              render={({ field }) => (
                <Switch
                  id="is_public"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Require PIN */}
          <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="space-y-0.5">
              <Label htmlFor="require_pin" className="text-base">Require PIN to access</Label>
              <p className="text-sm text-zinc-400">
                When enabled, participants must enter a PIN to view your contest
              </p>
            </div>
            <Controller
              name="require_pin"
              control={control}
              render={({ field }) => (
                <Switch
                  id="require_pin"
                  checked={field.value}
                  onCheckedChange={field.onChange}
                />
              )}
            />
          </div>

          {/* Access PIN Input */}
          {requirePin && (
            <div className="space-y-2">
              <Label htmlFor="access_pin">Access PIN</Label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Input
                    id="access_pin"
                    type={showPin ? 'text' : 'password'}
                    maxLength={6}
                    {...register('access_pin')}
                    className="border-zinc-700 bg-zinc-800 pr-10 font-mono uppercase tracking-widest"
                    placeholder="XXXXXX"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPin(!showPin)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-white"
                  >
                    {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGeneratePin}
                  className="border-zinc-700"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Generate
                </Button>
              </div>
              {errors.access_pin && <p className="text-sm text-red-500">{errors.access_pin.message}</p>}
              <p className="text-xs text-zinc-500">
                6 characters max, letters and numbers only
              </p>
            </div>
          )}

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
            <Button type="submit" disabled={isPending || !isDirty}>
              {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
}

