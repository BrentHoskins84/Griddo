import { Database } from '@/libs/supabase/types';

export * from './contest-with-prizes';
export * from './player';

export type Contest = Database['public']['Tables']['contests']['Row'];
export type ContestInsert = Database['public']['Tables']['contests']['Insert'];
export type ContestUpdate = Database['public']['Tables']['contests']['Update'];

export type Square = Database['public']['Tables']['squares']['Row'];
export type SquareUpdate = Database['public']['Tables']['squares']['Update'];

export type PaymentOption = Database['public']['Tables']['payment_options']['Row'];
export type PaymentStatus = Database['public']['Enums']['payment_status'];
export type PaymentOptionType = Database['public']['Enums']['payment_option_type'];

export type Score = Database['public']['Tables']['scores']['Row'];
export type GameQuarter = Database['public']['Enums']['game_quarter'];

