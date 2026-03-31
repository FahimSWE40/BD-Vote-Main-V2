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
    PostgrestVersion: "14.4"
  }
  public: {
    Tables: {
      audit_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string | null
          entity_type: string
          id: string
          ip_address: string | null
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string | null
          entity_type?: string
          id?: string
          ip_address?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      candidates: {
        Row: {
          constituency_id: string | null
          created_at: string
          full_name: string
          id: string
          is_active: boolean
          manifesto: string | null
          party: string | null
          photo_url: string | null
          position: string
          updated_at: string
          vote_count: number
        }
        Insert: {
          constituency_id?: string | null
          created_at?: string
          full_name: string
          id?: string
          is_active?: boolean
          manifesto?: string | null
          party?: string | null
          photo_url?: string | null
          position?: string
          updated_at?: string
          vote_count?: number
        }
        Update: {
          constituency_id?: string | null
          created_at?: string
          full_name?: string
          id?: string
          is_active?: boolean
          manifesto?: string | null
          party?: string | null
          photo_url?: string | null
          position?: string
          updated_at?: string
          vote_count?: number
        }
        Relationships: [
          {
            foreignKeyName: "candidates_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      constituencies: {
        Row: {
          constituency_code: string
          constituency_name: string
          created_at: string
          district: string
          division: string
          id: string
        }
        Insert: {
          constituency_code: string
          constituency_name: string
          created_at?: string
          district: string
          division: string
          id?: string
        }
        Update: {
          constituency_code?: string
          constituency_name?: string
          created_at?: string
          district?: string
          division?: string
          id?: string
        }
        Relationships: []
      }
      election_config: {
        Row: {
          created_at: string
          created_by: string | null
          election_name: string
          end_time: string
          id: string
          is_active: boolean
          start_time: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          election_name: string
          end_time: string
          id?: string
          is_active?: boolean
          start_time: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          election_name?: string
          end_time?: string
          id?: string
          is_active?: boolean
          start_time?: string
          updated_at?: string
        }
        Relationships: []
      }
      incidents: {
        Row: {
          constituency_id: string | null
          created_at: string
          description: string
          id: string
          reported_by: string
          severity: string
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          constituency_id?: string | null
          created_at?: string
          description: string
          id?: string
          reported_by: string
          severity?: string
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          constituency_id?: string | null
          created_at?: string
          description?: string
          id?: string
          reported_by?: string
          severity?: string
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "incidents_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      voters: {
        Row: {
          constituency_id: string | null
          created_at: string
          date_of_birth: string | null
          department: string | null
          face_template: string | null
          full_name: string
          has_voted: boolean
          id: string
          is_verified: boolean
          nid_number: string | null
          photo_url: string | null
          session_year: string | null
          voter_id: string
        }
        Insert: {
          constituency_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          face_template?: string | null
          full_name: string
          has_voted?: boolean
          id?: string
          is_verified?: boolean
          nid_number?: string | null
          photo_url?: string | null
          session_year?: string | null
          voter_id: string
        }
        Update: {
          constituency_id?: string | null
          created_at?: string
          date_of_birth?: string | null
          department?: string | null
          face_template?: string | null
          full_name?: string
          has_voted?: boolean
          id?: string
          is_verified?: boolean
          nid_number?: string | null
          photo_url?: string | null
          session_year?: string | null
          voter_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "voters_constituency_id_fkey"
            columns: ["constituency_id"]
            isOneToOne: false
            referencedRelation: "constituencies"
            referencedColumns: ["id"]
          },
        ]
      }
      votes: {
        Row: {
          candidate_id: string
          created_at: string
          encrypted_vote: string | null
          id: string
          status: string
          tx_hash: string | null
          voter_id: string
          voter_id_hash: string | null
        }
        Insert: {
          candidate_id: string
          created_at?: string
          encrypted_vote?: string | null
          id?: string
          status?: string
          tx_hash?: string | null
          voter_id: string
          voter_id_hash?: string | null
        }
        Update: {
          candidate_id?: string
          created_at?: string
          encrypted_vote?: string | null
          id?: string
          status?: string
          tx_hash?: string | null
          voter_id?: string
          voter_id_hash?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "votes_candidate_id_fkey"
            columns: ["candidate_id"]
            isOneToOne: false
            referencedRelation: "candidates"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "votes_voter_id_fkey"
            columns: ["voter_id"]
            isOneToOne: true
            referencedRelation: "voters"
            referencedColumns: ["id"]
          },
        ]
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
      increment_vote_count: {
        Args: { p_candidate_id: string }
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
