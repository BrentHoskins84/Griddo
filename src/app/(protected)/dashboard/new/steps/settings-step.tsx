'use client';

import { useEffect, useState } from 'react';
import { Eye, EyeOff, RefreshCw } from 'lucide-react';
import { useFormContext, useWatch } from 'react-hook-form';

import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { CreateContestInput, SportType } from '@/features/contests/models/contest';
import { cn } from '@/utils/cn';

/**
 * Generates a random 6-character alphanumeric PIN
 */
function generateRandomPin(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let pin = '';
  for (let i = 0; i < 6; i++) {
    pin += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return pin;
}

type PayoutField = {
  name: keyof CreateContestInput;
  label: string;
  color: string;
};

const FOOTBALL_PAYOUT_FIELDS: PayoutField[] = [
  { name: 'payoutQ1Percent', label: 'Q1', color: 'bg-amber-500' },
  { name: 'payoutQ2Percent', label: 'Halftime', color: 'bg-orange-500' },
  { name: 'payoutQ3Percent', label: 'Q3', color: 'bg-red-500' },
  { name: 'payoutFinalPercent', label: 'Final', color: 'bg-rose-600' },
];

const BASEBALL_PAYOUT_FIELDS: PayoutField[] = [
  { name: 'payoutGame1Percent', label: 'Game 1', color: 'bg-blue-500' },
  { name: 'payoutGame2Percent', label: 'Game 2', color: 'bg-blue-600' },
  { name: 'payoutGame3Percent', label: 'Game 3', color: 'bg-indigo-500' },
  { name: 'payoutGame4Percent', label: 'Game 4', color: 'bg-indigo-600' },
  { name: 'payoutGame5Percent', label: 'Game 5', color: 'bg-violet-500' },
  { name: 'payoutGame6Percent', label: 'Game 6', color: 'bg-violet-600' },
  { name: 'payoutGame7Percent', label: 'Game 7', color: 'bg-purple-600' },
];

const FOOTBALL_PAYOUT_NAMES = ['payoutQ1Percent', 'payoutQ2Percent', 'payoutQ3Percent', 'payoutFinalPercent'] as const;
const BASEBALL_PAYOUT_NAMES = [
  'payoutGame1Percent',
  'payoutGame2Percent',
  'payoutGame3Percent',
  'payoutGame4Percent',
  'payoutGame5Percent',
  'payoutGame6Percent',
  'payoutGame7Percent',
] as const;

export function SettingsStep() {
  const {
    register,
    formState: { errors },
    control,
    setValue,
  } = useFormContext<CreateContestInput>();

  const [showPin, setShowPin] = useState(false);
  const [hasGeneratedPin, setHasGeneratedPin] = useState(false);

  const sportType = useWatch({ control, name: 'sportType' }) as SportType;
  const squarePrice = useWatch({ control, name: 'squarePrice' });
  const requirePin = useWatch({ control, name: 'requirePin' });
  const accessPin = useWatch({ control, name: 'accessPin' });

  // Auto-generate PIN when toggle is turned on (only once, not when user is editing)
  useEffect(() => {
    if (requirePin && !accessPin && !hasGeneratedPin) {
      setValue('accessPin', generateRandomPin());
      setHasGeneratedPin(true);
    }
  }, [requirePin, accessPin, hasGeneratedPin, setValue]);

  const handleGeneratePin = () => {
    setValue('accessPin', generateRandomPin());
    setHasGeneratedPin(true);
  };

  const handleRequirePinChange = (checked: boolean) => {
    setValue('requirePin', checked);
    if (!checked) {
      setValue('accessPin', undefined);
      setHasGeneratedPin(false);
    }
  };

  // Watch all payout values
  const footballPayouts = useWatch({ control, name: FOOTBALL_PAYOUT_NAMES as unknown as (keyof CreateContestInput)[] });
  const baseballPayouts = useWatch({ control, name: BASEBALL_PAYOUT_NAMES as unknown as (keyof CreateContestInput)[] });

  const isFootball = sportType === 'football';
  const payoutFields = isFootball ? FOOTBALL_PAYOUT_FIELDS : BASEBALL_PAYOUT_FIELDS;
  const payoutValues = isFootball ? footballPayouts : baseballPayouts;

  const totalPayout = (payoutValues as (number | undefined)[]).reduce((sum, val) => (sum ?? 0) + (Number(val) || 0), 0) ?? 0;
  const totalPot = (Number(squarePrice) || 0) * 100;

  return (
    <div className="space-y-8">
      {/* Square Price */}
      <div className="space-y-2">
        <Label htmlFor="squarePrice" className="text-zinc-200">
          Price Per Square <span className="text-orange-500">*</span>
        </Label>
        <div className="relative">
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400">$</span>
          <Input
            id="squarePrice"
            type="number"
            min="1"
            step="1"
            placeholder="10"
            {...register('squarePrice')}
            className={cn('pl-7', errors.squarePrice && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
          />
        </div>
        {errors.squarePrice && <p className="text-sm text-red-500">{errors.squarePrice.message}</p>}
        {totalPot > 0 && (
          <p className="text-xs text-zinc-500">
            Total pot if all squares sell: <span className="font-medium text-orange-400">${totalPot.toLocaleString()}</span>
          </p>
        )}
      </div>

      {/* Max Squares Per Person */}
      <div className="space-y-2">
        <Label htmlFor="maxSquaresPerPerson" className="text-zinc-200">
          Max Squares Per Person
        </Label>
        <Input
          id="maxSquaresPerPerson"
          type="number"
          min="1"
          max="100"
          placeholder="No limit"
          {...register('maxSquaresPerPerson')}
          className={cn(errors.maxSquaresPerPerson && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
        />
        {errors.maxSquaresPerPerson && <p className="text-sm text-red-500">{errors.maxSquaresPerPerson.message}</p>}
        <p className="text-xs text-zinc-500">Leave blank to allow unlimited squares per participant.</p>
      </div>

      {/* Payout Distribution */}
      <div className="space-y-4">
        <div>
          <Label className="text-zinc-200">Payout Distribution</Label>
          <p className="text-xs text-zinc-500">
            {isFootball
              ? 'How winnings are split between quarters. The rest goes to your fundraiser.'
              : 'How winnings are split between games. The rest goes to your fundraiser.'}
          </p>
          {!isFootball && (
            <p className="mt-1 text-xs text-amber-400">
              💡 If the series ends early, remaining game payouts go to the fundraiser.
            </p>
          )}
        </div>

        {/* Visual Progress Bar */}
        <div className="h-4 overflow-hidden rounded-full bg-zinc-800">
          <div className="flex h-full">
            {payoutFields.map((field, index) => {
              const value = Number(payoutValues[index]) || 0;
              return (
                <div
                  key={field.name}
                  className={cn('h-full transition-all duration-300', field.color)}
                  style={{ width: `${value}%` }}
                />
              );
            })}
          </div>
        </div>

        {/* Payout Inputs */}
        <div className={cn('grid gap-4', isFootball ? 'grid-cols-2 sm:grid-cols-4' : 'grid-cols-2 sm:grid-cols-4 lg:grid-cols-7')}>
          {payoutFields.map((field) => (
            <div key={field.name} className="space-y-2">
              <Label htmlFor={field.name} className="text-zinc-200 text-xs">
                {field.label}
              </Label>
              <div className="relative">
                <Input
                  id={field.name}
                  type="number"
                  min="0"
                  max="100"
                  {...register(field.name)}
                  className={cn('pr-7', errors[field.name] && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400">%</span>
              </div>
            </div>
          ))}
        </div>

        {/* Total Indicator */}
        <div
          className={cn(
            'flex items-center justify-between rounded-lg border p-3',
            totalPayout <= 100 ? 'border-green-500/50 bg-green-500/10' : 'border-red-500/50 bg-red-500/10'
          )}
        >
          <span className={cn('text-sm', totalPayout <= 100 ? 'text-green-400' : 'text-red-400')}>
            Total Payouts: {totalPayout}%
          </span>
          {totalPayout <= 100 ? (
            <span className="text-xs text-green-400">✓ Valid ({100 - totalPayout}% to fundraiser)</span>
          ) : (
            <span className="text-xs text-red-400">{totalPayout - 100}% over limit</span>
          )}
        </div>

        {errors.payoutFinalPercent && <p className="text-sm text-red-500">{errors.payoutFinalPercent.message}</p>}
        {errors.payoutGame7Percent && <p className="text-sm text-red-500">{errors.payoutGame7Percent.message}</p>}
      </div>

      {/* Payout Breakdown */}
      {totalPot > 0 && totalPayout <= 100 && (
        <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <p className="mb-4 text-sm font-medium text-zinc-200">Payout Breakdown</p>

          {/* Total Pot */}
          <div className="mb-4 flex items-center justify-between border-b border-zinc-700 pb-3">
            <span className="text-sm text-zinc-400">Total Pot (100 squares × ${Number(squarePrice).toLocaleString()})</span>
            <span className="text-lg font-semibold text-white">${totalPot.toLocaleString()}</span>
          </div>

          {/* Payouts by quarter/game */}
          <div className="space-y-2">
            {payoutFields.map((field, index) => {
              const percent = Number(payoutValues[index]) || 0;
              const amount = (totalPot * percent) / 100;
              return (
                <div key={field.name} className="flex items-center justify-between">
                  <span className="text-sm text-zinc-400">
                    {field.label}: {percent}%
                  </span>
                  <span className="font-medium text-orange-400">${amount.toLocaleString()}</span>
                </div>
              );
            })}
          </div>

          {/* Total Payouts */}
          <div className="mt-3 flex items-center justify-between border-t border-zinc-700 pt-3">
            <span className="text-sm text-zinc-400">Total Payouts ({totalPayout}%)</span>
            <span className="font-medium text-orange-400">${((totalPot * totalPayout) / 100).toLocaleString()}</span>
          </div>

          {/* Fundraiser Keeps */}
          <div className="mt-2 flex items-center justify-between rounded-lg bg-green-500/10 p-3">
            <span className="text-sm font-medium text-green-400">🎉 Fundraiser Keeps ({100 - totalPayout}%)</span>
            <span className="text-lg font-bold text-green-400">
              ${((totalPot * (100 - totalPayout)) / 100).toLocaleString()}
            </span>
          </div>
        </div>
      )}

      {/* Access Control */}
      <div className="space-y-4">
        <div>
          <Label className="text-zinc-200">Access Control</Label>
          <p className="text-xs text-zinc-500">Restrict who can view your contest.</p>
        </div>

        {/* Require PIN Toggle */}
        <div className="flex items-center justify-between rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
          <div className="space-y-1">
            <Label htmlFor="requirePin" className="text-zinc-200 cursor-pointer">
              Require PIN to access
            </Label>
            <p className="text-xs text-zinc-500">When enabled, participants must enter a PIN to view your contest</p>
          </div>
          <Switch id="requirePin" checked={requirePin ?? false} onCheckedChange={handleRequirePinChange} />
        </div>

        {/* PIN Input (shown when toggle is ON) */}
        {requirePin && (
          <div className="space-y-2 animate-in fade-in slide-in-from-top-2 duration-200">
            <Label htmlFor="accessPin" className="text-zinc-200">
              Access PIN
            </Label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Input
                  id="accessPin"
                  type={showPin ? 'text' : 'password'}
                  maxLength={6}
                  placeholder="XXXXXX"
                  {...register('accessPin')}
                  className={cn(
                    'pr-10 font-mono tracking-widest uppercase',
                    errors.accessPin && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                  )}
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-zinc-200 transition-colors"
                >
                  {showPin ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={handleGeneratePin}
                title="Generate new PIN"
                className="shrink-0"
              >
                <RefreshCw className="h-4 w-4" />
              </Button>
            </div>
            {errors.accessPin && <p className="text-sm text-red-500">{errors.accessPin.message}</p>}
            <p className="text-xs text-zinc-500">6 characters max, letters and numbers only.</p>
          </div>
        )}
      </div>
    </div>
  );
}
