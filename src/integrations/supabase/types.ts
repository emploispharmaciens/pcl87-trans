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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      agent_cles: {
        Row: {
          actif: boolean
          cle_hash: string
          created_at: string
          id: string
          last_used_at: string | null
          nom: string
        }
        Insert: {
          actif?: boolean
          cle_hash: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          nom: string
        }
        Update: {
          actif?: boolean
          cle_hash?: string
          created_at?: string
          id?: string
          last_used_at?: string | null
          nom?: string
        }
        Relationships: []
      }
      agent_journal: {
        Row: {
          action: string
          agent: string
          apres: string | null
          avant: string | null
          champ: string | null
          created_at: string
          id: string
          ligne_id: string | null
          table_cible: string
        }
        Insert: {
          action: string
          agent: string
          apres?: string | null
          avant?: string | null
          champ?: string | null
          created_at?: string
          id?: string
          ligne_id?: string | null
          table_cible: string
        }
        Update: {
          action?: string
          agent?: string
          apres?: string | null
          avant?: string | null
          champ?: string | null
          created_at?: string
          id?: string
          ligne_id?: string | null
          table_cible?: string
        }
        Relationships: []
      }
      formation_blocs: {
        Row: {
          created_at: string
          etape: string
          id: string
          module: string
          ordre: number
          points: string[]
          titre: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          etape: string
          id?: string
          module?: string
          ordre?: number
          points?: string[]
          titre: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          etape?: string
          id?: string
          module?: string
          ordre?: number
          points?: string[]
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      categories: {
        Row: {
          color: string
          content_type_code: string
          created_at: string
          id: string
          label: string
          position: number
        }
        Insert: {
          color?: string
          content_type_code: string
          created_at?: string
          id?: string
          label: string
          position?: number
        }
        Update: {
          color?: string
          content_type_code?: string
          created_at?: string
          id?: string
          label?: string
          position?: number
        }
        Relationships: [
          {
            foreignKeyName: "categories_content_type_code_fkey"
            columns: ["content_type_code"]
            isOneToOne: false
            referencedRelation: "content_types"
            referencedColumns: ["code"]
          },
        ]
      }
      content_images: {
        Row: {
          content_id: string
          content_type_code: string
          created_at: string
          id: string
          position: number
          source: string | null
          storage_path: string
        }
        Insert: {
          content_id: string
          content_type_code: string
          created_at?: string
          id?: string
          position?: number
          source?: string | null
          storage_path: string
        }
        Update: {
          content_id?: string
          content_type_code?: string
          created_at?: string
          id?: string
          position?: number
          source?: string | null
          storage_path?: string
        }
        Relationships: [
          {
            foreignKeyName: "content_images_content_type_code_fkey"
            columns: ["content_type_code"]
            isOneToOne: false
            referencedRelation: "content_types"
            referencedColumns: ["code"]
          },
        ]
      }
      content_types: {
        Row: {
          code: string
          created_at: string
          id: string
          label: string
        }
        Insert: {
          code: string
          created_at?: string
          id?: string
          label: string
        }
        Update: {
          code?: string
          created_at?: string
          id?: string
          label?: string
        }
        Relationships: []
      }
      invites: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          expires_at: string | null
          grant_role: Database["public"]["Enums"]["app_role"]
          id: string
          is_active: boolean
          label: string | null
          max_uses: number | null
          password_hash: string
          updated_at: string
          uses: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          grant_role?: Database["public"]["Enums"]["app_role"]
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          password_hash: string
          updated_at?: string
          uses?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          expires_at?: string | null
          grant_role?: Database["public"]["Enums"]["app_role"]
          id?: string
          is_active?: boolean
          label?: string | null
          max_uses?: number | null
          password_hash?: string
          updated_at?: string
          uses?: number
        }
        Relationships: [
          {
            foreignKeyName: "invites_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pharma_fiche_jobs: {
        Row: {
          created_at: string
          created_count: number
          cron_token: string
          id: string
          last_error: string | null
          last_run_at: string | null
          lease_until: string | null
          pause_reason: string | null
          paused_at: string | null
          status: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          created_count?: number
          cron_token?: string
          id: string
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          created_count?: number
          cron_token?: string
          id?: string
          last_error?: string | null
          last_run_at?: string | null
          lease_until?: string | null
          pause_reason?: string | null
          paused_at?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      pharma_fiches: {
        Row: {
          content: Json
          created_at: string
          dci: string
          generated_by: string | null
          id: string
          model: string
          product_label: string
          product_slug: string
          updated_at: string
        }
        Insert: {
          content?: Json
          created_at?: string
          dci?: string
          generated_by?: string | null
          id?: string
          model?: string
          product_label: string
          product_slug: string
          updated_at?: string
        }
        Update: {
          content?: Json
          created_at?: string
          dci?: string
          generated_by?: string | null
          id?: string
          model?: string
          product_label?: string
          product_slug?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharma_fiches_generated_by_fkey"
            columns: ["generated_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      pharma_signalements: {
        Row: {
          author_id: string
          comment: string
          created_at: string
          id: string
          initials: string | null
          kind: string
          product_label: string
          site: string
        }
        Insert: {
          author_id: string
          comment?: string
          created_at?: string
          id?: string
          initials?: string | null
          kind: string
          product_label: string
          site: string
        }
        Update: {
          author_id?: string
          comment?: string
          created_at?: string
          id?: string
          initials?: string | null
          kind?: string
          product_label?: string
          site?: string
        }
        Relationships: [
          {
            foreignKeyName: "pharma_signalements_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          approval: Database["public"]["Enums"]["approval_status"]
          avatar_path: string | null
          created_at: string
          display_name: string | null
          email: string | null
          first_name: string | null
          google_photo_url: string | null
          id: string
          initials: string | null
          job_title: string | null
          last_login_at: string | null
          last_name: string | null
          photo_url: string | null
          refusal_reason: string | null
          service: string | null
          updated_at: string
        }
        Insert: {
          approval?: Database["public"]["Enums"]["approval_status"]
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          google_photo_url?: string | null
          id: string
          initials?: string | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          photo_url?: string | null
          refusal_reason?: string | null
          service?: string | null
          updated_at?: string
        }
        Update: {
          approval?: Database["public"]["Enums"]["approval_status"]
          avatar_path?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          first_name?: string | null
          google_photo_url?: string | null
          id?: string
          initials?: string | null
          job_title?: string | null
          last_login_at?: string | null
          last_name?: string | null
          photo_url?: string | null
          refusal_reason?: string | null
          service?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      protocoles: {
        Row: {
          created_at: string
          description: string | null
          id: string
          nom: string
          region: string | null
          slug: string | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          nom: string
          region?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          nom?: string
          region?: string | null
          slug?: string | null
          updated_at?: string | null
        }
        Relationships: []
      }
      suture_protocoles: {
        Row: {
          note: string | null
          protocole_id: string
          quantite: string | null
          suture_id: string
        }
        Insert: {
          note?: string | null
          protocole_id: string
          quantite?: string | null
          suture_id: string
        }
        Update: {
          note?: string | null
          protocole_id?: string
          quantite?: string | null
          suture_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suture_protocoles_protocole_id_fkey"
            columns: ["protocole_id"]
            isOneToOne: false
            referencedRelation: "protocoles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "suture_protocoles_suture_id_fkey"
            columns: ["suture_id"]
            isOneToOne: false
            referencedRelation: "sutures"
            referencedColumns: ["id"]
          },
        ]
      }
      sutures: {
        Row: {
          calibre: string | null
          composition: string | null
          couleur: string | null
          cours: string | null
          created_at: string | null
          famille: string | null
          id: string
          longueur: string | null
          marque: string | null
          note_qualite: string | null
          photo_url: string | null
          plans: string[] | null
          reference: string | null
          slug: string | null
          source: string | null
          statut: string | null
          type_aiguille: string | null
          updated_at: string | null
          usage_notes: string | null
        }
        Insert: {
          calibre?: string | null
          composition?: string | null
          couleur?: string | null
          cours?: string | null
          created_at?: string | null
          famille?: string | null
          id?: string
          longueur?: string | null
          marque?: string | null
          note_qualite?: string | null
          photo_url?: string | null
          plans?: string[] | null
          reference?: string | null
          slug?: string | null
          source?: string | null
          statut?: string | null
          type_aiguille?: string | null
          updated_at?: string | null
          usage_notes?: string | null
        }
        Update: {
          calibre?: string | null
          composition?: string | null
          couleur?: string | null
          cours?: string | null
          created_at?: string | null
          famille?: string | null
          id?: string
          longueur?: string | null
          marque?: string | null
          note_qualite?: string | null
          photo_url?: string | null
          plans?: string[] | null
          reference?: string | null
          slug?: string | null
          source?: string | null
          statut?: string | null
          type_aiguille?: string | null
          updated_at?: string | null
          usage_notes?: string | null
        }
        Relationships: []
      }
      taggings: {
        Row: {
          content_id: string
          content_type_code: string
          created_at: string
          id: string
          tag_id: string
        }
        Insert: {
          content_id: string
          content_type_code: string
          created_at?: string
          id?: string
          tag_id: string
        }
        Update: {
          content_id?: string
          content_type_code?: string
          created_at?: string
          id?: string
          tag_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "taggings_content_type_code_fkey"
            columns: ["content_type_code"]
            isOneToOne: false
            referencedRelation: "content_types"
            referencedColumns: ["code"]
          },
          {
            foreignKeyName: "taggings_tag_id_fkey"
            columns: ["tag_id"]
            isOneToOne: false
            referencedRelation: "tags"
            referencedColumns: ["id"]
          },
        ]
      }
      tags: {
        Row: {
          created_at: string
          id: string
          label: string
          slug: string
          type: Database["public"]["Enums"]["tag_type"]
        }
        Insert: {
          created_at?: string
          id?: string
          label: string
          slug: string
          type?: Database["public"]["Enums"]["tag_type"]
        }
        Update: {
          created_at?: string
          id?: string
          label?: string
          slug?: string
          type?: Database["public"]["Enums"]["tag_type"]
        }
        Relationships: []
      }
      transmissions: {
        Row: {
          author_id: string
          category_id: string | null
          content_html: string
          content_text: string
          created_at: string
          id: string
          is_priority: boolean
          status: Database["public"]["Enums"]["transmission_status"]
          title: string
          type: Database["public"]["Enums"]["transmission_type"]
          updated_at: string
        }
        Insert: {
          author_id: string
          category_id?: string | null
          content_html: string
          content_text?: string
          created_at?: string
          id?: string
          is_priority?: boolean
          status?: Database["public"]["Enums"]["transmission_status"]
          title: string
          type?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
        }
        Update: {
          author_id?: string
          category_id?: string | null
          content_html?: string
          content_text?: string
          created_at?: string
          id?: string
          is_priority?: boolean
          status?: Database["public"]["Enums"]["transmission_status"]
          title?: string
          type?: Database["public"]["Enums"]["transmission_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "transmissions_author_id_fkey"
            columns: ["author_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "transmissions_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "categories"
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      app_role: "membre" | "moderateur" | "admin"
      approval_status: "en_attente" | "approuve" | "refuse" | "desactive"
      tag_type:
        | "libre"
        | "fonction"
        | "anatomie"
        | "intervention"
        | "materiel"
        | "personne"
        | "marque"
      transmission_status: "ouvert" | "archive" | "supprime"
      transmission_type: "libre" | "essentiel"
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
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
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
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
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
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
      app_role: ["membre", "moderateur", "admin"],
      approval_status: ["en_attente", "approuve", "refuse", "desactive"],
      tag_type: [
        "libre",
        "fonction",
        "anatomie",
        "intervention",
        "materiel",
        "personne",
        "marque",
      ],
      transmission_status: ["ouvert", "archive", "supprime"],
      transmission_type: ["libre", "essentiel"],
    },
  },
} as const
