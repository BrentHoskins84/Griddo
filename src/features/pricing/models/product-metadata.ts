import z from 'zod';

export const priceCardVariantSchema = z.enum(['basic', 'pro', 'enterprise']);

export const productMetadataSchema = z
  .object({
    price_card_variant: priceCardVariantSchema,
    active_contests: z.string(),
    customization: z.enum(['basic', 'advanced', 'white-label']),
    support: z.enum(['email', 'live', 'dedicated']),
  })
  .transform((data) => ({
    priceCardVariant: data.price_card_variant,
    activeContests: data.active_contests,
    customization: data.customization,
    support: data.support,
  }));

export type ProductMetadata = z.infer<typeof productMetadataSchema>;
export type PriceCardVariant = z.infer<typeof priceCardVariantSchema>;
