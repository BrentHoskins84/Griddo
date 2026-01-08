export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      contests: {
        Row: {
          access_pin: string | null
          code: string
          col_numbers: number[] | null
          col_team_name: string
          created_at: string
          deleted_at: string | null
          description: string | null
          enable_player_tracking: boolean
          hero_image_position: string
          hero_image_url: string | null
          id: string
          is_public: boolean
          max_squares_per_person: number | null
          name: string
          numbers_auto_generated: boolean | null
          org_image_url: string | null
          owner_id: string
          payout_final_percent: number | null
          payout_game1_percent: number | null
          payout_game2_percent: number | null
          payout_game3_percent: number | null
          payout_game4_percent: number | null
          payout_game5_percent: number | null
          payout_game6_percent: number | null
          payout_game7_percent: number | null
          payout_q1_percent: number | null
          payout_q2_percent: number | null
          payout_q3_percent: number | null
          players: Json
          primary_color: string | null
          prize_final_text: string | null
          prize_q1_text: string | null
          prize_q2_text: string | null
          prize_q3_text: string | null
          prize_type: Database["public"]["Enums"]["prize_type"]
          row_numbers: number[] | null
          row_team_name: string
          secondary_color: string | null
          slug: string
          sport_type: Database["public"]["Enums"]["sport_type"]
          square_price: number
          status: Database["public"]["Enums"]["contest_status"]
          updated_at: string
        }
        Insert: {
          access_pin?: string | null
          code: string
          col_numbers?: number[] | null
          col_team_name: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          enable_player_tracking?: boolean
          hero_image_position?: string
          hero_image_url?: string | null
          id?: string
          is_public?: boolean
          max_squares_per_person?: number | null
          name: string
          numbers_auto_generated?: boolean | null
          org_image_url?: string | null
          owner_id: string
          payout_final_percent?: number | null
          payout_game1_percent?: number | null
          payout_game2_percent?: number | null
          payout_game3_percent?: number | null
          payout_game4_percent?: number | null
          payout_game5_percent?: number | null
          payout_game6_percent?: number | null
          payout_game7_percent?: number | null
          payout_q1_percent?: number | null
          payout_q2_percent?: number | null
          payout_q3_percent?: number | null
          players?: Json
          primary_color?: string | null
          prize_final_text?: string | null
          prize_q1_text?: string | null
          prize_q2_text?: string | null
          prize_q3_text?: string | null
          prize_type?: Database["public"]["Enums"]["prize_type"]
          row_numbers?: number[] | null
          row_team_name: string
          secondary_color?: string | null
          slug: string
          sport_type?: Database["public"]["Enums"]["sport_type"]
          square_price: number
          status?: Database["public"]["Enums"]["contest_status"]
          updated_at?: string
        }
        Update: {
          access_pin?: string | null
          code?: string
          col_numbers?: number[] | null
          col_team_name?: string
          created_at?: string
          deleted_at?: string | null
          description?: string | null
          enable_player_tracking?: boolean
          hero_image_position?: string
          hero_image_url?: string | null
          id?: string
          is_public?: boolean
          max_squares_per_person?: number | null
          name?: string
          numbers_auto_generated?: boolean | null
          org_image_url?: string | null
          owner_id?: string
          payout_final_percent?: number | null
          payout_game1_percent?: number | null
          payout_game2_percent?: number | null
          payout_game3_percent?: number | null
          payout_game4_percent?: number | null
          payout_game5_percent?: number | null
          payout_game6_percent?: number | null
          payout_game7_percent?: number | null
          payout_q1_percent?: number | null
          payout_q2_percent?: number | null
          payout_q3_percent?: number | null
          players?: Json
          primary_color?: string | null
          prize_final_text?: string | null
          prize_q1_text?: string | null
          prize_q2_text?: string | null
          prize_q3_text?: string | null
          prize_type?: Database["public"]["Enums"]["prize_type"]
          row_numbers?: number[] | null
          row_team_name?: string
          secondary_color?: string | null
          slug?: string
          sport_type?: Database["public"]["Enums"]["sport_type"]
          square_price?: number
          status?: Database["public"]["Enums"]["contest_status"]
          updated_at?: string
        }
        Relationships: []
      }
      customers: {
        Row: {
          id: string
          stripe_customer_id: string | null
        }
        Insert: {
          id: string
          stripe_customer_id?: string | null
        }
        Update: {
          id?: string
          stripe_customer_id?: string | null
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          contest_id: string
          email_type: string
          id: string
          recipient_email: string
          resend_id: string | null
          sent_at: string
          square_id: string | null
          status: string | null
        }
        Insert: {
          contest_id: string
          email_type: string
          id?: string
          recipient_email: string
          resend_id?: string | null
          sent_at?: string
          square_id?: string | null
          status?: string | null
        }
        Update: {
          contest_id?: string
          email_type?: string
          id?: string
          recipient_email?: string
          resend_id?: string | null
          sent_at?: string
          square_id?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "email_logs_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "email_logs_square_id_fkey"
            columns: ["square_id"]
            isOneToOne: false
            referencedRelation: "squares"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_options: {
        Row: {
          account_last_4_digits: string | null
          contest_id: string
          created_at: string
          display_name: string | null
          handle_or_link: string
          id: string
          instructions: string | null
          qr_code_url: string | null
          sort_order: number | null
          type: Database["public"]["Enums"]["payment_option_type"]
        }
        Insert: {
          account_last_4_digits?: string | null
          contest_id: string
          created_at?: string
          display_name?: string | null
          handle_or_link: string
          id?: string
          instructions?: string | null
          qr_code_url?: string | null
          sort_order?: number | null
          type: Database["public"]["Enums"]["payment_option_type"]
        }
        Update: {
          account_last_4_digits?: string | null
          contest_id?: string
          created_at?: string
          display_name?: string | null
          handle_or_link?: string
          id?: string
          instructions?: string | null
          qr_code_url?: string | null
          sort_order?: number | null
          type?: Database["public"]["Enums"]["payment_option_type"]
        }
        Relationships: [
          {
            foreignKeyName: "payment_options_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      prices: {
        Row: {
          active: boolean | null
          currency: string | null
          description: string | null
          id: string
          interval: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count: number | null
          metadata: Json | null
          product_id: string | null
          trial_period_days: number | null
          type: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount: number | null
        }
        Insert: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Update: {
          active?: boolean | null
          currency?: string | null
          description?: string | null
          id?: string
          interval?: Database["public"]["Enums"]["pricing_plan_interval"] | null
          interval_count?: number | null
          metadata?: Json | null
          product_id?: string | null
          trial_period_days?: number | null
          type?: Database["public"]["Enums"]["pricing_type"] | null
          unit_amount?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "prices_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          active: boolean | null
          description: string | null
          id: string
          image: string | null
          metadata: Json | null
          name: string | null
        }
        Insert: {
          active?: boolean | null
          description?: string | null
          id: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Update: {
          active?: boolean | null
          description?: string | null
          id?: string
          image?: string | null
          metadata?: Json | null
          name?: string | null
        }
        Relationships: []
      }
      scores: {
        Row: {
          away_score: number
          contest_id: string
          entered_at: string
          home_score: number
          id: string
          quarter: Database["public"]["Enums"]["game_quarter"]
          winning_square_id: string | null
        }
        Insert: {
          away_score: number
          contest_id: string
          entered_at?: string
          home_score: number
          id?: string
          quarter: Database["public"]["Enums"]["game_quarter"]
          winning_square_id?: string | null
        }
        Update: {
          away_score?: number
          contest_id?: string
          entered_at?: string
          home_score?: number
          id?: string
          quarter?: Database["public"]["Enums"]["game_quarter"]
          winning_square_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "scores_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "scores_winning_square_id_fkey"
            columns: ["winning_square_id"]
            isOneToOne: false
            referencedRelation: "squares"
            referencedColumns: ["id"]
          },
        ]
      }
      squares: {
        Row: {
          claimant_email: string | null
          claimant_first_name: string | null
          claimant_last_name: string | null
          claimant_venmo: string | null
          claimed_at: string | null
          col_index: number
          contest_id: string
          id: string
          paid_at: string | null
          payment_status: Database["public"]["Enums"]["payment_status"]
          referred_by: string | null
          row_index: number
        }
        Insert: {
          claimant_email?: string | null
          claimant_first_name?: string | null
          claimant_last_name?: string | null
          claimant_venmo?: string | null
          claimed_at?: string | null
          col_index: number
          contest_id: string
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          referred_by?: string | null
          row_index: number
        }
        Update: {
          claimant_email?: string | null
          claimant_first_name?: string | null
          claimant_last_name?: string | null
          claimant_venmo?: string | null
          claimed_at?: string | null
          col_index?: number
          contest_id?: string
          id?: string
          paid_at?: string | null
          payment_status?: Database["public"]["Enums"]["payment_status"]
          referred_by?: string | null
          row_index?: number
        }
        Relationships: [
          {
            foreignKeyName: "squares_contest_id_fkey"
            columns: ["contest_id"]
            isOneToOne: false
            referencedRelation: "contests"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at: string | null
          cancel_at_period_end: boolean | null
          canceled_at: string | null
          created: string
          current_period_end: string
          current_period_start: string
          ended_at: string | null
          id: string
          metadata: Json | null
          price_id: string | null
          quantity: number | null
          status: Database["public"]["Enums"]["subscription_status"] | null
          trial_end: string | null
          trial_start: string | null
          user_id: string
        }
        Insert: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id: string
        }
        Update: {
          cancel_at?: string | null
          cancel_at_period_end?: boolean | null
          canceled_at?: string | null
          created?: string
          current_period_end?: string
          current_period_start?: string
          ended_at?: string | null
          id?: string
          metadata?: Json | null
          price_id?: string | null
          quantity?: number | null
          status?: Database["public"]["Enums"]["subscription_status"] | null
          trial_end?: string | null
          trial_start?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_price_id_fkey"
            columns: ["price_id"]
            isOneToOne: false
            referencedRelation: "prices"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          avatar_url: string | null
          billing_address: Json | null
          full_name: string | null
          id: string
          payment_method: Json | null
        }
        Insert: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id: string
          payment_method?: Json | null
        }
        Update: {
          avatar_url?: string | null
          billing_address?: Json | null
          full_name?: string | null
          id?: string
          payment_method?: Json | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      soft_delete_contest: { Args: { contest_id: string }; Returns: boolean }
    }
    Enums: {
      contest_status: "draft" | "open" | "locked" | "in_progress" | "completed"
      game_quarter: "q1" | "q2" | "q3" | "final"
      payment_option_type: "venmo" | "paypal" | "zelle" | "cashapp"
      payment_status: "available" | "pending" | "paid"
      pricing_plan_interval: "day" | "week" | "month" | "year"
      pricing_type: "one_time" | "recurring"
      prize_type: "percentage" | "custom"
      sport_type: "football" | "baseball"
      subscription_status:
        | "trialing"
        | "active"
        | "canceled"
        | "incomplete"
        | "incomplete_expired"
        | "past_due"
        | "unpaid"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      contest_status: ["draft", "open", "locked", "in_progress", "completed"],
      game_quarter: ["q1", "q2", "q3", "final"],
      payment_option_type: ["venmo", "paypal", "zelle", "cashapp"],
      payment_status: ["available", "pending", "paid"],
      pricing_plan_interval: ["day", "week", "month", "year"],
      pricing_type: ["one_time", "recurring"],
      prize_type: ["percentage", "custom"],
      sport_type: ["football", "baseball"],
      subscription_status: [
        "trialing",
        "active",
        "canceled",
        "incomplete",
        "incomplete_expired",
        "past_due",
        "unpaid",
        "paused",
      ],
    },
  },
} as const
