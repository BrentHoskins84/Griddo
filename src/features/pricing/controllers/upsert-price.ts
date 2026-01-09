import Stripe from 'stripe';

import { stripeAdmin } from '@/libs/stripe/stripe-admin';
import { supabaseAdminClient } from '@/libs/supabase/supabase-admin';
import type { Database } from '@/libs/supabase/types';
import { logger } from '@/utils/logger';

import { upsertProduct } from './upsert-product';

type Price = Database['public']['Tables']['prices']['Row'];

export async function upsertPrice(price: Stripe.Price) {
   // Ensure the product exists before inserting the price
  // This handles race conditions where price.created arrives before product.created
  const productId = typeof price.product === 'string' ? price.product : price.product.id;

  if (productId) {
    const { data: existingProduct } = await supabaseAdminClient
      .from('products')
      .select('id')
      .eq('id', productId)
      .single();

    if (!existingProduct) {
      try {
        const product = await stripeAdmin.products.retrieve(productId);
        await upsertProduct(product);
      } catch (err) {
        // Product doesn't exist in Stripe either - log and skip
        // This can happen if product was deleted
        const error = `Product ${productId} not found in Stripe, skipping price ${price.id}`;
        logger.warn('upsertPrice', error, { productId, priceId: price.id });
        return;
      }
    }
  }
  
  const priceData: Price = {
    id: price.id,
    product_id: typeof price.product === 'string' ? price.product : '',
    active: price.active,
    currency: price.currency,
    description: price.nickname ?? null,
    type: price.type,
    unit_amount: price.unit_amount ?? null,
    interval: price.recurring?.interval ?? null,
    interval_count: price.recurring?.interval_count ?? null,
    trial_period_days: price.recurring?.trial_period_days ?? null,
    metadata: price.metadata,
  };

  const { error } = await supabaseAdminClient.from('prices').upsert([priceData]);

  if (error) {
    throw error;
  }
}
