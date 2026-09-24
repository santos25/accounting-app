// Regenerar con: npm run db:types  (supabase gen types typescript --linked)

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      clients: {
        Row: {
          active: boolean
          created_at: string
          document_number: string
          document_type: Database["public"]["Enums"]["document_type"]
          e_signature_enc: string | null
          email: string | null
          full_name: string
          id: string
          notes: string | null
          owner_id: string
          phone: string | null
          portal_password_enc: string | null
          updated_at: string
        }
        Insert: {
          active?: boolean
          created_at?: string
          document_number: string
          document_type?: Database["public"]["Enums"]["document_type"]
          e_signature_enc?: string | null
          email?: string | null
          full_name: string
          id?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          portal_password_enc?: string | null
          updated_at?: string
        }
        Update: {
          active?: boolean
          created_at?: string
          document_number?: string
          document_type?: Database["public"]["Enums"]["document_type"]
          e_signature_enc?: string | null
          email?: string | null
          full_name?: string
          id?: string
          notes?: string | null
          owner_id?: string
          phone?: string | null
          portal_password_enc?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      declarations: {
        Row: {
          amount_paid: number
          client_id: string
          created_at: string
          due_date: string
          fee: number
          filed_at: string | null
          form_number: string | null
          id: string
          notes: string | null
          owner_id: string
          payment_status: Database["public"]["Enums"]["payment_status"]
          status: Database["public"]["Enums"]["declaration_status"]
          tax_year: number
          updated_at: string
        }
        Insert: {
          amount_paid?: number
          client_id: string
          created_at?: string
          due_date: string
          fee?: number
          filed_at?: string | null
          form_number?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["declaration_status"]
          tax_year: number
          updated_at?: string
        }
        Update: {
          amount_paid?: number
          client_id?: string
          created_at?: string
          due_date?: string
          fee?: number
          filed_at?: string | null
          form_number?: string | null
          id?: string
          notes?: string | null
          owner_id?: string
          payment_status?: Database["public"]["Enums"]["payment_status"]
          status?: Database["public"]["Enums"]["declaration_status"]
          tax_year?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "declarations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      tax_calendar: {
        Row: {
          due_date: string
          last_digits: string
          tax_year: number
        }
        Insert: {
          due_date: string
          last_digits: string
          tax_year: number
        }
        Update: {
          due_date?: string
          last_digits?: string
          tax_year?: number
        }
        Relationships: []
      }
    }
    Views: {
      declarations_overview: {
        Row: {
          amount_paid: number | null
          balance: number | null
          client_id: string | null
          created_at: string | null
          days_left: number | null
          document_number: string | null
          document_type: Database["public"]["Enums"]["document_type"] | null
          due_date: string | null
          fee: number | null
          filed_at: string | null
          form_number: string | null
          full_name: string | null
          id: string | null
          notes: string | null
          owner_id: string | null
          payment_status: Database["public"]["Enums"]["payment_status"] | null
          status: Database["public"]["Enums"]["declaration_status"] | null
          tax_year: number | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "declarations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      declaration_status:
        | "PENDIENTE"
        | "DOCUMENTOS_RECIBIDOS"
        | "EN_PROCESO"
        | "PRESENTADA"
        | "NO_OBLIGADO"
      document_type: "CC" | "CE" | "NIT" | "PASAPORTE"
      payment_status: "PENDIENTE" | "PARCIAL" | "PAGADO"
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

export const Constants = {
  public: {
    Enums: {
      declaration_status: [
        "PENDIENTE",
        "DOCUMENTOS_RECIBIDOS",
        "EN_PROCESO",
        "PRESENTADA",
        "NO_OBLIGADO",
      ],
      document_type: ["CC", "CE", "NIT", "PASAPORTE"],
      payment_status: ["PENDIENTE", "PARCIAL", "PAGADO"],
    },
  },
} as const
