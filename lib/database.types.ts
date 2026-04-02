export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[];

// This file mirrors the current provider/client schema in Supabase.
// Once the local CLI is authenticated, it can be regenerated from the linked project:
// `supabase gen types typescript --linked --schema public > lib/database.types.ts`

export type ProfileRole = "provider" | "client" | "admin";
export type ProviderMembershipRole = "owner" | "member";
export type AssignmentStatus = "active" | "inactive";
export type NoteThreadStatus = "open" | "closed";

export type PublicSchema = Database["public"];
export type PublicTableName = keyof PublicSchema["Tables"];
export type PublicViewName = keyof PublicSchema["Views"];

export type TableRow<T extends PublicTableName> = PublicSchema["Tables"][T]["Row"];
export type TableInsert<T extends PublicTableName> = PublicSchema["Tables"][T]["Insert"];
export type TableUpdate<T extends PublicTableName> = PublicSchema["Tables"][T]["Update"];
export type ViewRow<T extends PublicViewName> = PublicSchema["Views"][T]["Row"];

export type Database = {
  public: {
    Tables: {
      notes: {
        Row: {
          author_user_id: string;
          body: string;
          created_at: string;
          id: string;
          thread_id: string;
        };
        Insert: {
          author_user_id?: string;
          body: string;
          created_at?: string;
          id?: string;
          thread_id: string;
        };
        Update: {
          author_user_id?: string;
          body?: string;
          created_at?: string;
          id?: string;
          thread_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "notes_author_user_id_fkey";
            columns: ["author_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "notes_thread_id_fkey";
            columns: ["thread_id"];
            isOneToOne: false;
            referencedRelation: "note_threads";
            referencedColumns: ["id"];
          },
        ];
      };
      note_threads: {
        Row: {
          client_user_id: string;
          created_at: string;
          created_by_user_id: string;
          id: string;
          organization_id: string;
          status: NoteThreadStatus;
          subject: string | null;
        };
        Insert: {
          client_user_id: string;
          created_at?: string;
          created_by_user_id: string;
          id?: string;
          organization_id: string;
          status?: NoteThreadStatus;
          subject?: string | null;
        };
        Update: {
          client_user_id?: string;
          created_at?: string;
          created_by_user_id?: string;
          id?: string;
          organization_id?: string;
          status?: NoteThreadStatus;
          subject?: string | null;
        };
        Relationships: [
          {
            foreignKeyName: "note_threads_client_user_id_fkey";
            columns: ["client_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "note_threads_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "note_threads_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
        ];
      };
      organizations: {
        Row: {
          created_at: string;
          created_by_user_id: string;
          id: string;
          invite_code: string;
          name: string;
        };
        Insert: {
          created_at?: string;
          created_by_user_id: string;
          id?: string;
          invite_code: string;
          name: string;
        };
        Update: {
          created_at?: string;
          created_by_user_id?: string;
          id?: string;
          invite_code?: string;
          name?: string;
        };
        Relationships: [
          {
            foreignKeyName: "organizations_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      profiles: {
        Row: {
          created_at: string;
          name: string | null;
          role: ProfileRole;
          user_id: string;
        };
        Insert: {
          created_at?: string;
          name?: string | null;
          role: ProfileRole;
          user_id: string;
        };
        Update: {
          created_at?: string;
          name?: string | null;
          role?: ProfileRole;
          user_id?: string;
        };
        Relationships: [];
      };
      provider_client_assignments: {
        Row: {
          client_user_id: string;
          created_at: string;
          created_by_user_id: string;
          id: string;
          organization_id: string;
          provider_user_id: string;
          status: AssignmentStatus;
        };
        Insert: {
          client_user_id: string;
          created_at?: string;
          created_by_user_id: string;
          id?: string;
          organization_id: string;
          provider_user_id: string;
          status?: AssignmentStatus;
        };
        Update: {
          client_user_id?: string;
          created_at?: string;
          created_by_user_id?: string;
          id?: string;
          organization_id?: string;
          provider_user_id?: string;
          status?: AssignmentStatus;
        };
        Relationships: [
          {
            foreignKeyName: "provider_client_assignments_client_user_id_fkey";
            columns: ["client_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "provider_client_assignments_created_by_user_id_fkey";
            columns: ["created_by_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
          {
            foreignKeyName: "provider_client_assignments_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_client_assignments_provider_user_id_fkey";
            columns: ["provider_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
      provider_organizations: {
        Row: {
          created_at: string;
          membership_role: ProviderMembershipRole;
          organization_id: string;
          provider_user_id: string;
        };
        Insert: {
          created_at?: string;
          membership_role?: ProviderMembershipRole;
          organization_id: string;
          provider_user_id: string;
        };
        Update: {
          created_at?: string;
          membership_role?: ProviderMembershipRole;
          organization_id?: string;
          provider_user_id?: string;
        };
        Relationships: [
          {
            foreignKeyName: "provider_organizations_organization_id_fkey";
            columns: ["organization_id"];
            isOneToOne: false;
            referencedRelation: "organizations";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "provider_organizations_provider_user_id_fkey";
            columns: ["provider_user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["user_id"];
          },
        ];
      };
    };
    Views: {
      my_caseload: {
        Row: {
          assignment_id: string | null;
          client_name: string | null;
          client_user_id: string | null;
          created_at: string | null;
          organization_id: string | null;
          organization_name: string | null;
          provider_user_id: string | null;
          status: AssignmentStatus | null;
        };
        Relationships: [];
      };
    };
    Functions: {
      client_on_my_caseload: {
        Args: {
          p_client_user_id: string;
        };
        Returns: boolean;
      };
      create_note_thread: {
        Args: {
          p_client_user_id: string;
          p_organization_id?: string | null;
          p_subject?: string | null;
        };
        Returns: string;
      };
      create_organization: {
        Args: {
          p_name: string;
        };
        Returns: {
          invite_code: string;
          organization_id: string;
        }[];
      };
      generate_invite_code: {
        Args: Record<PropertyKey, never>;
        Returns: string;
      };
      is_client: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      is_provider: {
        Args: Record<PropertyKey, never>;
        Returns: boolean;
      };
      register_client: {
        Args: {
          p_invite_code: string;
          p_name: string;
        };
        Returns: {
          client_id: string;
          organization_id: string;
          thread_id: string;
        }[];
      };
      register_provider: {
        Args: {
          p_name: string;
        };
        Returns: {
          provider_id: string;
        }[];
      };
      thread_on_my_caseload: {
        Args: {
          p_thread_id: string;
        };
        Returns: boolean;
      };
    };
    Enums: {
      assignment_status: AssignmentStatus;
      note_thread_status: NoteThreadStatus;
      profile_role: ProfileRole;
      provider_membership_role: ProviderMembershipRole;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};
