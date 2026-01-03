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
import { FOOTBALL_QUARTER_LABELS, PRIZE_TEXT_MAX_LENGTH } from '@/features/contests/constants';
import { Database } from '@/libs/supabase/types';
import { cn } from '@/utils/cn';
import { zodResolver } from '@hookform/resolvers/zod';

type Contest = Database['public']['Tables']['contests']['Row'];

// Base schema for pricing
const baseSchema = z.object({
  square_price: z.coerce.number().min(1, 'Price must be at least $1'),
  max_squares_per_person: z.coerce.number().min(1).max(100).nullable(),
});

// Football payout schema
const footballPayoutSchema = baseSchema.extend({
  prize_type: z.enum(['percentage', 'custom']).default('percentage'),
  payout_q1_percent: z.coerce.number().min(0).max(100),
  payout_q2_percent: z.coerce.number().min(0).max(100),
  payout_q3_percent: z.coerce.number().min(0).max(100),
  payout_final_percent: z.coerce.number().min(0).max(100),
  prize_q1_text: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
  prize_q2_text: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
  prize_q3_text: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
  prize_final_text: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
}).refine(
  (data) => {
    if (data.prize_type === 'percentage') {
      const total = data.payout_q1_percent + data.payout_q2_percent + data.payout_q3_percent + data.payout_final_percent;
      return total <= 100;
    }
    return true;
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
    setValue,
    formState: { errors, isDirty },
  } = useForm<FootballFormData>({
    resolver: zodResolver(footballPayoutSchema) as Resolver<FootballFormData>,
    defaultValues: {
      square_price: contest.square_price,
      max_squares_per_person: contest.max_squares_per_person,
      prize_type: (contest.prize_type as 'percentage' | 'custom') ?? 'percentage',
      payout_q1_percent: contest.payout_q1_percent ?? 0,
      payout_q2_percent: contest.payout_q2_percent ?? 0,
      payout_q3_percent: contest.payout_q3_percent ?? 0,
      payout_final_percent: contest.payout_final_percent ?? 0,
      prize_q1_text: contest.prize_q1_text ?? undefined,
      prize_q2_text: contest.prize_q2_text ?? undefined,
      prize_q3_text: contest.prize_q3_text ?? undefined,
      prize_final_text: contest.prize_final_text ?? undefined,
    },
  });

  const watchedValues = watch();
  const prizeType = watchedValues.prize_type ?? 'percentage';
  const totalPercent = Number(watchedValues.payout_q1_percent || 0) + Number(watchedValues.payout_q2_percent || 0) +
    Number(watchedValues.payout_q3_percent || 0) + Number(watchedValues.payout_final_percent || 0);
  const totalPot = (watchedValues.square_price || 0) * 100;
  const totalPayout = (totalPot * totalPercent) / 100;
  const fundraiserKeeps = totalPot - totalPayout;

  const onSubmit = (data: FootballFormData) => {
    startTransition(async () => {
      const updates: Parameters<typeof updateContest>[1] = {
        square_price: data.square_price,
        max_squares_per_person: data.max_squares_per_person,
        prize_type: data.prize_type,
      };

      if (data.prize_type === 'percentage') {
        // Save payout percentages and clear prize text fields
        updates.payout_q1_percent = data.payout_q1_percent;
        updates.payout_q2_percent = data.payout_q2_percent;
        updates.payout_q3_percent = data.payout_q3_percent;
        updates.payout_final_percent = data.payout_final_percent;
        updates.prize_q1_text = null;
        updates.prize_q2_text = null;
        updates.prize_q3_text = null;
        updates.prize_final_text = null;
      } else {
        // Save prize text fields and set payout percentages to 0
        updates.payout_q1_percent = 0;
        updates.payout_q2_percent = 0;
        updates.payout_q3_percent = 0;
        updates.payout_final_percent = 0;
        updates.prize_q1_text = data.prize_q1_text || null;
        updates.prize_q2_text = data.prize_q2_text || null;
        updates.prize_q3_text = data.prize_q3_text || null;
        updates.prize_final_text = data.prize_final_text || null;
      }

      const result = await updateContest(contest.id, updates);

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

          {/* Prize Type Selection */}
          <div className="space-y-2">
            <Label className="text-base">Prize Type</Label>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setValue('prize_type', 'percentage', { shouldDirty: true })}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                  prizeType === 'percentage'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                )}
              >
                Cash Payouts
              </button>
              <button
                type="button"
                onClick={() => setValue('prize_type', 'custom', { shouldDirty: true })}
                className={cn(
                  'flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition-colors',
                  prizeType === 'custom'
                    ? 'border-orange-500 bg-orange-500/10 text-orange-400'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400 hover:border-zinc-600 hover:text-zinc-300'
                )}
              >
                Custom Prizes
              </button>
            </div>
            <input type="hidden" {...register('prize_type')} />
            {errors.prize_type && <p className="text-sm text-red-500">{errors.prize_type.message}</p>}
          </div>

          {/* Payout Percentages - Show when prize_type is 'percentage' */}
          {prizeType === 'percentage' && (
            <>
              <div className="space-y-4">
                <Label className="text-base">Payout Percentages</Label>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {FOOTBALL_QUARTER_LABELS.map((quarter) => {
                    const payoutField = quarter.dbField as keyof FootballFormData;
                    return (
                      <div key={quarter.key} className="space-y-2">
                        <Label htmlFor={payoutField} className="text-sm text-zinc-400">{quarter.label} (%)</Label>
                        <Input
                          id={payoutField}
                          type="number"
                          min="0"
                          max="100"
                          {...register(payoutField)}
                          className="border-zinc-700 bg-zinc-800"
                        />
                        {errors[payoutField] && (
                          <p className="text-sm text-red-500">{errors[payoutField]?.message}</p>
                        )}
                      </div>
                    );
                  })}
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
            </>
          )}

          {/* Custom Prize Text Inputs - Show when prize_type is 'custom' */}
          {prizeType === 'custom' && (
            <div className="space-y-4">
              <div>
                <Label className="text-base">Custom Prize Descriptions</Label>
                <p className="text-sm text-zinc-500">Enter prize descriptions for each quarter (max {PRIZE_TEXT_MAX_LENGTH} characters each).</p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                {FOOTBALL_QUARTER_LABELS.map((quarter) => {
                  const prizeField = `prize_${quarter.key}_text` as keyof FootballFormData;
                  return (
                    <div key={quarter.key} className="space-y-2">
                      <Label htmlFor={prizeField} className="text-sm text-zinc-400">
                        {quarter.label} Prize
                      </Label>
                      <Input
                        id={prizeField}
                        type="text"
                        maxLength={PRIZE_TEXT_MAX_LENGTH}
                        placeholder="e.g., $100 Gift Card"
                        {...register(prizeField)}
                        className="border-zinc-700 bg-zinc-800"
                      />
                      {errors[prizeField] && <p className="text-sm text-red-500">{errors[prizeField]?.message}</p>}
                    </div>
                  );
                })}
              </div>
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
  const totalPercent = Number(watchedValues.payout_game1_percent || 0) + Number(watchedValues.payout_game2_percent || 0) +
    Number(watchedValues.payout_game3_percent || 0) + Number(watchedValues.payout_game4_percent || 0) +
    Number(watchedValues.payout_game5_percent || 0) + Number(watchedValues.payout_game6_percent || 0) +
    Number(watchedValues.payout_game7_percent || 0);
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

