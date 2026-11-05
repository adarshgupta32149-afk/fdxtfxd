// Generated from the live Supabase schema (project baiiqrpizllmkufvltrn).
// Regenerate after changing the database instead of editing by hand.
// Trimmed to the schema types; the generic Tables<>/TablesInsert<> helpers are omitted.

export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: '14.18';
  };
  public: {
    Tables: {
      leaderboard_entries: {
        Row: {
          board: string;
          created_at: string;
          id: string;
          reviewed_at: string | null;
          status: string;
          user_id: string;
          value: number;
          video_path: string | null;
        };
        Insert: {
          board: string;
          created_at?: string;
          id?: string;
          reviewed_at?: string | null;
          status?: string;
          user_id?: string;
          value: number;
          video_path?: string | null;
        };
        Update: {
          board?: string;
          created_at?: string;
          id?: string;
          reviewed_at?: string | null;
          status?: string;
          user_id?: string;
          value?: number;
          video_path?: string | null;
        };
        Relationships: [];
      };
      profiles: {
        Row: {
          bodyweight_kg: number | null;
          created_at: string;
          display_name: string | null;
          id: string;
          is_pro: boolean;
          trial_started_at: string;
          updated_at: string;
        };
        Insert: {
          bodyweight_kg?: number | null;
          created_at?: string;
          display_name?: string | null;
          id: string;
          is_pro?: boolean;
          trial_started_at?: string;
          updated_at?: string;
        };
        Update: {
          bodyweight_kg?: number | null;
          created_at?: string;
          display_name?: string | null;
          id?: string;
          is_pro?: boolean;
          trial_started_at?: string;
          updated_at?: string;
        };
        Relationships: [];
      };
      skill_steps: {
        Row: { done_at: string; step_id: string; user_id: string };
        Insert: { done_at?: string; step_id: string; user_id?: string };
        Update: { done_at?: string; step_id?: string; user_id?: string };
        Relationships: [];
      };
      workouts: {
        Row: { created_at: string; date: string; entries: Json; id: string; note: string | null; user_id: string };
        Insert: { created_at?: string; date: string; entries: Json; id: string; note?: string | null; user_id?: string };
        Update: { created_at?: string; date?: string; entries?: Json; id?: string; note?: string | null; user_id?: string };
        Relationships: [];
      };
    };
    Views: { [_ in never]: never };
    Functions: {
      claim_earlier_trial_start: { Args: { started_at: string }; Returns: string };
      delete_my_account: { Args: never; Returns: undefined };
      get_leaderboard: {
        Args: { board_name: string; max_rows?: number };
        Returns: { achieved_at: string; display_name: string; rank: number; value: number }[];
      };
    };
    Enums: { [_ in never]: never };
    CompositeTypes: { [_ in never]: never };
  };
};
