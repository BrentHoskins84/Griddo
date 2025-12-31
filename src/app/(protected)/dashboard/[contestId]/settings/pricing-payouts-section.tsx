'use client';

import { useTransition } from 'react';
import { Loader2 } from 'lucide-react';
import { type Resolver,useForm } from 'react-hook-form';
import { z } from 'zod';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/components/ui/use-toast';
import { updateContest } from '@/features/contests/actions/update-contest';
import { Database } from '@/libs/supabase/types';
import { zodResolver } from '@hookform/resolvers/zod';

type Contest = Database['public']['Tables']['contests']['Row'];

// Base schema for pricing
const baseSchema = z.object({
  square_price: z.coerce.number().min(1, 'Price must be at least $1'),
  max_squares_per_person: z.coerce.number().min(1).max(100).nullable(),
});

// Football payout schema
const footballPayoutSchema = baseSchema.extend({
  payout_q1_percent: z.coerce.number().min(0).max(100),
  payout_q2_percent: z.coerce.number().min(0).max(100),
  payout_q3_percent: z.coerce.number().min(0).max(100),
  payout_final_percent: z.coerce.number().min(0).max(100),
}).refine(
  (data) => {
    const total = data.payout_q1_percent + data.payout_q2_percent + data.payout_q3_percent + data.payout_final_percent;
    return total <= 100;
  },
  { message: 'Total payouts cannot exceed 100%', path: ['payout_final_percent'] }
);

// Baseball payout schema
const baseballPayoutSchema = baseSchema.extend({
  payout_game1_percent: z.coerce.number().min(0).max(100),
  payout_game2_percent: z.coerce.number().min(0).max(100),
  payout_game3_percent: z.coerce.number().min(0).max(100),
  payout_game4_percent: z.coerce.number().min(0).max(100),
  payout_game5_percent: z.coerce.number().min(0).max(100),
  payout_game6_percent: z.coerce.number().min(0).max(100),
  payout_game7_percent: z.coerce.number().min(0).max(100),
}).refine(
  (data) => {
    const total = data.payout_game1_percent + data.payout_game2_percent + data.payout_game3_percent +
      data.payout_game4_percent + data.payout_game5_percent + data.payout_game6_percent + data.payout_game7_percent;
    return total <= 100;
  },
  { message: 'Total payouts cannot exceed 100%', path: ['payout_game7_percent'] }
);

type FootballFormData = z.infer<typeof footballPayoutSchema>;
type BaseballFormData = z.infer<typeof baseballPayoutSchema>;

interface PricingPayoutsSectionProps {
  contest: Contest;
}

export function PricingPayoutsSection({ contest }: PricingPayoutsSectionProps) {
  const isFootball = contest.sport_type === 'football';

  if (isFootball) {
    return <FootballPayoutsForm contest={contest} />;
  }

  return <BaseballPayoutsForm contest={contest} />;
}

function FootballPayoutsForm({ contest }: { contest: Contest }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<FootballFormData>({
    resolver: zodResolver(footballPayoutSchema) as Resolver<FootballFormData>,
    defaultValues: {
      square_price: contest.square_price,
      max_squares_per_person: contest.max_squares_per_person,
      payout_q1_percent: contest.payout_q1_percent ?? 0,
      payout_q2_percent: contest.payout_q2_percent ?? 0,
      payout_q3_percent: contest.payout_q3_percent ?? 0,
      payout_final_percent: contest.payout_final_percent ?? 0,
    },
  });

  const watchedValues = watch();
  const totalPercent = (watchedValues.payout_q1_percent || 0) + (watchedValues.payout_q2_percent || 0) +
    (watchedValues.payout_q3_percent || 0) + (watchedValues.payout_final_percent || 0);
  const totalPot = (watchedValues.square_price || 0) * 100;
  const totalPayout = (totalPot * totalPercent) / 100;
  const fundraiserKeeps = totalPot - totalPayout;

  const onSubmit = (data: FootballFormData) => {
    startTransition(async () => {
      const result = await updateContest(contest.id, {
        square_price: data.square_price,
        max_squares_per_person: data.max_squares_per_person,
        payout_q1_percent: data.payout_q1_percent,
        payout_q2_percent: data.payout_q2_percent,
        payout_q3_percent: data.payout_q3_percent,
        payout_final_percent: data.payout_final_percent,
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
        description: 'Pricing and payouts have been updated.',
      });
    });
  };

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Pricing & Payouts</CardTitle>
        <CardDescription>Set square price and payout percentages for each quarter.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="square_price">Square Price ($)</Label>
              <Input
                id="square_price"
                type="number"
                min="1"
                {...register('square_price')}
                className="border-zinc-700 bg-zinc-800"
              />
              {errors.square_price && <p className="text-sm text-red-500">{errors.square_price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_squares_per_person">Max Squares Per Person</Label>
              <Input
                id="max_squares_per_person"
                type="number"
                min="1"
                max="100"
                placeholder="No limit"
                {...register('max_squares_per_person')}
                className="border-zinc-700 bg-zinc-800"
              />
              {errors.max_squares_per_person && (
                <p className="text-sm text-red-500">{errors.max_squares_per_person.message}</p>
              )}
            </div>
          </div>

          {/* Payouts */}
          <div className="space-y-4">
            <Label className="text-base">Payout Percentages</Label>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="space-y-2">
                <Label htmlFor="payout_q1_percent" className="text-sm text-zinc-400">Q1 (%)</Label>
                <Input
                  id="payout_q1_percent"
                  type="number"
                  min="0"
                  max="100"
                  {...register('payout_q1_percent')}
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout_q2_percent" className="text-sm text-zinc-400">Halftime (%)</Label>
                <Input
                  id="payout_q2_percent"
                  type="number"
                  min="0"
                  max="100"
                  {...register('payout_q2_percent')}
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout_q3_percent" className="text-sm text-zinc-400">Q3 (%)</Label>
                <Input
                  id="payout_q3_percent"
                  type="number"
                  min="0"
                  max="100"
                  {...register('payout_q3_percent')}
                  className="border-zinc-700 bg-zinc-800"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="payout_final_percent" className="text-sm text-zinc-400">Final (%)</Label>
                <Input
                  id="payout_final_percent"
                  type="number"
                  min="0"
                  max="100"
                  {...register('payout_final_percent')}
                  className="border-zinc-700 bg-zinc-800"
                />
                {errors.payout_final_percent && (
                  <p className="text-sm text-red-500">{errors.payout_final_percent.message}</p>
                )}
              </div>
            </div>
          </div>

          {/* Calculated Totals */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-zinc-400">Total Pot</p>
                <p className="text-xl font-bold text-white">${totalPot.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Payout ({totalPercent}%)</p>
                <p className="text-xl font-bold text-orange-400">${totalPayout.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Fundraiser Keeps</p>
                <p className="text-xl font-bold text-green-400">${fundraiserKeeps.toLocaleString()}</p>
              </div>
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

function BaseballPayoutsForm({ contest }: { contest: Contest }) {
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors, isDirty },
  } = useForm<BaseballFormData>({
    resolver: zodResolver(baseballPayoutSchema) as Resolver<BaseballFormData>,
    defaultValues: {
      square_price: contest.square_price,
      max_squares_per_person: contest.max_squares_per_person,
      payout_game1_percent: contest.payout_game1_percent ?? 0,
      payout_game2_percent: contest.payout_game2_percent ?? 0,
      payout_game3_percent: contest.payout_game3_percent ?? 0,
      payout_game4_percent: contest.payout_game4_percent ?? 0,
      payout_game5_percent: contest.payout_game5_percent ?? 0,
      payout_game6_percent: contest.payout_game6_percent ?? 0,
      payout_game7_percent: contest.payout_game7_percent ?? 0,
    },
  });

  const watchedValues = watch();
  const totalPercent = (watchedValues.payout_game1_percent || 0) + (watchedValues.payout_game2_percent || 0) +
    (watchedValues.payout_game3_percent || 0) + (watchedValues.payout_game4_percent || 0) +
    (watchedValues.payout_game5_percent || 0) + (watchedValues.payout_game6_percent || 0) +
    (watchedValues.payout_game7_percent || 0);
  const totalPot = (watchedValues.square_price || 0) * 100;
  const totalPayout = (totalPot * totalPercent) / 100;
  const fundraiserKeeps = totalPot - totalPayout;

  const onSubmit = (data: BaseballFormData) => {
    startTransition(async () => {
      const result = await updateContest(contest.id, {
        square_price: data.square_price,
        max_squares_per_person: data.max_squares_per_person,
        payout_game1_percent: data.payout_game1_percent,
        payout_game2_percent: data.payout_game2_percent,
        payout_game3_percent: data.payout_game3_percent,
        payout_game4_percent: data.payout_game4_percent,
        payout_game5_percent: data.payout_game5_percent,
        payout_game6_percent: data.payout_game6_percent,
        payout_game7_percent: data.payout_game7_percent,
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
        description: 'Pricing and payouts have been updated.',
      });
    });
  };

  const gameLabels = ['Game 1', 'Game 2', 'Game 3', 'Game 4', 'Game 5', 'Game 6', 'Game 7'];
  const gameFields = [
    'payout_game1_percent',
    'payout_game2_percent',
    'payout_game3_percent',
    'payout_game4_percent',
    'payout_game5_percent',
    'payout_game6_percent',
    'payout_game7_percent',
  ] as const;

  return (
    <Card className="border-zinc-800 bg-zinc-900">
      <CardHeader>
        <CardTitle className="text-white">Pricing & Payouts</CardTitle>
        <CardDescription>Set square price and payout percentages for each game.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          {/* Pricing */}
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="square_price">Square Price ($)</Label>
              <Input
                id="square_price"
                type="number"
                min="1"
                {...register('square_price')}
                className="border-zinc-700 bg-zinc-800"
              />
              {errors.square_price && <p className="text-sm text-red-500">{errors.square_price.message}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="max_squares_per_person">Max Squares Per Person</Label>
              <Input
                id="max_squares_per_person"
                type="number"
                min="1"
                max="100"
                placeholder="No limit"
                {...register('max_squares_per_person')}
                className="border-zinc-700 bg-zinc-800"
              />
              {errors.max_squares_per_person && (
                <p className="text-sm text-red-500">{errors.max_squares_per_person.message}</p>
              )}
            </div>
          </div>

          {/* Payouts */}
          <div className="space-y-4">
            <Label className="text-base">Payout Percentages</Label>
            <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-4">
              {gameFields.map((field, index) => (
                <div key={field} className="space-y-2">
                  <Label htmlFor={field} className="text-sm text-zinc-400">{gameLabels[index]} (%)</Label>
                  <Input
                    id={field}
                    type="number"
                    min="0"
                    max="100"
                    {...register(field)}
                    className="border-zinc-700 bg-zinc-800"
                  />
                </div>
              ))}
            </div>
            {errors.payout_game7_percent && (
              <p className="text-sm text-red-500">{errors.payout_game7_percent.message}</p>
            )}
          </div>

          {/* Calculated Totals */}
          <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm text-zinc-400">Total Pot</p>
                <p className="text-xl font-bold text-white">${totalPot.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Total Payout ({totalPercent}%)</p>
                <p className="text-xl font-bold text-orange-400">${totalPayout.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-sm text-zinc-400">Fundraiser Keeps</p>
                <p className="text-xl font-bold text-green-400">${fundraiserKeeps.toLocaleString()}</p>
              </div>
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

