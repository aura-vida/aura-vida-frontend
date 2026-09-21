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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          aftercare_notes: string | null
          aftercare_updated_at: string | null
          amount: number | null
          attendees: string[]
          client_id: string
          client_name: string | null
          created_at: string
          currency: string
          group_size: number
          id: string
          item_id: string
          mode: string
          pin: string | null
          practitioner_name: string
          practitioner_slug: string
          razorpay_order_id: string | null
          scheduled_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          aftercare_notes?: string | null
          aftercare_updated_at?: string | null
          amount?: number | null
          attendees?: string[]
          client_id: string
          client_name?: string | null
          created_at?: string
          currency?: string
          group_size?: number
          id?: string
          item_id: string
          mode?: string
          pin?: string | null
          practitioner_name: string
          practitioner_slug: string
          razorpay_order_id?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          aftercare_notes?: string | null
          aftercare_updated_at?: string | null
          amount?: number | null
          attendees?: string[]
          client_id?: string
          client_name?: string | null
          created_at?: string
          currency?: string
          group_size?: number
          id?: string
          item_id?: string
          mode?: string
          pin?: string | null
          practitioner_name?: string
          practitioner_slug?: string
          razorpay_order_id?: string | null
          scheduled_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      centres: {
        Row: {
          area: string
          capacity: number
          created_at: string
          id: string
          is_active: boolean
          name: string
          pin: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          area?: string
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pin?: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          area?: string
          capacity?: number
          created_at?: string
          id?: string
          is_active?: boolean
          name?: string
          pin?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string
          currency: string
          customer_email: string | null
          customer_name: string | null
          customer_phone: string | null
          details: Json
          id: string
          item_id: string
          item_name: string
          item_type: string
          paid_at: string | null
          razorpay_order_id: string
          razorpay_payment_id: string | null
          status: string
        }
        Insert: {
          amount: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          details?: Json
          id?: string
          item_id: string
          item_name: string
          item_type: string
          paid_at?: string | null
          razorpay_order_id: string
          razorpay_payment_id?: string | null
          status?: string
        }
        Update: {
          amount?: number
          created_at?: string
          currency?: string
          customer_email?: string | null
          customer_name?: string | null
          customer_phone?: string | null
          details?: Json
          id?: string
          item_id?: string
          item_name?: string
          item_type?: string
          paid_at?: string | null
          razorpay_order_id?: string
          razorpay_payment_id?: string | null
          status?: string
        }
        Relationships: []
      }
      practitioners: {
        Row: {
          bio: string | null
          bookable: boolean
          city: string
          craft: string
          created_at: string
          id: string
          image_url: string | null
          is_published: boolean
          name: string
          price_inr: number
          rating: number
          sessions: number
          slug: string
          sort_order: number
          updated_at: string
        }
        Insert: {
          bio?: string | null
          bookable?: boolean
          city?: string
          craft?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name: string
          price_inr?: number
          rating?: number
          sessions?: number
          slug: string
          sort_order?: number
          updated_at?: string
        }
        Update: {
          bio?: string | null
          bookable?: boolean
          city?: string
          craft?: string
          created_at?: string
          id?: string
          image_url?: string | null
          is_published?: boolean
          name?: string
          price_inr?: number
          rating?: number
          sessions?: number
          slug?: string
          sort_order?: number
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          credit_inr: number
          full_name: string | null
          id: string
          phone: string | null
          practitioner_slug: string | null
          referral_code: string | null
          referred_by: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          credit_inr?: number
          full_name?: string | null
          id: string
          phone?: string | null
          practitioner_slug?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          credit_inr?: number
          full_name?: string | null
          id?: string
          phone?: string | null
          practitioner_slug?: string | null
          referral_code?: string | null
          referred_by?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      referrals: {
        Row: {
          created_at: string
          credited_at: string | null
          id: string
          referred_user_id: string
          referrer_id: string
          reward_inr: number
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          credited_at?: string | null
          id?: string
          referred_user_id: string
          referrer_id: string
          reward_inr?: number
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          credited_at?: string | null
          id?: string
          referred_user_id?: string
          referrer_id?: string
          reward_inr?: number
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      my_practitioner_slug: { Args: never; Returns: string }
    }
    Enums: {
      app_role: "admin" | "practitioner" | "client"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["admin", "practitioner", "client"],
    },
  },
} as const
