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
      auto_value_market_snapshots: {
        Row: {
          country: string
          created_at: string | null
          id: string
          p50_eur: number | null
          sample_count: number | null
          snapshot_date: string | null
          source: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
        }
        Insert: {
          country: string
          created_at?: string | null
          id?: string
          p50_eur?: number | null
          sample_count?: number | null
          snapshot_date?: string | null
          source?: string | null
          vehicle_make: string
          vehicle_model: string
          vehicle_year: number
        }
        Update: {
          country?: string
          created_at?: string | null
          id?: string
          p50_eur?: number | null
          sample_count?: number | null
          snapshot_date?: string | null
          source?: string | null
          vehicle_make?: string
          vehicle_model?: string
          vehicle_year?: number
        }
        Relationships: []
      }
      auto_value_results: {
        Row: {
          confidence_score: number | null
          created_at: string | null
          id: string
          market_risk_score: number | null
          negotiation_floor_eur: number | null
          negotiation_floor_huf: number | null
          p10_eur: number | null
          p10_huf: number | null
          p25_eur: number | null
          p25_huf: number | null
          p50_eur: number | null
          p50_huf: number | null
          p75_eur: number | null
          p75_huf: number | null
          p90_eur: number | null
          p90_huf: number | null
          payload: Json
          recommended_ask_eur: number | null
          recommended_ask_huf: number | null
          sales_velocity_days: number | null
          schema_version: string | null
          session_id: string | null
          status: string | null
          user_id: string | null
        }
        Insert: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          market_risk_score?: number | null
          negotiation_floor_eur?: number | null
          negotiation_floor_huf?: number | null
          p10_eur?: number | null
          p10_huf?: number | null
          p25_eur?: number | null
          p25_huf?: number | null
          p50_eur?: number | null
          p50_huf?: number | null
          p75_eur?: number | null
          p75_huf?: number | null
          p90_eur?: number | null
          p90_huf?: number | null
          payload?: Json
          recommended_ask_eur?: number | null
          recommended_ask_huf?: number | null
          sales_velocity_days?: number | null
          schema_version?: string | null
          session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Update: {
          confidence_score?: number | null
          created_at?: string | null
          id?: string
          market_risk_score?: number | null
          negotiation_floor_eur?: number | null
          negotiation_floor_huf?: number | null
          p10_eur?: number | null
          p10_huf?: number | null
          p25_eur?: number | null
          p25_huf?: number | null
          p50_eur?: number | null
          p50_huf?: number | null
          p75_eur?: number | null
          p75_huf?: number | null
          p90_eur?: number | null
          p90_huf?: number | null
          payload?: Json
          recommended_ask_eur?: number | null
          recommended_ask_huf?: number | null
          sales_velocity_days?: number | null
          schema_version?: string | null
          session_id?: string | null
          status?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "auto_value_results_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "auto_value_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_value_sessions: {
        Row: {
          accident_free: boolean | null
          created_at: string | null
          id: string
          linked_condition_score: number | null
          linked_negotiation_summary: string | null
          linked_pdr_count: number | null
          linked_repair_cost_eur: number | null
          linked_repair_cost_huf: number | null
          linked_result_id: string | null
          linked_session_id: string | null
          linked_value_reduction_pct: number | null
          owners_count: number | null
          service_book: boolean | null
          status: string | null
          target_country: string | null
          target_region: string | null
          updated_at: string | null
          user_id: string | null
          vehicle_color: string | null
          vehicle_fuel_type: string | null
          vehicle_make: string
          vehicle_mileage_km: number
          vehicle_model: string
          vehicle_vin: string | null
          vehicle_year: number
        }
        Insert: {
          accident_free?: boolean | null
          created_at?: string | null
          id?: string
          linked_condition_score?: number | null
          linked_negotiation_summary?: string | null
          linked_pdr_count?: number | null
          linked_repair_cost_eur?: number | null
          linked_repair_cost_huf?: number | null
          linked_result_id?: string | null
          linked_session_id?: string | null
          linked_value_reduction_pct?: number | null
          owners_count?: number | null
          service_book?: boolean | null
          status?: string | null
          target_country?: string | null
          target_region?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_fuel_type?: string | null
          vehicle_make: string
          vehicle_mileage_km: number
          vehicle_model: string
          vehicle_vin?: string | null
          vehicle_year: number
        }
        Update: {
          accident_free?: boolean | null
          created_at?: string | null
          id?: string
          linked_condition_score?: number | null
          linked_negotiation_summary?: string | null
          linked_pdr_count?: number | null
          linked_repair_cost_eur?: number | null
          linked_repair_cost_huf?: number | null
          linked_result_id?: string | null
          linked_session_id?: string | null
          linked_value_reduction_pct?: number | null
          owners_count?: number | null
          service_book?: boolean | null
          status?: string | null
          target_country?: string | null
          target_region?: string | null
          updated_at?: string | null
          user_id?: string | null
          vehicle_color?: string | null
          vehicle_fuel_type?: string | null
          vehicle_make?: string
          vehicle_mileage_km?: number
          vehicle_model?: string
          vehicle_vin?: string | null
          vehicle_year?: number
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
