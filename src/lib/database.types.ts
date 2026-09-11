export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  public: {
    Tables: {
      plans: {
        Row: { id: string; name: string; monthly_price: number; student_limit: number; features: Json | null; status: string; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; name: string; monthly_price?: number; student_limit?: number; features?: Json | null; status?: string; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; name?: string; monthly_price?: number; student_limit?: number; features?: Json | null; status?: string; created_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      tenants: {
        Row: { id: string; teacher_user_id: string; workspace_name: string; status: string; plan_id: string | null; trial_end: string | null; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; teacher_user_id: string; workspace_name: string; status?: string; plan_id?: string | null; trial_end?: string | null; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; teacher_user_id?: string; workspace_name?: string; status?: string; plan_id?: string | null; trial_end?: string | null; created_at?: string | null; updated_at?: string | null };
        Relationships: [{ foreignKeyName: "tenants_plan_id_fkey"; columns: ["plan_id"]; referencedRelation: "plans"; referencedColumns: ["id"] }];
      };
      profiles: {
        Row: { id: string; tenant_id: string | null; name: string | null; email: string | null; role: string; created_at: string | null; updated_at: string | null };
        Insert: { id: string; tenant_id?: string | null; name?: string | null; email?: string | null; role: string; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string | null; name?: string | null; email?: string | null; role?: string; created_at?: string | null; updated_at?: string | null };
        Relationships: [{ foreignKeyName: "profiles_tenant_id_fkey"; columns: ["tenant_id"]; referencedRelation: "tenants"; referencedColumns: ["id"] }];
      };
      students: {
        Row: { id: string; tenant_id: string; name: string; nickname: string | null; parent_name: string; parent_email: string; parent_relation: string | null; parent_phone: string | null; phone: string | null; student_phone: string | null; emergency_phone: string | null; school: string | null; grade: string | null; subject: string; fee_type: string; fee_amount: number; fee_due_day: number; status: string; birth_date: string | null; gender: string | null; address: string | null; learning_goal: string | null; learning_notes: string | null; start_date: string | null; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; name: string; nickname?: string | null; parent_name: string; parent_email: string; parent_relation?: string | null; parent_phone?: string | null; phone?: string | null; student_phone?: string | null; emergency_phone?: string | null; school?: string | null; grade?: string | null; subject: string; fee_type?: string; fee_amount?: number; fee_due_day?: number; status?: string; birth_date?: string | null; gender?: string | null; address?: string | null; learning_goal?: string | null; learning_notes?: string | null; start_date?: string | null; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; name?: string; nickname?: string | null; parent_name?: string; parent_email?: string; parent_relation?: string | null; parent_phone?: string | null; phone?: string | null; student_phone?: string | null; emergency_phone?: string | null; school?: string | null; grade?: string | null; subject?: string; fee_type?: string; fee_amount?: number; fee_due_day?: number; status?: string; birth_date?: string | null; gender?: string | null; address?: string | null; learning_goal?: string | null; learning_notes?: string | null; start_date?: string | null; created_at?: string | null; updated_at?: string | null };
        Relationships: [{ foreignKeyName: "students_tenant_id_fkey"; columns: ["tenant_id"]; referencedRelation: "tenants"; referencedColumns: ["id"] }];
      };
      classes: {
        Row: { id: string; tenant_id: string; name: string; class_type: string; subject: string; default_fee_type: string; default_fee_amount: number; duration_minutes: number; location: string | null; status: string; pricing_profile_id: string | null; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; name: string; class_type: string; subject: string; default_fee_type?: string; default_fee_amount?: number; duration_minutes?: number; location?: string | null; status?: string; pricing_profile_id?: string | null; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; name?: string; class_type?: string; subject?: string; default_fee_type?: string; default_fee_amount?: number; duration_minutes?: number; location?: string | null; status?: string; pricing_profile_id?: string | null; created_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      class_members: {
        Row: { id: string; tenant_id: string; class_id: string; student_id: string; fee_type: string; fee_amount: number; status: string; joined_at: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; class_id: string; student_id: string; fee_type?: string; fee_amount?: number; status?: string; joined_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; class_id?: string; student_id?: string; fee_type?: string; fee_amount?: number; status?: string; joined_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      sessions: {
        Row: { id: string; tenant_id: string; class_id: string | null; student_id: string | null; schedule_rule_id: string | null; start_at: string; duration_minutes: number; subject: string; location: string | null; status: string; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; class_id?: string | null; student_id?: string | null; schedule_rule_id?: string | null; start_at: string; duration_minutes?: number; subject: string; location?: string | null; status?: string; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; class_id?: string | null; student_id?: string | null; schedule_rule_id?: string | null; start_at?: string; duration_minutes?: number; subject?: string; location?: string | null; status?: string; created_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      attendance: {
        Row: { id: string; tenant_id: string; session_id: string; student_id: string; status: string; billable: boolean; note: string | null; present_count: number | null; pricing_tier_id: string | null; unit_price: number; charge_amount: number; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; session_id: string; student_id: string; status?: string; billable?: boolean; note?: string | null; present_count?: number | null; pricing_tier_id?: string | null; unit_price?: number; charge_amount?: number; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; session_id?: string; student_id?: string; status?: string; billable?: boolean; note?: string | null; present_count?: number | null; pricing_tier_id?: string | null; unit_price?: number; charge_amount?: number; created_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      reports: {
        Row: { id: string; tenant_id: string; session_id: string; student_id: string; class_id: string | null; material: string; progress: string; homework: string | null; score: number | null; teacher_note: string | null; published_at: string | null; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; session_id: string; student_id: string; class_id?: string | null; material: string; progress: string; homework?: string | null; score?: number | null; teacher_note?: string | null; published_at?: string | null; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; session_id?: string; student_id?: string; class_id?: string | null; material?: string; progress?: string; homework?: string | null; score?: number | null; teacher_note?: string | null; published_at?: string | null; created_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      fees: {
        Row: { id: string; tenant_id: string; student_id: string; period: string; description: string; amount: number; due_date: string; status: string; paid_at: string | null; payment_note: string | null; source_type: string | null; source_id: string | null; quantity: number | null; unit_amount: number | null; calculation_status: string | null; invoice_no: string | null; invoice_file_id: string | null; receipt_no: string | null; receipt_file_id: string | null; created_at: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; student_id: string; period: string; description: string; amount?: number; due_date: string; status?: string; paid_at?: string | null; payment_note?: string | null; source_type?: string | null; source_id?: string | null; quantity?: number | null; unit_amount?: number | null; calculation_status?: string | null; invoice_no?: string | null; invoice_file_id?: string | null; receipt_no?: string | null; receipt_file_id?: string | null; created_at?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; student_id?: string; period?: string; description?: string; amount?: number; due_date?: string; status?: string; paid_at?: string | null; payment_note?: string | null; source_type?: string | null; source_id?: string | null; quantity?: number | null; unit_amount?: number | null; calculation_status?: string | null; invoice_no?: string | null; invoice_file_id?: string | null; receipt_no?: string | null; receipt_file_id?: string | null; created_at?: string | null; updated_at?: string | null };
        Relationships: [];
      };
      teacher_settings: {
        Row: { id: string; tenant_id: string; teacher_name: string; workspace_name: string; phone: string | null; payment_instructions: string | null; default_fee_type: string | null; default_fee_amount: number | null; default_due_day: number | null; whatsapp_template: string | null; form_enabled: boolean | null; form_token: string | null; updated_at: string | null };
        Insert: { id?: string; tenant_id: string; teacher_name: string; workspace_name: string; phone?: string | null; payment_instructions?: string | null; default_fee_type?: string | null; default_fee_amount?: number | null; default_due_day?: number | null; whatsapp_template?: string | null; form_enabled?: boolean | null; form_token?: string | null; updated_at?: string | null };
        Update: { id?: string; tenant_id?: string; teacher_name?: string; workspace_name?: string; phone?: string | null; payment_instructions?: string | null; default_fee_type?: string | null; default_fee_amount?: number | null; default_due_day?: number | null; whatsapp_template?: string | null; form_enabled?: boolean | null; form_token?: string | null; updated_at?: string | null };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: { get_my_tenant_id: { Args: Record<string, never>; Returns: string }; is_admin: { Args: Record<string, never>; Returns: boolean } };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
