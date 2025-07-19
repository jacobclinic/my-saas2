export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

export type Database = {
  public: {
    Tables: {
      classes: {
        Row: {
          created_at: string;
          description: string | null;
          end_date: string | null;
          fee: number | null;
          grade: string | null;
          id: string;
          name: string | null;
          starting_date: string | null;
          status: string | null;
          subject: string | null;
          time_slots: Json[] | null;
          tutor_id: string;
        };
        Insert: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          fee?: number | null;
          grade?: string | null;
          id?: string;
          name?: string | null;
          starting_date?: string | null;
          status?: string | null;
          subject?: string | null;
          time_slots?: Json[] | null;
          tutor_id: string;
        };
        Update: {
          created_at?: string;
          description?: string | null;
          end_date?: string | null;
          fee?: number | null;
          grade?: string | null;
          id?: string;
          name?: string | null;
          starting_date?: string | null;
          status?: string | null;
          subject?: string | null;
          time_slots?: Json[] | null;
          tutor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'classes_tutor_id_fkey';
            columns: ['tutor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      customers_subscriptions: {
        Row: {
          customer_id: string;
          id: number;
          subscription_id: string | null;
          user_id: string;
        };
        Insert: {
          customer_id: string;
          id?: never;
          subscription_id?: string | null;
          user_id: string;
        };
        Update: {
          customer_id?: string;
          id?: never;
          subscription_id?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'customers_subscriptions_subscription_id_fkey';
            columns: ['subscription_id'];
            isOneToOne: true;
            referencedRelation: 'subscriptions';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'customers_subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      invoices: {
        Row: {
          amount: number;
          class_id: string;
          created_at: string | null;
          due_date: string | null;
          id: string;
          invoice_date: string;
          invoice_no: string;
          invoice_period: string;
          status: string;
          student_id: string;
          updated_at: string | null;
        };
        Insert: {
          amount: number;
          class_id: string;
          created_at?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_date: string;
          invoice_no: string;
          invoice_period: string;
          status?: string;
          student_id: string;
          updated_at?: string | null;
        };
        Update: {
          amount?: number;
          class_id?: string;
          created_at?: string | null;
          due_date?: string | null;
          id?: string;
          invoice_date?: string;
          invoice_no?: string;
          invoice_period?: string;
          status?: string;
          student_id?: string;
          updated_at?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'invoices_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'classes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'invoices_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      recurring_sessions: {
        Row: {
          class_id: string | null;
          created_at: string;
          description: string | null;
          end_time: string | null;
          id: string;
          recurrence_rule: string | null;
          recurring_end_date: string | null;
          start_time: string | null;
          title: string | null;
        };
        Insert: {
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          recurrence_rule?: string | null;
          recurring_end_date?: string | null;
          start_time?: string | null;
          title?: string | null;
        };
        Update: {
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          recurrence_rule?: string | null;
          recurring_end_date?: string | null;
          start_time?: string | null;
          title?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'recurring_sessions_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'classes';
            referencedColumns: ['id'];
          },
        ];
      };
      resource_materials: {
        Row: {
          availability_period: string | null;
          class_id: string | null;
          created_at: string;
          description: string | null;
          file_size: string | null;
          id: string;
          name: string | null;
          session_id: string | null;
          url: string | null;
        };
        Insert: {
          availability_period?: string | null;
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          file_size?: string | null;
          id?: string;
          name?: string | null;
          session_id?: string | null;
          url?: string | null;
        };
        Update: {
          availability_period?: string | null;
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          file_size?: string | null;
          id?: string;
          name?: string | null;
          session_id?: string | null;
          url?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'resource_materials_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'classes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'resource_materials_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      sessions: {
        Row: {
          attendance_marked: boolean;
          class_id: string | null;
          created_at: string;
          description: string | null;
          end_time: string | null;
          id: string;
          meeting_url: string | null;
          recording_urls: string[] | null;
          recurring_session_id: string | null;
          start_time: string | null;
          status: string | null;
          title: string | null;
          updated_at: string | null;
          zoom_host_token: string | null;
          zoom_meeting_id: string | null;
          zoom_participant_token: string | null;
          zoom_session_name: string | null;
        };
        Insert: {
          attendance_marked?: boolean;
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          meeting_url?: string | null;
          recording_urls?: string[] | null;
          recurring_session_id?: string | null;
          start_time?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          zoom_host_token?: string | null;
          zoom_meeting_id?: string | null;
          zoom_participant_token?: string | null;
          zoom_session_name?: string | null;
        };
        Update: {
          attendance_marked?: boolean;
          class_id?: string | null;
          created_at?: string;
          description?: string | null;
          end_time?: string | null;
          id?: string;
          meeting_url?: string | null;
          recording_urls?: string[] | null;
          recurring_session_id?: string | null;
          start_time?: string | null;
          status?: string | null;
          title?: string | null;
          updated_at?: string | null;
          zoom_host_token?: string | null;
          zoom_meeting_id?: string | null;
          zoom_participant_token?: string | null;
          zoom_session_name?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'sessions_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'classes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'sessions_recurring_session_id_fkey';
            columns: ['recurring_session_id'];
            isOneToOne: false;
            referencedRelation: 'recurring_sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      student_class_enrollments: {
        Row: {
          class_id: string;
          created_at: string;
          enrolled_date: string | null;
          id: string;
          student_id: string;
        };
        Insert: {
          class_id: string;
          created_at?: string;
          enrolled_date?: string | null;
          id?: string;
          student_id: string;
        };
        Update: {
          class_id?: string;
          created_at?: string;
          enrolled_date?: string | null;
          id?: string;
          student_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'student_class_enrollments_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'classes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'student_class_enrollments_student_id_fkey';
            columns: ['student_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      student_payments: {
        Row: {
          amount: number | null;
          class_id: string | null;
          created_at: string;
          id: string;
          invoice_date: string | null;
          invoice_id: string | null;
          invoice_no: string | null;
          notes: string | null;
          payment_date: string | null;
          payment_period: string | null;
          payment_proof_url: string | null;
          rejected_date: string | null;
          status: string | null;
          student_id: string | null;
          verified_date: string | null;
        };
        Insert: {
          amount?: number | null;
          class_id?: string | null;
          created_at?: string;
          id?: string;
          invoice_date?: string | null;
          invoice_id?: string | null;
          invoice_no?: string | null;
          notes?: string | null;
          payment_date?: string | null;
          payment_period?: string | null;
          payment_proof_url?: string | null;
          rejected_date?: string | null;
          status?: string | null;
          student_id?: string | null;
          verified_date?: string | null;
        };
        Update: {
          amount?: number | null;
          class_id?: string | null;
          created_at?: string;
          id?: string;
          invoice_date?: string | null;
          invoice_id?: string | null;
          invoice_no?: string | null;
          notes?: string | null;
          payment_date?: string | null;
          payment_period?: string | null;
          payment_proof_url?: string | null;
          rejected_date?: string | null;
          status?: string | null;
          student_id?: string | null;
          verified_date?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'fk_student_payments_invoice_id';
            columns: ['invoice_id'];
            isOneToOne: false;
            referencedRelation: 'invoices';
            referencedColumns: ['id'];
          },
        ];
      };
      student_session_attendance: {
        Row: {
          created_at: string;
          email: string | null;
          id: string;
          join_time: string;
          leave_time: string;
          name: string | null;
          session_id: string | null;
          time: string | null;
        };
        Insert: {
          created_at?: string;
          email?: string | null;
          id?: string;
          join_time: string;
          leave_time: string;
          name?: string | null;
          session_id?: string | null;
          time?: string | null;
        };
        Update: {
          created_at?: string;
          email?: string | null;
          id?: string;
          join_time?: string;
          leave_time?: string;
          name?: string | null;
          session_id?: string | null;
          time?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: 'student_session_attendance_session_id_fkey';
            columns: ['session_id'];
            isOneToOne: false;
            referencedRelation: 'sessions';
            referencedColumns: ['id'];
          },
        ];
      };
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean;
          created_at: string;
          currency: string | null;
          id: string;
          interval: string | null;
          interval_count: number | null;
          period_ends_at: string;
          period_starts_at: string;
          price_id: string;
          status: Database['public']['Enums']['subscription_status'];
          trial_ends_at: string | null;
          trial_starts_at: string | null;
          user_id: string;
        };
        Insert: {
          cancel_at_period_end: boolean;
          created_at: string;
          currency?: string | null;
          id: string;
          interval?: string | null;
          interval_count?: number | null;
          period_ends_at: string;
          period_starts_at: string;
          price_id: string;
          status: Database['public']['Enums']['subscription_status'];
          trial_ends_at?: string | null;
          trial_starts_at?: string | null;
          user_id: string;
        };
        Update: {
          cancel_at_period_end?: boolean;
          created_at?: string;
          currency?: string | null;
          id?: string;
          interval?: string | null;
          interval_count?: number | null;
          period_ends_at?: string;
          period_starts_at?: string;
          price_id?: string;
          status?: Database['public']['Enums']['subscription_status'];
          trial_ends_at?: string | null;
          trial_starts_at?: string | null;
          user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'subscriptions_user_id_fkey';
            columns: ['user_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      tutor_invoices: {
        Row: {
          amount: number;
          class_id: string;
          created_at: string;
          id: string;
          invoice_no: string;
          payment_period: string;
          payment_url: string | null;
          status: string | null;
          tutor_id: string;
        };
        Insert: {
          amount?: number;
          class_id: string;
          created_at?: string;
          id?: string;
          invoice_no: string;
          payment_period: string;
          payment_url?: string | null;
          status?: string | null;
          tutor_id: string;
        };
        Update: {
          amount?: number;
          class_id?: string;
          created_at?: string;
          id?: string;
          invoice_no?: string;
          payment_period?: string;
          payment_url?: string | null;
          status?: string | null;
          tutor_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'tutor_invoices_class_id_fkey';
            columns: ['class_id'];
            isOneToOne: false;
            referencedRelation: 'classes';
            referencedColumns: ['id'];
          },
          {
            foreignKeyName: 'tutor_invoices_tutor_id_fkey';
            columns: ['tutor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
      users: {
        Row: {
          address: string | null;
          bank_details: Json | null;
          biography: string | null;
          created_at: string;
          display_name: string | null;
          email: string | null;
          first_name: string | null;
          id: string;
          last_name: string | null;
          phone_number: string | null;
          photo_url: string | null;
          status: string | null;
          user_role: string | null;
        };
        Insert: {
          address?: string | null;
          bank_details?: Json | null;
          biography?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          id: string;
          last_name?: string | null;
          phone_number?: string | null;
          photo_url?: string | null;
          status?: string | null;
          user_role?: string | null;
        };
        Update: {
          address?: string | null;
          bank_details?: Json | null;
          biography?: string | null;
          created_at?: string;
          display_name?: string | null;
          email?: string | null;
          first_name?: string | null;
          id?: string;
          last_name?: string | null;
          phone_number?: string | null;
          photo_url?: string | null;
          status?: string | null;
          user_role?: string | null;
        };
        Relationships: [];
      };
      zoom_sessions: {
        Row: {
          id: number;
          created_at: string;
          session_id: string;
          meeting_uuid: string;
          meeting_id: string;
          host_id: string;
          host_user_id: string;
          type: string | null;
          status: string | null;
          start_time: string;
          duration: number | null;
          timezone: string | null;
          join_url: string;
          start_url: string;
          password: string | null;
          settings_json: Json | null;
          creation_source: string | null;
        };
        Insert: {
          id?: number;
          created_at?: string;
          session_id: string;
          meeting_uuid: string;
          meeting_id: string;
          host_id: string;
          host_user_id: string;
          type?: string | null;
          status?: string | null;
          start_time: string;
          duration?: number | null;
          timezone?: string | null;
          join_url: string;
          start_url: string;
          password?: string | null;
          settings_json?: Json | null;
          creation_source?: string | null;
        };
        Update: {
          id?: number;
          created_at?: string;
          session_id?: string;
          meeting_uuid?: string;
          meeting_id?: string;
          host_id?: string;
          host_user_id?: string;
          type?: string | null;
          status?: string | null;
          start_time?: string;
          duration?: number | null;
          timezone?: string | null;
          join_url?: string;
          start_url?: string;
          password?: string | null;
          settings_json?: Json | null;
          creation_source?: string | null;
        };
      };
      zoom_users: {
        Row: {
          account_type: number;
          created_at: string;
          email: string;
          id: number;
          tutor_id: string | null;
          zoom_user_id: string;
        };
        Insert: {
          account_type: number;
          created_at?: string;
          email: string;
          id?: number;
          tutor_id?: string | null;
          zoom_user_id: string;
        };
        Update: {
          account_type?: number;
          created_at?: string;
          email?: string;
          id?: number;
          tutor_id?: string | null;
          zoom_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: 'zoom_users_tutor_id_fkey';
            columns: ['tutor_id'];
            isOneToOne: false;
            referencedRelation: 'users';
            referencedColumns: ['id'];
          },
        ];
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      subscription_status:
      | 'active'
      | 'trialing'
      | 'past_due'
      | 'canceled'
      | 'unpaid'
      | 'incomplete'
      | 'incomplete_expired'
      | 'paused';
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};

type DefaultSchema = Database[Extract<keyof Database, 'public'>];

export type Tables<
  DefaultSchemaTableNameOrOptions extends
  | keyof (DefaultSchema['Tables'] & DefaultSchema['Views'])
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
    Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'] &
    Database[DefaultSchemaTableNameOrOptions['schema']]['Views'])[TableName] extends {
      Row: infer R;
    }
  ? R
  : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema['Tables'] &
    DefaultSchema['Views'])
  ? (DefaultSchema['Tables'] &
    DefaultSchema['Views'])[DefaultSchemaTableNameOrOptions] extends {
      Row: infer R;
    }
  ? R
  : never
  : never;

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Insert: infer I;
  }
  ? I
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
    Insert: infer I;
  }
  ? I
  : never
  : never;

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
  | keyof DefaultSchema['Tables']
  | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[DefaultSchemaTableNameOrOptions['schema']]['Tables']
  : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions['schema']]['Tables'][TableName] extends {
    Update: infer U;
  }
  ? U
  : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema['Tables']
  ? DefaultSchema['Tables'][DefaultSchemaTableNameOrOptions] extends {
    Update: infer U;
  }
  ? U
  : never
  : never;

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
  | keyof DefaultSchema['Enums']
  | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums']
  : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions['schema']]['Enums'][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema['Enums']
  ? DefaultSchema['Enums'][DefaultSchemaEnumNameOrOptions]
  : never;

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
  | keyof DefaultSchema['CompositeTypes']
  | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database;
  }
  ? keyof Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes']
  : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions['schema']]['CompositeTypes'][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema['CompositeTypes']
  ? DefaultSchema['CompositeTypes'][PublicCompositeTypeNameOrOptions]
  : never;
