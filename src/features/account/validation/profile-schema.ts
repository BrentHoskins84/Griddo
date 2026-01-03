import { z } from 'zod';

export const updateProfileSchema = z.object({
  fullName: z
    .string()
    .min(2, { message: 'Full name must be at least 2 characters' })
    .max(100, { message: 'Full name must be 100 characters or less' }),
});

export type UpdateProfileFormData = z.infer<typeof updateProfileSchema>;

