export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
      classes: {
        Row: {
          created_at: string
          description: string | null
          fee: number | null
          grade: string | null
          id: string
          name: string | null
          starting_date: string | null
          status: string | null
          subject: string | null
          time_slots: Json[] | null
          tutor_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          fee?: number | null
          grade?: string | null
          id?: string
          name?: string | null
          starting_date?: string | null
          status?: string | null
          subject?: string | null
          time_slots?: Json[] | null
          tutor_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          fee?: number | null
          grade?: string | null
          id?: string
          name?: string | null
          starting_date?: string | null
          status?: string | null
          subject?: string | null
          time_slots?: Json[] | null
          tutor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "classes_tutor_id_fkey"
            columns: ["tutor_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      customers_subscriptions: {
        Row: {
          customer_id: string
          id: number
          subscription_id: string | null
          user_id: string
        }
        Insert: {
          customer_id: string
          id?: never
          subscription_id?: string | null
          user_id: string
        }
        Update: {
          customer_id?: string
          id?: never
          subscription_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_subscriptions_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: true
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_sessions: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          recurrence_rule: string | null
          recurring_end_date: string | null
          start_time: string | null
          title: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          recurrence_rule?: string | null
          recurring_end_date?: string | null
          start_time?: string | null
          title?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          recurrence_rule?: string | null
          recurring_end_date?: string | null
          start_time?: string | null
          title?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_materials: {
        Row: {
          availability_period: string | null
          class_id: string | null
          created_at: string
          description: string | null
          file_size: string | null
          id: string
          name: string | null
          session_id: string | null
          url: string | null
        }
        Insert: {
          availability_period?: string | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_size?: string | null
          id?: string
          name?: string | null
          session_id?: string | null
          url?: string | null
        }
        Update: {
          availability_period?: string | null
          class_id?: string | null
          created_at?: string
          description?: string | null
          file_size?: string | null
          id?: string
          name?: string | null
          session_id?: string | null
          url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_materials_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_materials_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          class_id: string | null
          created_at: string
          description: string | null
          end_time: string | null
          id: string
          meeting_url: string | null
          zoom_meeting_id: string | null
          zoom_session_name: string | null
          zoom_host_token: string | null
          zoom_participant_token: string | null
          recording_urls: string[] | null
          recurring_session_id: string | null
          start_time: string | null
          status: string | null
          title: string | null
          updated_at: string | null
        }
        Insert: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          meeting_url?: string | null
          zoom_meeting_id?: string | null
          zoom_session_name?: string | null
          zoom_host_token?: string | null
          zoom_participant_token?: string | null
          recording_urls?: string[] | null
          recurring_session_id?: string | null
          start_time?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Update: {
          class_id?: string | null
          created_at?: string
          description?: string | null
          end_time?: string | null
          id?: string
          meeting_url?: string | null
          zoom_meeting_id?: string | null
          zoom_session_name?: string | null
          zoom_host_token?: string | null
          zoom_participant_token?: string | null
          recording_urls?: string[] | null
          recurring_session_id?: string | null
          start_time?: string | null
          status?: string | null
          title?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_recurring_session_id_fkey"
            columns: ["recurring_session_id"]
            isOneToOne: false
            referencedRelation: "recurring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_class_enrollments: {
        Row: {
          class_id: string
          created_at: string
          enrolled_date: string | null
          id: string
          student_id: string
        }
        Insert: {
          class_id: string
          created_at?: string
          enrolled_date?: string | null
          id?: string
          student_id: string
        }
        Update: {
          class_id?: string
          created_at?: string
          enrolled_date?: string | null
          id?: string
          student_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_class_enrollments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_enrollments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_payments: {
        Row: {
          amount: number | null
          class_id: string | null
          created_at: string
          id: string
          invoice_date: string | null
          invoice_no: string | null
          payment_date: string | null
          payment_period: string | null
          payment_proof_url: string | null
          status: string | null
          student_id: string | null
        }
        Insert: {
          amount?: number | null
          class_id?: string | null
          created_at?: string
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          payment_date?: string | null
          payment_period?: string | null
          payment_proof_url?: string | null
          status?: string | null
          student_id?: string | null
        }
        Update: {
          amount?: number | null
          class_id?: string | null
          created_at?: string
          id?: string
          invoice_date?: string | null
          invoice_no?: string | null
          payment_date?: string | null
          payment_period?: string | null
          payment_proof_url?: string | null
          status?: string | null
          student_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_class_id_fkey"
            columns: ["class_id"]
            isOneToOne: false
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payments_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_session_attendance: {
        Row: {
          created_at: string
          id: string
          session_id: string | null
          student_id: string | null
          time: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          session_id?: string | null
          student_id?: string | null
          time?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          session_id?: string | null
          student_id?: string | null
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_session_attendance_session_id_fkey"
            columns: ["session_id"]
            isOneToOne: false
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_session_attendance_student_id_fkey"
            columns: ["student_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean
          created_at: string
          currency: string | null
          id: string
          interval: string | null
          interval_count: number | null
          period_ends_at: string
          period_starts_at: string
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at: string | null
          trial_starts_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end: boolean
          created_at: string
          currency?: string | null
          id: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at: string
          period_starts_at: string
          price_id: string
          status: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean
          created_at?: string
          currency?: string | null
          id?: string
          interval?: string | null
          interval_count?: number | null
          period_ends_at?: string
          period_starts_at?: string
          price_id?: string
          status?: Database["public"]["Enums"]["subscription_status"]
          trial_ends_at?: string | null
          trial_starts_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscriptions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          bank_details: Json | null
          biography: string | null
          created_at: string
          display_name: string | null
          email: string;
          first_name: string | null
          id: string
          last_name: string | null
          phone_number: string | null
          photo_url: string | null
          status: string | null
          user_role: string | null
        }
        Insert: {
          bank_details?: Json | null
          biography?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id: string
          last_name?: string | null
          phone_number?: string | null
          photo_url?: string | null
          status?: string | null
          user_role?: string | null
        }
        Update: {
          bank_details?: Json | null
          biography?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          id?: string
          last_name?: string | null
          phone_number?: string | null
          photo_url?: string | null
          status?: string | null
          user_role?: string | null
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
      subscription_status:
        | "active"
        | "trialing"
        | "past_due"
        | "canceled"
        | "unpaid"
        | "incomplete"
        | "incomplete_expired"
        | "paused"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type PublicSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  PublicTableNameOrOptions extends
    | keyof (PublicSchema["Tables"] & PublicSchema["Views"])
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
        Database[PublicTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? (Database[PublicTableNameOrOptions["schema"]]["Tables"] &
      Database[PublicTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : PublicTableNameOrOptions extends keyof (PublicSchema["Tables"] &
        PublicSchema["Views"])
    ? (PublicSchema["Tables"] &
        PublicSchema["Views"])[PublicTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  PublicTableNameOrOptions extends
    | keyof PublicSchema["Tables"]
    | { schema: keyof Database },
  TableName extends PublicTableNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = PublicTableNameOrOptions extends { schema: keyof Database }
  ? Database[PublicTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : PublicTableNameOrOptions extends keyof PublicSchema["Tables"]
    ? PublicSchema["Tables"][PublicTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  PublicEnumNameOrOptions extends
    | keyof PublicSchema["Enums"]
    | { schema: keyof Database },
  EnumName extends PublicEnumNameOrOptions extends { schema: keyof Database }
    ? keyof Database[PublicEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = PublicEnumNameOrOptions extends { schema: keyof Database }
  ? Database[PublicEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : PublicEnumNameOrOptions extends keyof PublicSchema["Enums"]
    ? PublicSchema["Enums"][PublicEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof PublicSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof PublicSchema["CompositeTypes"]
    ? PublicSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never
