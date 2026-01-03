'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { zodResolver } from '@hookform/resolvers/zod';

import { updateProfile } from '../actions/update-profile';
import { UpdateProfileFormData, updateProfileSchema } from '../validation/profile-schema';

interface ProfileFormProps {
  defaultName: string | null;
}

export function ProfileForm({ defaultName }: ProfileFormProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<UpdateProfileFormData>({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: {
      fullName: defaultName || '',
    },
  });

  const onSubmit = (data: UpdateProfileFormData) => {
    startTransition(async () => {
      try {
        const result = await updateProfile(data);

        if (result?.error) {
          toast({
            variant: 'destructive',
            title: 'Error updating profile',
            description: result.error.message || 'Something went wrong. Please try again.',
          });
          return;
        }

        toast({
          title: 'Profile updated',
          description: 'Your profile has been updated successfully.',
        });
      } catch (error) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: 'An unexpected error occurred. Please try again.',
        });
      }
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="fullName" className="text-zinc-200">
          Full Name <span className="text-orange-500">*</span>
        </Label>
        <Input
          id="fullName"
          placeholder="John Doe"
          {...register('fullName')}
          className={errors.fullName ? 'border-red-500' : ''}
          disabled={isPending}
        />
        {errors.fullName && (
          <p className="text-sm text-red-500">{errors.fullName.message}</p>
        )}
      </div>

      <Button type="submit" disabled={isPending} variant="orange">
        {isPending ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : (
          'Save Changes'
        )}
      </Button>
    </form>
  );
}

