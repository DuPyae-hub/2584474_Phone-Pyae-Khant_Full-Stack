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
    PostgrestVersion: "13.0.5"
  }
  public: {
    Tables: {
      cart: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          quantity: number | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          quantity?: number | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          quantity?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "cart_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      challenges: {
        Row: {
          challenged_id: string
          challenger_id: string
          court_id: string | null
          created_at: string
          expires_at: string
          id: string
          message: string | null
          proposed_date: string
          proposed_time: string
          status: string
          updated_at: string
        }
        Insert: {
          challenged_id: string
          challenger_id: string
          court_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          proposed_date: string
          proposed_time: string
          status?: string
          updated_at?: string
        }
        Update: {
          challenged_id?: string
          challenger_id?: string
          court_id?: string | null
          created_at?: string
          expires_at?: string
          id?: string
          message?: string | null
          proposed_date?: string
          proposed_time?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenges_challenged_id_fkey"
            columns: ["challenged_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_challenger_id_fkey"
            columns: ["challenger_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "challenges_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      courts: {
        Row: {
          address: string
          contact: string | null
          court_name: string
          created_at: string | null
          created_by_admin: string | null
          google_map_url: string | null
          id: string
          images: string[] | null
          opening_hours: string | null
          price_rate: string | null
          rating: number | null
          updated_at: string | null
        }
        Insert: {
          address: string
          contact?: string | null
          court_name: string
          created_at?: string | null
          created_by_admin?: string | null
          google_map_url?: string | null
          id?: string
          images?: string[] | null
          opening_hours?: string | null
          price_rate?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Update: {
          address?: string
          contact?: string | null
          court_name?: string
          created_at?: string | null
          created_by_admin?: string | null
          google_map_url?: string | null
          id?: string
          images?: string[] | null
          opening_hours?: string | null
          price_rate?: string | null
          rating?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      direct_messages: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          receiver_id: string
          sender_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          receiver_id?: string
          sender_id?: string
        }
        Relationships: []
      }
      experience_rules: {
        Row: {
          friendly_points: number | null
          id: string
          lose_points: number
          mode: Database["public"]["Enums"]["match_mode"]
          win_points: number
        }
        Insert: {
          friendly_points?: number | null
          id?: string
          lose_points: number
          mode: Database["public"]["Enums"]["match_mode"]
          win_points: number
        }
        Update: {
          friendly_points?: number | null
          id?: string
          lose_points?: number
          mode?: Database["public"]["Enums"]["match_mode"]
          win_points?: number
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string | null
          id: string
          product_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          product_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          product_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string | null
          experience_awarded: number | null
          id: string
          mode: Database["public"]["Enums"]["match_mode"]
          player1: string
          player1_confirmed: boolean | null
          player2: string
          player2_confirmed: boolean | null
          request_id: string | null
          score_player1: number | null
          score_player2: number | null
          updated_at: string | null
          winner: string | null
        }
        Insert: {
          created_at?: string | null
          experience_awarded?: number | null
          id?: string
          mode: Database["public"]["Enums"]["match_mode"]
          player1: string
          player1_confirmed?: boolean | null
          player2: string
          player2_confirmed?: boolean | null
          request_id?: string | null
          score_player1?: number | null
          score_player2?: number | null
          updated_at?: string | null
          winner?: string | null
        }
        Update: {
          created_at?: string | null
          experience_awarded?: number | null
          id?: string
          mode?: Database["public"]["Enums"]["match_mode"]
          player1?: string
          player1_confirmed?: boolean | null
          player2?: string
          player2_confirmed?: boolean | null
          request_id?: string | null
          score_player1?: number | null
          score_player2?: number | null
          updated_at?: string | null
          winner?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "matches_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "partner_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          created_at: string
          id: string
          is_read: boolean
          message: string
          related_id: string | null
          title: string
          type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_read?: boolean
          message: string
          related_id?: string | null
          title: string
          type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          is_read?: boolean
          message?: string
          related_id?: string | null
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: []
      }
      order_items: {
        Row: {
          created_at: string | null
          id: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          order_id: string
          price: number
          product_id: string
          quantity: number
        }
        Update: {
          created_at?: string | null
          id?: string
          order_id?: string
          price?: number
          product_id?: string
          quantity?: number
        }
        Relationships: [
          {
            foreignKeyName: "order_items_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_items_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string | null
          delivery_address: string | null
          delivery_name: string | null
          delivery_phone: string | null
          id: string
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          total_amount: number
          transaction_id: string | null
          updated_at: string | null
          uploaded_screenshot: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          total_amount: number
          transaction_id?: string | null
          updated_at?: string | null
          uploaded_screenshot?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          delivery_address?: string | null
          delivery_name?: string | null
          delivery_phone?: string | null
          id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"] | null
          total_amount?: number
          transaction_id?: string | null
          updated_at?: string | null
          uploaded_screenshot?: string | null
          user_id?: string
        }
        Relationships: []
      }
      partner_request_participants: {
        Row: {
          created_at: string | null
          id: string
          request_id: string
          status: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          request_id: string
          status?: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          request_id?: string
          status?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "partner_request_participants_request_id_fkey"
            columns: ["request_id"]
            isOneToOne: false
            referencedRelation: "partner_requests"
            referencedColumns: ["id"]
          },
        ]
      }
      partner_requests: {
        Row: {
          court_id: string | null
          created_at: string | null
          created_by_user: string
          date: string
          id: string
          matched_user: string | null
          mode: Database["public"]["Enums"]["match_mode"]
          phone: string | null
          players_needed: number
          status: Database["public"]["Enums"]["request_status"] | null
          time: string
          updated_at: string | null
          wanted_level: Database["public"]["Enums"]["user_level"] | null
        }
        Insert: {
          court_id?: string | null
          created_at?: string | null
          created_by_user: string
          date: string
          id?: string
          matched_user?: string | null
          mode: Database["public"]["Enums"]["match_mode"]
          phone?: string | null
          players_needed?: number
          status?: Database["public"]["Enums"]["request_status"] | null
          time: string
          updated_at?: string | null
          wanted_level?: Database["public"]["Enums"]["user_level"] | null
        }
        Update: {
          court_id?: string | null
          created_at?: string | null
          created_by_user?: string
          date?: string
          id?: string
          matched_user?: string | null
          mode?: Database["public"]["Enums"]["match_mode"]
          phone?: string | null
          players_needed?: number
          status?: Database["public"]["Enums"]["request_status"] | null
          time?: string
          updated_at?: string | null
          wanted_level?: Database["public"]["Enums"]["user_level"] | null
        }
        Relationships: [
          {
            foreignKeyName: "partner_requests_court_id_fkey"
            columns: ["court_id"]
            isOneToOne: false
            referencedRelation: "courts"
            referencedColumns: ["id"]
          },
        ]
      }
      penalty_logs: {
        Row: {
          created_at: string | null
          exp_deducted_percent: number | null
          id: string
          match_id: string | null
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          exp_deducted_percent?: number | null
          id?: string
          match_id?: string | null
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          exp_deducted_percent?: number | null
          id?: string
          match_id?: string | null
          reason?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "penalty_logs_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      post_likes: {
        Row: {
          created_at: string | null
          id: string
          post_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          post_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          post_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_likes_post_id_fkey"
            columns: ["post_id"]
            isOneToOne: false
            referencedRelation: "posts"
            referencedColumns: ["id"]
          },
        ]
      }
      posts: {
        Row: {
          content: string
          created_at: string | null
          id: string
          likes_count: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          likes_count?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      products: {
        Row: {
          category_id: string | null
          created_at: string | null
          description: string | null
          id: string
          images: string[] | null
          level_recommendation: Database["public"]["Enums"]["user_level"] | null
          name: string
          price: number
          stock: number | null
          updated_at: string | null
        }
        Insert: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          level_recommendation?:
            | Database["public"]["Enums"]["user_level"]
            | null
          name: string
          price: number
          stock?: number | null
          updated_at?: string | null
        }
        Update: {
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          images?: string[] | null
          level_recommendation?:
            | Database["public"]["Enums"]["user_level"]
            | null
          name?: string
          price?: number
          stock?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "shop_categories"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          account_suspension_until: string | null
          created_at: string | null
          date_of_birth: string | null
          email: string
          experience_points: number | null
          gender: string | null
          id: string
          level: Database["public"]["Enums"]["user_level"] | null
          membership_status:
            | Database["public"]["Enums"]["membership_status"]
            | null
          monthly_fee_due: string | null
          name: string
          penalty_count: number | null
          phone: string | null
          profile_photo: string | null
          ranking_position: number | null
          total_losses: number | null
          total_matches_played: number | null
          total_wins: number | null
          trial_start_date: string | null
          updated_at: string | null
        }
        Insert: {
          account_suspension_until?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email: string
          experience_points?: number | null
          gender?: string | null
          id: string
          level?: Database["public"]["Enums"]["user_level"] | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          monthly_fee_due?: string | null
          name: string
          penalty_count?: number | null
          phone?: string | null
          profile_photo?: string | null
          ranking_position?: number | null
          total_losses?: number | null
          total_matches_played?: number | null
          total_wins?: number | null
          trial_start_date?: string | null
          updated_at?: string | null
        }
        Update: {
          account_suspension_until?: string | null
          created_at?: string | null
          date_of_birth?: string | null
          email?: string
          experience_points?: number | null
          gender?: string | null
          id?: string
          level?: Database["public"]["Enums"]["user_level"] | null
          membership_status?:
            | Database["public"]["Enums"]["membership_status"]
            | null
          monthly_fee_due?: string | null
          name?: string
          penalty_count?: number | null
          phone?: string | null
          profile_photo?: string | null
          ranking_position?: number | null
          total_losses?: number | null
          total_matches_played?: number | null
          total_wins?: number | null
          trial_start_date?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      shop_categories: {
        Row: {
          created_at: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
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
      update_match_stats: {
        Args: {
          p_is_friendly: boolean
          p_match_id: string
          p_mode: string
          p_player1: string
          p_player1_exp_gain: number
          p_player2: string
          p_player2_exp_gain: number
          p_winner: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "user" | "workshop"
      match_mode: "friendly" | "tournament"
      membership_status: "trial" | "active" | "inactive"
      payment_status: "pending" | "approved" | "rejected"
      request_status: "open" | "matched" | "cancelled" | "arrived" | "completed"
      user_level: "beginner" | "intermediate" | "advanced"
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
      app_role: ["admin", "user", "workshop"],
      match_mode: ["friendly", "tournament"],
      membership_status: ["trial", "active", "inactive"],
      payment_status: ["pending", "approved", "rejected"],
      request_status: ["open", "matched", "cancelled", "arrived", "completed"],
      user_level: ["beginner", "intermediate", "advanced"],
    },
  },
} as const
