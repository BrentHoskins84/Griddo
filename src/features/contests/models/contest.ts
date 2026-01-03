import { z } from 'zod';

// Sport type enum
export const sportTypes = ['football', 'baseball'] as const;
export type SportType = (typeof sportTypes)[number];

// Schema for Step 1 - Basic Info
export const basicInfoSchema = z.object({
  sportType: z.enum(sportTypes),
  name: z
    .string()
    .min(3, 'Contest name must be at least 3 characters')
    .max(100, 'Contest name must be less than 100 characters'),
  description: z.string().max(500, 'Description must be less than 500 characters').optional(),
  rowTeamName: z.string().min(1, 'Row team name is required').max(50, 'Team name must be less than 50 characters'),
  colTeamName: z.string().min(1, 'Column team name is required').max(50, 'Team name must be less than 50 characters'),
});

// Base settings schema (without refine, for merging)
export const settingsBaseSchema = z.object({
  squarePrice: z.coerce.number().min(1, 'Price must be at least $1').max(10000, 'Price must be less than $10,000'),
  maxSquaresPerPerson: z
    .union([z.literal(''), z.coerce.number().min(1, 'Must be at least 1').max(100, 'Cannot exceed 100 squares')])
    .transform((val) => (val === '' || val === 0 ? null : val))
    .nullable(),
  // Football payouts
  payoutQ1Percent: z.coerce.number().min(0).max(100),
  payoutQ2Percent: z.coerce.number().min(0).max(100),
  payoutQ3Percent: z.coerce.number().min(0).max(100),
  payoutFinalPercent: z.coerce.number().min(0).max(100),
  // Baseball payouts
  payoutGame1Percent: z.coerce.number().min(0).max(100),
  payoutGame2Percent: z.coerce.number().min(0).max(100),
  payoutGame3Percent: z.coerce.number().min(0).max(100),
  payoutGame4Percent: z.coerce.number().min(0).max(100),
  payoutGame5Percent: z.coerce.number().min(0).max(100),
  payoutGame6Percent: z.coerce.number().min(0).max(100),
  payoutGame7Percent: z.coerce.number().min(0).max(100),
  // Access control
  requirePin: z.boolean().default(false),
  accessPin: z
    .string()
    .max(6, 'PIN must be 6 characters or less')
    .regex(/^[A-Za-z0-9]*$/, 'PIN must be alphanumeric')
    .optional(),
  // Prize settings
  prizeType: z.enum(['percentage', 'custom']).default('percentage'),
  prizeQ1Text: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
  prizeQ2Text: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
  prizeQ3Text: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
  prizeFinalText: z.string().max(25, 'Prize text must be 25 characters or less').optional(),
});

// Settings schema with validation (for step validation)
// Note: Sport-specific validation is handled in the UI since we need sportType from basicInfoSchema
export const settingsSchema = settingsBaseSchema;

// Schema for Step 3 - Branding
export const brandingSchema = z.object({
  heroImageUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  orgImageUrl: z.string().url('Must be a valid URL').optional().nullable().or(z.literal('')),
  primaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
  secondaryColor: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Must be a valid hex color'),
});

// Helper to calculate total payout based on sport type
export function calculateTotalPayout(data: { sportType: SportType } & Record<string, unknown>): number {
  if (data.sportType === 'football') {
    return (
      (Number(data.payoutQ1Percent) || 0) +
      (Number(data.payoutQ2Percent) || 0) +
      (Number(data.payoutQ3Percent) || 0) +
      (Number(data.payoutFinalPercent) || 0)
    );
  } else {
    return (
      (Number(data.payoutGame1Percent) || 0) +
      (Number(data.payoutGame2Percent) || 0) +
      (Number(data.payoutGame3Percent) || 0) +
      (Number(data.payoutGame4Percent) || 0) +
      (Number(data.payoutGame5Percent) || 0) +
      (Number(data.payoutGame6Percent) || 0) +
      (Number(data.payoutGame7Percent) || 0)
    );
  }
}

// Combined schema for full contest creation (with payout validation)
export const createContestSchema = basicInfoSchema
  .merge(settingsBaseSchema)
  .merge(brandingSchema)
  .refine((data) => calculateTotalPayout(data) <= 100, {
    message: 'Total payout cannot exceed 100%',
    path: ['payoutFinalPercent'],
  })
  .refine(
    (data) => {
      if (data.prizeType === 'custom') {
        return !!(data.prizeQ1Text || data.prizeQ2Text || data.prizeQ3Text || data.prizeFinalText);
      }
      return true;
    },
    {
      message: 'At least one prize text field is required when using custom prizes',
      path: ['prizeQ1Text'],
    }
  );

// Type exports
export type BasicInfoInput = z.infer<typeof basicInfoSchema>;
export type SettingsInput = z.infer<typeof settingsSchema>;
export type BrandingInput = z.infer<typeof brandingSchema>;
export type CreateContestInput = z.infer<typeof createContestSchema>;

// Default values for the form
export const defaultContestValues: CreateContestInput = {
  sportType: 'football',
  name: '',
  description: '',
  rowTeamName: '',
  colTeamName: '',
  squarePrice: 10,
  maxSquaresPerPerson: null,
  // Football defaults
  payoutQ1Percent: 10,
  payoutQ2Percent: 10,
  payoutQ3Percent: 10,
  payoutFinalPercent: 20,
  // Baseball defaults
  payoutGame1Percent: 10,
  payoutGame2Percent: 10,
  payoutGame3Percent: 10,
  payoutGame4Percent: 10,
  payoutGame5Percent: 15,
  payoutGame6Percent: 15,
  payoutGame7Percent: 30,
  // Access control
  requirePin: false,
  accessPin: undefined,
  // Prize settings
  prizeType: 'percentage',
  prizeQ1Text: undefined,
  prizeQ2Text: undefined,
  prizeQ3Text: undefined,
  prizeFinalText: undefined,
  heroImageUrl: null,
  orgImageUrl: null,
  primaryColor: '#F97316',
  secondaryColor: '#D97706',
};
