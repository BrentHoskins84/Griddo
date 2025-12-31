'use client';

import { useFormContext, useWatch } from 'react-hook-form';
import { IoAmericanFootball, IoBaseball, IoTicket } from 'react-icons/io5';

import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { CreateContestInput, SportType } from '@/features/contests/models/contest';
import { cn } from '@/utils/cn';

const SPORT_OPTIONS: {
  value: SportType | 'raffle';
  label: string;
  icon: typeof IoAmericanFootball;
  placeholder: { row: string; col: string };
  comingSoon?: boolean;
}[] = [
  {
    value: 'football',
    label: 'Football',
    icon: IoAmericanFootball,
    placeholder: { row: 'Kansas City Chiefs', col: 'San Francisco 49ers' },
  },
  {
    value: 'baseball',
    label: 'Baseball',
    icon: IoBaseball,
    placeholder: { row: 'New York Yankees', col: 'Los Angeles Dodgers' },
    comingSoon: true,
  },
  {
    value: 'raffle',
    label: 'Raffle Fundraiser',
    icon: IoTicket,
    placeholder: { row: 'Team 1', col: 'Team 2' },
    comingSoon: true,
  },
];

const SPORT_DESCRIPTIONS: Record<SportType, string> = {
  football:
    "Your 10×10 grid will have the row team's last digit of their score on the left axis, and the column team's on the top. Winners are determined by matching the last digit of each team's score at the end of each quarter.",
  baseball:
    "Your 10×10 grid will have the row team's last digit of their score on the left axis, and the column team's on the top. Winners are determined by matching the last digit of each team's score at the end of each game in the series.",
};

export function BasicInfoStep() {
  const {
    register,
    formState: { errors },
    control,
    setValue,
  } = useFormContext<CreateContestInput>();

  const sportType = useWatch({ control, name: 'sportType' }) || 'football';
  const currentSport = SPORT_OPTIONS.find((s) => s.value === sportType) || SPORT_OPTIONS[0];

  return (
    <div className="space-y-6">
      {/* Sport Type Selector */}
      <div className="space-y-3">
        <Label className="text-zinc-200">
          Sport Type <span className="text-orange-500">*</span>
        </Label>
        <div className="grid grid-cols-3 gap-3">
          {SPORT_OPTIONS.map((sport) => {
            const isSelected = sportType === sport.value;
            const Icon = sport.icon;
            const isDisabled = sport.comingSoon;
            return (
              <button
                key={sport.value}
                type="button"
                onClick={() => {
                  if (!isDisabled && sport.value !== 'raffle') {
                    setValue('sportType', sport.value as SportType, { shouldValidate: true });
                  }
                }}
                disabled={isDisabled}
                className={cn(
                  'relative rounded-lg border-2 p-4 py-6 transition-all',
                  isDisabled && 'cursor-not-allowed opacity-60',
                  isSelected
                    ? 'border-orange-500 bg-orange-500/10 text-white'
                    : 'border-zinc-700 bg-zinc-800/50 text-zinc-400',
                  !isDisabled && !isSelected && 'hover:border-zinc-600 hover:text-zinc-200'
                )}
              >
                {isDisabled && (
                  <Badge variant="coming_soon" className="absolute right-2 top-2 text-[10px]">
                    Coming Soon
                  </Badge>
                )}
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      'flex h-10 w-10 items-center justify-center rounded-full',
                      isSelected ? 'bg-orange-500' : 'bg-zinc-700'
                    )}
                  >
                    <Icon className="h-5 w-5 text-white" />
                  </div>
                  <span className="text-sm font-medium">{sport.label}</span>
                </div>
              </button>
            );
          })}
        </div>
        {/* Hidden input for form registration */}
        <input type="hidden" {...register('sportType')} />
      </div>

      {/* Contest Name */}
      <div className="space-y-2">
        <Label htmlFor="name" className="text-zinc-200">
          Contest Name <span className="text-orange-500">*</span>
        </Label>
        <Input
          id="name"
          placeholder={sportType === 'football' ? 'Super Bowl Squares 2025' : 'World Series Squares 2025'}
          {...register('name')}
          className={cn(errors.name && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
        />
        {errors.name && <p className="text-sm text-red-500">{errors.name.message}</p>}
        <p className="text-xs text-zinc-500">This is what participants will see when they join your contest.</p>
      </div>

      {/* Description */}
      <div className="space-y-2">
        <Label htmlFor="description" className="text-zinc-200">
          Description
        </Label>
        <Textarea
          id="description"
          placeholder="Fundraiser for our youth sports league. All proceeds go to new equipment!"
          {...register('description')}
          className={cn(errors.description && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
        />
        {errors.description && <p className="text-sm text-red-500">{errors.description.message}</p>}
        <p className="text-xs text-zinc-500">Optional. Add context about your fundraiser or organization.</p>
      </div>

      {/* Team Names */}
      <div className="space-y-4">
        <div>
          <h3 className="text-sm font-medium text-zinc-200">Team Names</h3>
          <p className="text-xs text-zinc-500">
            Enter the teams playing in your game. Row team scores will be matched against the row axis.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {/* Row Team */}
          <div className="space-y-2">
            <Label htmlFor="rowTeamName" className="text-zinc-200">
              Row Team (Home) <span className="text-orange-500">*</span>
            </Label>
            <Input
              id="rowTeamName"
              placeholder={currentSport.placeholder.row}
              {...register('rowTeamName')}
              className={cn(errors.rowTeamName && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
            />
            {errors.rowTeamName && <p className="text-sm text-red-500">{errors.rowTeamName.message}</p>}
          </div>

          {/* Column Team */}
          <div className="space-y-2">
            <Label htmlFor="colTeamName" className="text-zinc-200">
              Column Team (Away) <span className="text-orange-500">*</span>
            </Label>
            <Input
              id="colTeamName"
              placeholder={currentSport.placeholder.col}
              {...register('colTeamName')}
              className={cn(errors.colTeamName && 'border-red-500 focus:border-red-500 focus:ring-red-500')}
            />
            {errors.colTeamName && <p className="text-sm text-red-500">{errors.colTeamName.message}</p>}
          </div>
        </div>
      </div>

      {/* Grid Preview Hint */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20">
            {sportType === 'football' ? (
              <IoAmericanFootball className="h-4 w-4 text-orange-400" />
            ) : (
              <IoBaseball className="h-4 w-4 text-orange-400" />
            )}
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">How it works</p>
            <p className="mt-1 text-xs text-zinc-400">{SPORT_DESCRIPTIONS[sportType as SportType]}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
