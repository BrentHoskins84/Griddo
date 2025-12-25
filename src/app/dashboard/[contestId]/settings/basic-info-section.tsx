'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { useForm } from 'react-hook-form';
import { z } from 'zod';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/components/ui/use-toast';
import { updateContest } from '@/features/contests/actions/update-contest';
import { Database } from '@/libs/supabase/types';
import { zodResolver } from '@hookform/resolvers/zod';

type Contest = Database['public']['Tables']['contests']['Row'];

const basicInfoSchema = z.object({
  name: z.string().min(1, 'Contest name is required').max(100, 'Name is too long'),
  description: z.string().max(500, 'Description is too long').optional(),
  row_team_name: z.string().min(1, 'Row team name is required').max(50, 'Name is too long'),
  col_team_name: z.string().min(1, 'Column team name is required').max(50, 'Name is too long'),
});

type BasicInfoFormData = z.infer<typeof basicInfoSchema>;

interface BasicInfoSectionProps {
  contest: Contest;
}

const SPORT_TYPE_LABELS: Record<string, string> = {
  football: 'Football',
  baseball: 'Baseball',
};

export function BasicInfoSection({ contest }: BasicInfoSectionProps) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    formState: { errors, isDirty },
  } = useForm<BasicInfoFormData>({
    resolver: zodResolver(basicInfoSchema),
    defaultValues: {
      name: contest.name,
      description: contest.description ?? '',
      row_team_name: contest.row_team_name,
      col_team_name: contest.col_team_name,
    },
  });

  const onSubmit = (data: BasicInfoFormData) => {
    startTransition(async () => {
      const result = await updateContest(contest.id, {
        name: data.name,
        description: data.description || null,
        row_team_name: data.row_team_name,
        col_team_name: data.col_team_name,
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
        description: 'Your contest settings have been updated.',
      });
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Basic Information</CardTitle>
        <CardDescription>Update your contest name, description, and team names.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          {/* Contest Name */}
          <div className="space-y-2">
            <Label htmlFor="name">Contest Name</Label>
            <Input
              id="name"
              {...register('name')}
              className="border-zinc-700 bg-zinc-800"
              placeholder="Super Bowl Squares 2025"
            />
            {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              {...register('description')}
              className="min-h-[100px] border-zinc-700 bg-zinc-800"
              placeholder="Enter a description for your contest..."
            />
            {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
          </div>

          {/* Sport Type (read-only) */}
          <div className="space-y-2">
            <Label>Sport Type</Label>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="border-zinc-700 text-zinc-300">
                {SPORT_TYPE_LABELS[contest.sport_type] || contest.sport_type}
              </Badge>
              <span className="text-xs text-zinc-500">(Cannot be changed after creation)</span>
            </div>
          </div>

          {/* Team Names */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="row_team_name">Row Team Name</Label>
              <Input
                id="row_team_name"
                {...register('row_team_name')}
                className="border-zinc-700 bg-zinc-800"
                placeholder="Kansas City Chiefs"
              />
              {errors.row_team_name && <p className="text-sm text-red-500">{errors.row_team_name.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="col_team_name">Column Team Name</Label>
              <Input
                id="col_team_name"
                {...register('col_team_name')}
                className="border-zinc-700 bg-zinc-800"
                placeholder="San Francisco 49ers"
              />
              {errors.col_team_name && <p className="text-sm text-red-500">{errors.col_team_name.message}</p>}
            </div>
          </div>

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

