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
      clients: {
        Row: {
          adresse: string | null
          created_at: string
          email: string | null
          id: string
          nom: string
          notes: string | null
          telephone: string | null
          updated_at: string
        }
        Insert: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom: string
          notes?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Update: {
          adresse?: string | null
          created_at?: string
          email?: string | null
          id?: string
          nom?: string
          notes?: string | null
          telephone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      commandes: {
        Row: {
          client_id: string | null
          created_at: string
          date_commande: string
          date_livraison: string | null
          description: string | null
          id: string
          notes: string | null
          prix_total: number
          statut: string
          titre: string
          type: string
          updated_at: string
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_commande?: string
          date_livraison?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          prix_total?: number
          statut?: string
          titre: string
          type?: string
          updated_at?: string
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_commande?: string
          date_livraison?: string | null
          description?: string | null
          id?: string
          notes?: string | null
          prix_total?: number
          statut?: string
          titre?: string
          type?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "commandes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      depenses: {
        Row: {
          categorie: string
          created_at: string
          date_depense: string
          description: string
          id: string
          montant: number
          notes: string | null
          source: string
        }
        Insert: {
          categorie?: string
          created_at?: string
          date_depense?: string
          description: string
          id?: string
          montant: number
          notes?: string | null
          source?: string
        }
        Update: {
          categorie?: string
          created_at?: string
          date_depense?: string
          description?: string
          id?: string
          montant?: number
          notes?: string | null
          source?: string
        }
        Relationships: []
      }
      materiaux: {
        Row: {
          created_at: string
          fournisseur: string | null
          id: string
          nom: string
          notes: string | null
          prix_unitaire: number
          quantite: number
          seuil_alerte: number
          unite: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          fournisseur?: string | null
          id?: string
          nom: string
          notes?: string | null
          prix_unitaire?: number
          quantite?: number
          seuil_alerte?: number
          unite?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          fournisseur?: string | null
          id?: string
          nom?: string
          notes?: string | null
          prix_unitaire?: number
          quantite?: number
          seuil_alerte?: number
          unite?: string
          updated_at?: string
        }
        Relationships: []
      }
      notes: {
        Row: {
          contenu: string | null
          couleur: string
          created_at: string
          id: string
          titre: string
          updated_at: string
        }
        Insert: {
          contenu?: string | null
          couleur?: string
          created_at?: string
          id?: string
          titre: string
          updated_at?: string
        }
        Update: {
          contenu?: string | null
          couleur?: string
          created_at?: string
          id?: string
          titre?: string
          updated_at?: string
        }
        Relationships: []
      }
      paiements: {
        Row: {
          categorie: string
          commande_id: string | null
          created_at: string
          date_paiement: string
          id: string
          methode: string
          montant: number
          notes: string | null
          source: string
        }
        Insert: {
          categorie?: string
          commande_id?: string | null
          created_at?: string
          date_paiement?: string
          id?: string
          methode?: string
          montant: number
          notes?: string | null
          source?: string
        }
        Update: {
          categorie?: string
          commande_id?: string | null
          created_at?: string
          date_paiement?: string
          id?: string
          methode?: string
          montant?: number
          notes?: string | null
          source?: string
        }
        Relationships: [
          {
            foreignKeyName: "paiements_commande_id_fkey"
            columns: ["commande_id"]
            isOneToOne: false
            referencedRelation: "commandes"
            referencedColumns: ["id"]
          },
        ]
      }
      produits: {
        Row: {
          categorie: string
          code_barre: string | null
          created_at: string
          id: string
          marque: string | null
          nom: string
          notes: string | null
          prix_achat: number
          prix_vente: number
          seuil_alerte: number
          stock: number
          updated_at: string
        }
        Insert: {
          categorie?: string
          code_barre?: string | null
          created_at?: string
          id?: string
          marque?: string | null
          nom: string
          notes?: string | null
          prix_achat?: number
          prix_vente?: number
          seuil_alerte?: number
          stock?: number
          updated_at?: string
        }
        Update: {
          categorie?: string
          code_barre?: string | null
          created_at?: string
          id?: string
          marque?: string | null
          nom?: string
          notes?: string | null
          prix_achat?: number
          prix_vente?: number
          seuil_alerte?: number
          stock?: number
          updated_at?: string
        }
        Relationships: []
      }
      user_store: {
        Row: {
          created_at: string
          data: Json
          key: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          data?: Json
          key: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          data?: Json
          key?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      vente_items: {
        Row: {
          created_at: string
          id: string
          nom_produit: string
          prix_unitaire: number
          produit_id: string | null
          quantite: number
          vente_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nom_produit: string
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          vente_id: string
        }
        Update: {
          created_at?: string
          id?: string
          nom_produit?: string
          prix_unitaire?: number
          produit_id?: string | null
          quantite?: number
          vente_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vente_items_vente_id_fkey"
            columns: ["vente_id"]
            isOneToOne: false
            referencedRelation: "ventes"
            referencedColumns: ["id"]
          },
        ]
      }
      ventes: {
        Row: {
          client_id: string | null
          created_at: string
          date_vente: string
          id: string
          methode_paiement: string
          notes: string | null
          total: number
        }
        Insert: {
          client_id?: string | null
          created_at?: string
          date_vente?: string
          id?: string
          methode_paiement?: string
          notes?: string | null
          total?: number
        }
        Update: {
          client_id?: string | null
          created_at?: string
          date_vente?: string
          id?: string
          methode_paiement?: string
          notes?: string | null
          total?: number
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
    Enums: {},
  },
} as const
