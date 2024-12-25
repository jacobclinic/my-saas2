export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  graphql_public: {
    Tables: {
      [_ in never]: never
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      graphql: {
        Args: {
          operationName?: string
          query?: string
          variables?: Json
          extensions?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
  public: {
    Tables: {
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
          id: string
          photo_url: string | null
          display_name: string | null
          created_at: string
          biography: string | null
          email: string
          phone_number: string | null
          status: string | null
          bank_details: string | null
          user_role: string | null
          first_name: string | null
          last_name: string | null
        }
        Insert: {
          id: string
          created_at?: string
          display_name?: string | null
          photo_url?: string | null
          email: string
          phone_number?: string | null

        }
        Update: {
          id?: string
          photo_url?: string | null
          display_name?: string | null
          created_at?: string
          biography?: string | null
          email?: string
          phone_number?: string | null
          status?: string | null
          bank_details?: string | null
          user_role?: string | null
          first_name?: string | null
          last_name?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "users_id_fkey"
            columns: ["id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      sessions: {
        Row: {
          id: string
          created_at: string
          class_id: string
          recording_urls: string[] | [] | null
          start_time: string
          end_time: string | null
          recurring_session_id: string | null
          title: string | null
          description: string | null
          updated_at: string | null
          meeting_url: string | null
        }
        Insert: {
          id?: string
          created_at?: string
          class_id: string
          recording_urls?: string[] | [] | null
          start_time: string
          end_time?: string | null
          recurring_session_id?: string | null
          title?: string | null
          description?: string | null
          updated_at?: string | null
          meeting_url?: string | null
        }
        Update: {
          id?: string
          created_at?: string
          class_id?: string
          recording_urls?: string[] | [] | null
          start_time?: string
          end_time?: string | null
          recurring_session_id?: string | null
          title?: string | null
          description?: string | null
          updated_at?: string | null
          meeting_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "sessions_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sessions_recurring_session_id_fkey"
            columns: ["recurring_session_id"]
            referencedRelation: "reccuring_sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      resource_materials: {
        Row: {
          id: string
          created_at: string | null
          name: string | null
          description: string | null
          availability_period: string | null
          url: string
          class_id: string
          session_id: string | null
          file_size: string | null
        }
        Insert: {
          id?: string
          created_at?: string | null
          name?: string | null
          description?: string | null
          availability_period?: string | null
          url: string
          class_id: string
          session_id?: string | null
          file_size?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string | null
          description?: string | null
          availability_period?: string | null
          url?: string
          class_id?: string
          session_id?: string | null
          file_size?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "resource_materials_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "resource_materials_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_sessions: {
        Row: {
          id: string
          created_at: string | null
          class_id: string
          title: string | null
          description: string | null
          start_time: string
          end_time: string | null
          recurring_end_date: string | null
          recurrence_rule: string | null
        }
        Insert: {
          id: string
          created_at?: string | null
          class_id: string
          title?: string | null
          description?: string | null
          start_time: string
          end_time?: string | null
          recurring_end_date?: string | null
          recurrence_rule?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          class_id?: string
          title?: string | null
          description?: string | null
          start_time?: string
          end_time?: string | null
          recurring_end_date?: string | null
          recurrence_rule?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "recurring_sessions_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
        ]
      }
      classes: {
        Row: {
          id: string
          created_at: string | null
          name: string
          description: string | null
          subject: string | null
          tutor_id: string
          fee: number | null
          status: string | null
          time_slots: Json[] | [] | null
          no_of_students?: { count: number }[]
        }
        Insert: {
          id?: string
          created_at?: string | null
          name: string
          description?: string | null
          subject?: string | null
          tutor_id: string
          fee?: number |null
          status?: string | null
          time_slots?: Json[] | [] | null
        }
        Update: {
          id?: string
          created_at?: string | null
          name?: string
          description?: string | null
          subject?: string | null
          tutor_id?: string 
          fee?: number
          status?: string | null
          time_slots?: Json[] | [] | null
        }
        Relationships: [
          {
            foreignKeyName: "classes_tutor_id_fkey"
            columns: ["tutor_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_class_enrollments: {
        Row: {
          id: string
          created_at: string | null
          student_id: string
          class_id: string
          enrolled_date: string | null
        }
        Insert: {
          id: string
          created_at?: string | null
          student_id: string
          class_id: string
          enrolled_date?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          student_id?: string
          class_id?: string
          enrolled_date?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_class_enrollments_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_class_enrollments_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      student_session_attendance: {
        Row: {
          id: string
          created_at: string | null
          student_id: string
          session_id: string
          time: string | null
        }
        Insert: {
          id: string
          created_at?: string | null
          student_id: string
          session_id: string
          time?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          student_id?: string
          session_id?: string
          time?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_session_attendance_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_session_attendance_session_id_fkey"
            columns: ["session_id"]
            referencedRelation: "sessions"
            referencedColumns: ["id"]
          },
        ]
      }
      student_payments: {
        Row: {
          id: string
          created_at: string | null
          invoice_no: string | null
          invoice_date: string | null
          amount : string | null
          payment_date : string | null
          class_id : string
          student_id : string
          payment_period : string | null
          status : string | null
        }
        Insert: {
          id: string
          created_at?: string | null
          invoice_no?: string | null
          invoice_date?: string | null
          amount?: string | null
          payment_date?: string | null
          class_id: string
          student_id: string
          payment_period?: string | null
          status?: string | null
        }
        Update: {
          id?: string
          created_at?: string | null
          invoice_no?: string | null
          invoice_date?: string | null
          amount?: string | null
          payment_date?: string | null
          class_id?: string
          student_id?: string
          payment_period?: string | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "student_payments_class_id_fkey"
            columns: ["class_id"]
            referencedRelation: "classes"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "student_payments_student_id_fkey"
            columns: ["student_id"]
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      install_extensions: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
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
  storage: {
    Tables: {
      buckets: {
        Row: {
          allowed_mime_types: string[] | null
          avif_autodetection: boolean | null
          created_at: string | null
          file_size_limit: number | null
          id: string
          name: string
          owner: string | null
          owner_id: string | null
          public: boolean | null
          updated_at: string | null
        }
        Insert: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id: string
          name: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Update: {
          allowed_mime_types?: string[] | null
          avif_autodetection?: boolean | null
          created_at?: string | null
          file_size_limit?: number | null
          id?: string
          name?: string
          owner?: string | null
          owner_id?: string | null
          public?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
      }
      migrations: {
        Row: {
          executed_at: string | null
          hash: string
          id: number
          name: string
        }
        Insert: {
          executed_at?: string | null
          hash: string
          id: number
          name: string
        }
        Update: {
          executed_at?: string | null
          hash?: string
          id?: number
          name?: string
        }
        Relationships: []
      }
      objects: {
        Row: {
          bucket_id: string | null
          created_at: string | null
          id: string
          last_accessed_at: string | null
          metadata: Json | null
          name: string | null
          owner: string | null
          owner_id: string | null
          path_tokens: string[] | null
          updated_at: string | null
          version: string | null
        }
        Insert: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Update: {
          bucket_id?: string | null
          created_at?: string | null
          id?: string
          last_accessed_at?: string | null
          metadata?: Json | null
          name?: string | null
          owner?: string | null
          owner_id?: string | null
          path_tokens?: string[] | null
          updated_at?: string | null
          version?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "objects_bucketId_fkey"
            columns: ["bucket_id"]
            isOneToOne: false
            referencedRelation: "buckets"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      can_insert_object: {
        Args: {
          bucketid: string
          name: string
          owner: string
          metadata: Json
        }
        Returns: undefined
      }
      extension: {
        Args: {
          name: string
        }
        Returns: string
      }
      filename: {
        Args: {
          name: string
        }
        Returns: string
      }
      foldername: {
        Args: {
          name: string
        }
        Returns: unknown
      }
      get_size_by_bucket: {
        Args: Record<PropertyKey, never>
        Returns: {
          size: number
          bucket_id: string
        }[]
      }
      search: {
        Args: {
          prefix: string
          bucketname: string
          limits?: number
          levels?: number
          offsets?: number
          search?: string
          sortcolumn?: string
          sortorder?: string
        }
        Returns: {
          name: string
          id: string
          updated_at: string
          created_at: string
          last_accessed_at: string
          metadata: Json
        }[]
      }
    }
    Enums: {
      [_ in never]: never
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

