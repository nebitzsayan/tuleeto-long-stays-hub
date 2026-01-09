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
    PostgrestVersion: "12.2.12 (cd3cf9e)"
  }
  public: {
    Tables: {
      admin_logs: {
        Row: {
          action_type: string
          admin_id: string
          created_at: string
          details: Json | null
          id: string
          target_id: string | null
          target_type: string | null
        }
        Insert: {
          action_type: string
          admin_id: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Update: {
          action_type?: string
          admin_id?: string
          created_at?: string
          details?: Json | null
          id?: string
          target_id?: string | null
          target_type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "admin_logs_admin_id_fkey"
            columns: ["admin_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_records: {
        Row: {
          bill_number: string | null
          cost_per_unit: number | null
          created_at: string
          electricity_amount: number | null
          electricity_paid: boolean | null
          electricity_paid_date: string | null
          electricity_units: number | null
          id: string
          month: number
          other_charges: number | null
          other_charges_description: string | null
          remarks: string | null
          rent_amount: number | null
          rent_paid: boolean | null
          rent_paid_date: string | null
          tenant_id: string
          updated_at: string
          water_amount: number | null
          water_paid: boolean | null
          water_paid_date: string | null
          year: number
        }
        Insert: {
          bill_number?: string | null
          cost_per_unit?: number | null
          created_at?: string
          electricity_amount?: number | null
          electricity_paid?: boolean | null
          electricity_paid_date?: string | null
          electricity_units?: number | null
          id?: string
          month: number
          other_charges?: number | null
          other_charges_description?: string | null
          remarks?: string | null
          rent_amount?: number | null
          rent_paid?: boolean | null
          rent_paid_date?: string | null
          tenant_id: string
          updated_at?: string
          water_amount?: number | null
          water_paid?: boolean | null
          water_paid_date?: string | null
          year: number
        }
        Update: {
          bill_number?: string | null
          cost_per_unit?: number | null
          created_at?: string
          electricity_amount?: number | null
          electricity_paid?: boolean | null
          electricity_paid_date?: string | null
          electricity_units?: number | null
          id?: string
          month?: number
          other_charges?: number | null
          other_charges_description?: string | null
          remarks?: string | null
          rent_amount?: number | null
          rent_paid?: boolean | null
          rent_paid_date?: string | null
          tenant_id?: string
          updated_at?: string
          water_amount?: number | null
          water_paid?: boolean | null
          water_paid_date?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "payment_records_tenant_id_fkey"
            columns: ["tenant_id"]
            isOneToOne: false
            referencedRelation: "tenants"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          ban_reason: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          is_banned: boolean | null
          last_login: string | null
        }
        Insert: {
          avatar_url?: string | null
          ban_reason?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id: string
          is_banned?: boolean | null
          last_login?: string | null
        }
        Update: {
          avatar_url?: string | null
          ban_reason?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          is_banned?: boolean | null
          last_login?: string | null
        }
        Relationships: []
      }
      properties: {
        Row: {
          area: number
          available_from: string
          bathrooms: number
          bedrooms: number
          contact_phone: string | null
          coordinates: Json | null
          created_at: string
          description: string
          features: string[] | null
          flag_reason: string | null
          id: string
          images: string[]
          is_featured: boolean | null
          is_flagged: boolean | null
          is_public: boolean | null
          location: string
          owner_id: string
          price: number
          report_count: number | null
          title: string
          type: string
          view_count: number | null
        }
        Insert: {
          area: number
          available_from: string
          bathrooms: number
          bedrooms: number
          contact_phone?: string | null
          coordinates?: Json | null
          created_at?: string
          description: string
          features?: string[] | null
          flag_reason?: string | null
          id?: string
          images: string[]
          is_featured?: boolean | null
          is_flagged?: boolean | null
          is_public?: boolean | null
          location: string
          owner_id: string
          price: number
          report_count?: number | null
          title: string
          type: string
          view_count?: number | null
        }
        Update: {
          area?: number
          available_from?: string
          bathrooms?: number
          bedrooms?: number
          contact_phone?: string | null
          coordinates?: Json | null
          created_at?: string
          description?: string
          features?: string[] | null
          flag_reason?: string | null
          id?: string
          images?: string[]
          is_featured?: boolean | null
          is_flagged?: boolean | null
          is_public?: boolean | null
          location?: string
          owner_id?: string
          price?: number
          report_count?: number | null
          title?: string
          type?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reports: {
        Row: {
          created_at: string
          description: string | null
          id: string
          property_id: string
          reason: string
          reporter_id: string
          status: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          property_id: string
          reason: string
          reporter_id: string
          status?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          property_id?: string
          reason?: string
          reporter_id?: string
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reports_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      property_reviews: {
        Row: {
          admin_response: string | null
          comment: string | null
          created_at: string
          flag_reason: string | null
          id: string
          is_approved: boolean | null
          is_flagged: boolean | null
          property_id: string
          rating: number
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          comment?: string | null
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_approved?: boolean | null
          is_flagged?: boolean | null
          property_id: string
          rating: number
          user_id: string
        }
        Update: {
          admin_response?: string | null
          comment?: string | null
          created_at?: string
          flag_reason?: string | null
          id?: string
          is_approved?: boolean | null
          is_flagged?: boolean | null
          property_id?: string
          rating?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "property_reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
      review_reactions: {
        Row: {
          created_at: string
          id: string
          reaction_type: string
          review_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          reaction_type: string
          review_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          reaction_type?: string
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_reactions_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "property_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      review_replies: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_reply_id: string | null
          review_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          review_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_reply_id?: string | null
          review_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "review_replies_parent_reply_id_fkey"
            columns: ["parent_reply_id"]
            isOneToOne: false
            referencedRelation: "review_replies"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "review_replies_review_id_fkey"
            columns: ["review_id"]
            isOneToOne: false
            referencedRelation: "property_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      tenants: {
        Row: {
          created_at: string
          email: string | null
          id: string
          is_active: boolean | null
          monthly_rent: number
          move_in_date: string
          move_out_date: string | null
          name: string
          notes: string | null
          phone: string
          property_id: string
          room_number: string | null
          security_deposit: number | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          monthly_rent: number
          move_in_date: string
          move_out_date?: string | null
          name: string
          notes?: string | null
          phone: string
          property_id: string
          room_number?: string | null
          security_deposit?: number | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          is_active?: boolean | null
          monthly_rent?: number
          move_in_date?: string
          move_out_date?: string | null
          name?: string
          notes?: string | null
          phone?: string
          property_id?: string
          room_number?: string | null
          security_deposit?: number | null
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tenants_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_public_view"
            referencedColumns: ["id"]
          },
        ]
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
      wishlists: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "wishlists_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "wishlists_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "property_public_view"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      property_public_view: {
        Row: {
          area: number | null
          available_from: string | null
          bathrooms: number | null
          bedrooms: number | null
          contact_phone: string | null
          coordinates: Json | null
          created_at: string | null
          description: string | null
          features: string[] | null
          id: string | null
          images: string[] | null
          is_public: boolean | null
          location: string | null
          owner_id: string | null
          price: number | null
          title: string | null
          type: string | null
        }
        Insert: {
          area?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          contact_phone?: never
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string | null
          images?: string[] | null
          is_public?: boolean | null
          location?: string | null
          owner_id?: string | null
          price?: number | null
          title?: string | null
          type?: string | null
        }
        Update: {
          area?: number | null
          available_from?: string | null
          bathrooms?: number | null
          bedrooms?: number | null
          contact_phone?: never
          coordinates?: Json | null
          created_at?: string | null
          description?: string | null
          features?: string[] | null
          id?: string | null
          images?: string[] | null
          is_public?: boolean | null
          location?: string | null
          owner_id?: string | null
          price?: number | null
          title?: string | null
          type?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "properties_owner_id_fkey"
            columns: ["owner_id"]
            isOneToOne: false
            referencedRelation: "public_profiles_safe"
            referencedColumns: ["id"]
          },
        ]
      }
      public_profiles: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
      public_profiles_safe: {
        Row: {
          avatar_url: string | null
          created_at: string | null
          full_name: string | null
          id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string | null
          full_name?: string | null
          id?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      can_view_contact_details: {
        Args: { _property_id: string }
        Returns: boolean
      }
      get_safe_profile_data: {
        Args: { profile_id: string }
        Returns: {
          avatar_url: string
          created_at: string
          full_name: string
          id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
      log_admin_action: {
        Args: {
          _action_type: string
          _details?: Json
          _target_id?: string
          _target_type?: string
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
