'use client';

import { useFormContext, useWatch } from 'react-hook-form';

import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { CreateContestInput } from '@/features/contests/models/contest';
import { cn } from '@/utils/cn';

const PRESET_COLORS = [
  { name: 'Orange', primary: '#F97316', secondary: '#D97706' },
  { name: 'Blue', primary: '#3B82F6', secondary: '#1D4ED8' },
  { name: 'Green', primary: '#22C55E', secondary: '#16A34A' },
  { name: 'Purple', primary: '#A855F7', secondary: '#7C3AED' },
  { name: 'Red', primary: '#EF4444', secondary: '#DC2626' },
  { name: 'Teal', primary: '#14B8A6', secondary: '#0D9488' },
];

export function BrandingStep() {
  const {
    register,
    formState: { errors },
    control,
    setValue,
  } = useFormContext<CreateContestInput>();

  const [primaryColor, secondaryColor] = useWatch({
    control,
    name: ['primaryColor', 'secondaryColor'],
  });

  function selectPreset(primary: string, secondary: string) {
    setValue('primaryColor', primary, { shouldValidate: true });
    setValue('secondaryColor', secondary, { shouldValidate: true });
  }

  return (
    <div className="space-y-8">
      {/* Color Theme */}
      <div className="space-y-4">
        <div>
          <Label className="text-zinc-200">Color Theme</Label>
          <p className="text-xs text-zinc-500">
            Choose colors that match your organization or event.
          </p>
        </div>

        {/* Preset Colors */}
        <div className="flex flex-wrap gap-2">
          {PRESET_COLORS.map((preset) => (
            <button
              key={preset.name}
              type="button"
              onClick={() => selectPreset(preset.primary, preset.secondary)}
              className={cn(
                'flex items-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all',
                primaryColor === preset.primary
                  ? 'border-orange-500 bg-zinc-800'
                  : 'border-zinc-700 bg-zinc-900 hover:border-zinc-600'
              )}
            >
              <div
                className="h-4 w-4 rounded-full"
                style={{ background: `linear-gradient(135deg, ${preset.primary}, ${preset.secondary})` }}
              />
              <span className="text-zinc-300">{preset.name}</span>
            </button>
          ))}
        </div>

        {/* Custom Color Pickers */}
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="primaryColor" className="text-zinc-200">
              Primary Color
            </Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={primaryColor || '#F97316'}
                onChange={(e) => setValue('primaryColor', e.target.value, { shouldValidate: true })}
                className="h-10 w-12 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
              />
              <Input
                id="primaryColor"
                placeholder="#F97316"
                {...register('primaryColor')}
                className={cn(
                  'flex-1 font-mono uppercase',
                  errors.primaryColor && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors.primaryColor && (
              <p className="text-sm text-red-500">{errors.primaryColor.message}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="secondaryColor" className="text-zinc-200">
              Secondary Color
            </Label>
            <div className="flex gap-2">
              <input
                type="color"
                value={secondaryColor || '#D97706'}
                onChange={(e) => setValue('secondaryColor', e.target.value, { shouldValidate: true })}
                className="h-10 w-12 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 p-1"
              />
              <Input
                id="secondaryColor"
                placeholder="#D97706"
                {...register('secondaryColor')}
                className={cn(
                  'flex-1 font-mono uppercase',
                  errors.secondaryColor && 'border-red-500 focus:border-red-500 focus:ring-red-500'
                )}
              />
            </div>
            {errors.secondaryColor && (
              <p className="text-sm text-red-500">{errors.secondaryColor.message}</p>
            )}
          </div>
        </div>

        {/* Color Preview */}
        <div
          className="h-24 rounded-lg"
          style={{
            background: `linear-gradient(135deg, ${primaryColor || '#F97316'}, ${secondaryColor || '#D97706'})`,
          }}
        >
          <div className="flex h-full items-center justify-center">
            <span className="rounded-lg bg-black/30 px-4 py-2 text-lg font-semibold text-white backdrop-blur-sm">
              Preview
            </span>
          </div>
        </div>
      </div>

      {/* Contest Images Notice */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20">
            <span className="text-lg">🖼️</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">Contest Images</p>
            <p className="mt-1 text-xs text-zinc-400">
              You can upload a hero banner image and organization logo after creating your contest.
              Simply go to your contest settings and use the image upload feature in the branding section.
            </p>
          </div>
        </div>
      </div>

      {/* Info Note */}
      <div className="rounded-lg border border-zinc-700 bg-zinc-800/50 p-4">
        <div className="flex items-start gap-3">
          <div className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-orange-500/20">
            <span className="text-lg">💡</span>
          </div>
          <div>
            <p className="text-sm font-medium text-zinc-200">Don&apos;t worry!</p>
            <p className="mt-1 text-xs text-zinc-400">
              You can always update your contest branding later from the contest settings page.
              Your contest will be created as a draft, so you can finalize everything before going live.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

