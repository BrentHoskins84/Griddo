import { z } from 'zod';

export const playerSchema = z.object({
  name: z.string().min(1).max(100),
  number: z.number().int().positive().optional(),
  slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/),
});

export type Player = z.infer<typeof playerSchema>;
