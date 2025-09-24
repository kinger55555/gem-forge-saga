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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      admin_links: {
        Row: {
          code: string
          created_at: string
          id: string
          name: string
          type: string
          used: boolean
          used_at: string | null
          used_by: string | null
          value: number | null
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          name: string
          type: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
          value?: number | null
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          name?: string
          type?: string
          used?: boolean
          used_at?: string | null
          used_by?: string | null
          value?: number | null
        }
        Relationships: []
      }
      crystal_transfers: {
        Row: {
          claimed: boolean
          claimed_at: string | null
          created_at: string
          crystal_id: string
          from_user_id: string
          id: string
          to_user_id: string | null
          transfer_code: string
        }
        Insert: {
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          crystal_id: string
          from_user_id: string
          id?: string
          to_user_id?: string | null
          transfer_code: string
        }
        Update: {
          claimed?: boolean
          claimed_at?: string | null
          created_at?: string
          crystal_id?: string
          from_user_id?: string
          id?: string
          to_user_id?: string | null
          transfer_code?: string
        }
        Relationships: [
          {
            foreignKeyName: "crystal_transfers_crystal_id_fkey"
            columns: ["crystal_id"]
            isOneToOne: false
            referencedRelation: "crystals"
            referencedColumns: ["id"]
          },
        ]
      }
      crystals: {
        Row: {
          blue: number
          color: string
          created_at: string
          green: number
          id: string
          price: number
          rarity: number
          red: number
          user_id: string
        }
        Insert: {
          blue: number
          color: string
          created_at?: string
          green: number
          id?: string
          price: number
          rarity: number
          red: number
          user_id: string
        }
        Update: {
          blue?: number
          color?: string
          created_at?: string
          green?: number
          id?: string
          price?: number
          rarity?: number
          red?: number
          user_id?: string
        }
        Relationships: []
      }
      daily_rewards: {
        Row: {
          claimed: boolean
          created_at: string
          id: string
          reward_date: string
          reward_type: string
          user_id: string
        }
        Insert: {
          claimed?: boolean
          created_at?: string
          id?: string
          reward_date?: string
          reward_type?: string
          user_id: string
        }
        Update: {
          claimed?: boolean
          created_at?: string
          id?: string
          reward_date?: string
          reward_type?: string
          user_id?: string
        }
        Relationships: []
      }
      game_state: {
        Row: {
          clicker_earnings: number
          coins: number
          created_at: string
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          clicker_earnings?: number
          coins?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          clicker_earnings?: number
          coins?: number
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      pickaxes: {
        Row: {
          created_at: string
          id: string
          name: string
          type: string
          used: boolean
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name: string
          type: string
          used?: boolean
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string
          type?: string
          used?: boolean
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string | null
        }
        Relationships: []
      }
      special_codes: {
        Row: {
          code: string
          created_at: string
          id: string
          used_date: string
          user_id: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          used_date?: string
          user_id: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          used_date?: string
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
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
    Enums: {},
  },
} as const
