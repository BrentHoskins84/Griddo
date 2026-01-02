import { z } from 'zod';

export const claimSquareSchema = z.object({
  firstName: z
    .string()
    .min(1, { message: 'First name is required' })
    .max(50, { message: 'First name is too long' }),
  lastName: z
    .string()
    .min(1, { message: 'Last name is required' })
    .max(50, { message: 'Last name is too long' }),
  email: z.email({ message: 'Please enter a valid email' }),
  venmoHandle: z.string().max(32, { message: 'Handle is too long' }).optional(),
});

export type ClaimSquareFormData = z.infer<typeof claimSquareSchema>;

