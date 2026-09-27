// Generated from the live Supabase schema via `supabase gen types typescript`
// (project global-tailor). Regenerate after schema changes; do not edit by hand.

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
      customers: {
        Row: {
          created_at: string
          default_address_id: string | null
          default_measurement_profile_id: string | null
          display_name: string | null
          phone: string | null
          preferences: Json | null
          shipping_addresses: Json
          stripe_customer_id: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          default_address_id?: string | null
          default_measurement_profile_id?: string | null
          display_name?: string | null
          phone?: string | null
          preferences?: Json | null
          shipping_addresses?: Json
          stripe_customer_id?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          default_address_id?: string | null
          default_measurement_profile_id?: string | null
          display_name?: string | null
          phone?: string | null
          preferences?: Json | null
          shipping_addresses?: Json
          stripe_customer_id?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "customers_default_measurement_profile_fk"
            columns: ["default_measurement_profile_id"]
            isOneToOne: false
            referencedRelation: "measurement_profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "customers_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      fabrics: {
        Row: {
          ai_attributes: Json | null
          availability: string | null
          color: string | null
          composition: string | null
          created_at: string
          currency: string
          id: string
          name: string
          pattern: string | null
          price_amount: number
          price_tier: string | null
          source_media_id: string | null
          tailor_id: string
          tile_media_id: string | null
          updated_at: string
          weight_gsm: number | null
        }
        Insert: {
          ai_attributes?: Json | null
          availability?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          currency?: string
          id?: string
          name: string
          pattern?: string | null
          price_amount?: number
          price_tier?: string | null
          source_media_id?: string | null
          tailor_id: string
          tile_media_id?: string | null
          updated_at?: string
          weight_gsm?: number | null
        }
        Update: {
          ai_attributes?: Json | null
          availability?: string | null
          color?: string | null
          composition?: string | null
          created_at?: string
          currency?: string
          id?: string
          name?: string
          pattern?: string | null
          price_amount?: number
          price_tier?: string | null
          source_media_id?: string | null
          tailor_id?: string
          tile_media_id?: string | null
          updated_at?: string
          weight_gsm?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fabrics_source_media_id_fkey"
            columns: ["source_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fabrics_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "fabrics_tile_media_id_fkey"
            columns: ["tile_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      garment_fabric_pricing: {
        Row: {
          fabric_id: string
          garment_type_id: string
          id: string
          price_amount: number | null
          tailor_id: string
          yardage_factor: number | null
        }
        Insert: {
          fabric_id: string
          garment_type_id: string
          id?: string
          price_amount?: number | null
          tailor_id: string
          yardage_factor?: number | null
        }
        Update: {
          fabric_id?: string
          garment_type_id?: string
          id?: string
          price_amount?: number | null
          tailor_id?: string
          yardage_factor?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "garment_fabric_pricing_fabric_id_fkey"
            columns: ["fabric_id"]
            isOneToOne: false
            referencedRelation: "fabrics"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garment_fabric_pricing_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "garment_fabric_pricing_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      garment_types: {
        Row: {
          created_at: string
          id: string
          is_standard: boolean
          key: string
          name: string
          owner_tailor_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_standard?: boolean
          key: string
          name: string
          owner_tailor_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          is_standard?: boolean
          key?: string
          name?: string
          owner_tailor_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "garment_types_owner_tailor_id_fkey"
            columns: ["owner_tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      measurement_fields: {
        Row: {
          garment_type_id: string
          id: string
          key: string
          label: string
          owner_tailor_id: string | null
          required: boolean
          sort: number
          unit: string
        }
        Insert: {
          garment_type_id: string
          id?: string
          key: string
          label: string
          owner_tailor_id?: string | null
          required?: boolean
          sort?: number
          unit?: string
        }
        Update: {
          garment_type_id?: string
          id?: string
          key?: string
          label?: string
          owner_tailor_id?: string | null
          required?: boolean
          sort?: number
          unit?: string
        }
        Relationships: [
          {
            foreignKeyName: "measurement_fields_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_fields_owner_tailor_id_fkey"
            columns: ["owner_tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      measurement_profiles: {
        Row: {
          created_at: string
          customer_id: string
          garment_type_id: string | null
          id: string
          label: string | null
          last_confirmed_at: string | null
          source: Database["public"]["Enums"]["measurement_source"]
          source_media_id: string | null
          updated_at: string
          values: Json
        }
        Insert: {
          created_at?: string
          customer_id: string
          garment_type_id?: string | null
          id?: string
          label?: string | null
          last_confirmed_at?: string | null
          source?: Database["public"]["Enums"]["measurement_source"]
          source_media_id?: string | null
          updated_at?: string
          values?: Json
        }
        Update: {
          created_at?: string
          customer_id?: string
          garment_type_id?: string | null
          id?: string
          label?: string | null
          last_confirmed_at?: string | null
          source?: Database["public"]["Enums"]["measurement_source"]
          source_media_id?: string | null
          updated_at?: string
          values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "measurement_profiles_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "measurement_profiles_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "measurement_profiles_source_media_id_fkey"
            columns: ["source_media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
        ]
      }
      media: {
        Row: {
          ai_status: Database["public"]["Enums"]["ai_status"]
          alt_text: string | null
          created_at: string
          height: number | null
          id: string
          kind: Database["public"]["Enums"]["media_kind"]
          mime_type: string | null
          owner_user_id: string
          public_url: string | null
          storage_path: string | null
          width: number | null
        }
        Insert: {
          ai_status?: Database["public"]["Enums"]["ai_status"]
          alt_text?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          owner_user_id: string
          public_url?: string | null
          storage_path?: string | null
          width?: number | null
        }
        Update: {
          ai_status?: Database["public"]["Enums"]["ai_status"]
          alt_text?: string | null
          created_at?: string
          height?: number | null
          id?: string
          kind?: Database["public"]["Enums"]["media_kind"]
          mime_type?: string | null
          owner_user_id?: string
          public_url?: string | null
          storage_path?: string | null
          width?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "media_owner_user_id_fkey"
            columns: ["owner_user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          body: string
          created_at: string
          from_user: string
          id: string
          media_ids: string[]
          order_id: string | null
          read_at: string | null
          to_user: string
        }
        Insert: {
          body: string
          created_at?: string
          from_user: string
          id?: string
          media_ids?: string[]
          order_id?: string | null
          read_at?: string | null
          to_user: string
        }
        Update: {
          body?: string
          created_at?: string
          from_user?: string
          id?: string
          media_ids?: string[]
          order_id?: string | null
          read_at?: string | null
          to_user?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_from_user_fkey"
            columns: ["from_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_to_user_fkey"
            columns: ["to_user"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      option_groups: {
        Row: {
          garment_type_id: string
          id: string
          multi_select: boolean
          name: string
          required: boolean
          sort: number
          tailor_id: string
        }
        Insert: {
          garment_type_id: string
          id?: string
          multi_select?: boolean
          name: string
          required?: boolean
          sort?: number
          tailor_id: string
        }
        Update: {
          garment_type_id?: string
          id?: string
          multi_select?: boolean
          name?: string
          required?: boolean
          sort?: number
          tailor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "option_groups_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_groups_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      option_values: {
        Row: {
          id: string
          media_id: string | null
          name: string
          option_group_id: string
          price_modifier: number
          sort: number
        }
        Insert: {
          id?: string
          media_id?: string | null
          name: string
          option_group_id: string
          price_modifier?: number
          sort?: number
        }
        Update: {
          id?: string
          media_id?: string | null
          name?: string
          option_group_id?: string
          price_modifier?: number
          sort?: number
        }
        Relationships: [
          {
            foreignKeyName: "option_values_media_id_fkey"
            columns: ["media_id"]
            isOneToOne: false
            referencedRelation: "media"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "option_values_option_group_id_fkey"
            columns: ["option_group_id"]
            isOneToOne: false
            referencedRelation: "option_groups"
            referencedColumns: ["id"]
          },
        ]
      }
      order_events: {
        Row: {
          created_at: string
          id: string
          order_id: string
          payload: Json | null
          type: string
        }
        Insert: {
          created_at?: string
          id?: string
          order_id: string
          payload?: Json | null
          type: string
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string
          payload?: Json | null
          type?: string
        }
        Relationships: [
          {
            foreignKeyName: "order_events_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      order_measurement_reviews: {
        Row: {
          created_at: string
          id: string
          note: string | null
          order_id: string
          status: Database["public"]["Enums"]["review_status"]
          suggested_values: Json
        }
        Insert: {
          created_at?: string
          id?: string
          note?: string | null
          order_id: string
          status?: Database["public"]["Enums"]["review_status"]
          suggested_values?: Json
        }
        Update: {
          created_at?: string
          id?: string
          note?: string | null
          order_id?: string
          status?: Database["public"]["Enums"]["review_status"]
          suggested_values?: Json
        }
        Relationships: [
          {
            foreignKeyName: "order_measurement_reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          currency: string
          customer_id: string
          fabric_selections: Json
          garment_type_id: string | null
          id: string
          is_test: boolean
          measurement_snapshot: Json
          option_selections: Json
          platform_fee: number
          shipping_address: Json | null
          shipping_amount: number
          shipping_option_snapshot: Json | null
          status: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id: string | null
          subtotal: number
          tailor_id: string
          tax_amount: number
          total: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          currency?: string
          customer_id: string
          fabric_selections?: Json
          garment_type_id?: string | null
          id?: string
          is_test?: boolean
          measurement_snapshot?: Json
          option_selections?: Json
          platform_fee?: number
          shipping_address?: Json | null
          shipping_amount?: number
          shipping_option_snapshot?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tailor_id: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          currency?: string
          customer_id?: string
          fabric_selections?: Json
          garment_type_id?: string | null
          id?: string
          is_test?: boolean
          measurement_snapshot?: Json
          option_selections?: Json
          platform_fee?: number
          shipping_address?: Json | null
          shipping_amount?: number
          shipping_option_snapshot?: Json | null
          status?: Database["public"]["Enums"]["order_status"]
          stripe_payment_intent_id?: string | null
          subtotal?: number
          tailor_id?: string
          tax_amount?: number
          total?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "orders_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      reviews: {
        Row: {
          body: string | null
          created_at: string
          customer_id: string
          id: string
          order_id: string
          rating: number
          tailor_id: string
        }
        Insert: {
          body?: string | null
          created_at?: string
          customer_id: string
          id?: string
          order_id: string
          rating: number
          tailor_id: string
        }
        Update: {
          body?: string | null
          created_at?: string
          customer_id?: string
          id?: string
          order_id?: string
          rating?: number
          tailor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_customer_id_fkey"
            columns: ["customer_id"]
            isOneToOne: false
            referencedRelation: "customers"
            referencedColumns: ["user_id"]
          },
          {
            foreignKeyName: "reviews_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: true
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      samples: {
        Row: {
          created_at: string
          description: string | null
          garment_type_id: string | null
          id: string
          media_ids: string[]
          tailor_id: string
          title: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          garment_type_id?: string | null
          id?: string
          media_ids?: string[]
          tailor_id: string
          title: string
        }
        Update: {
          created_at?: string
          description?: string | null
          garment_type_id?: string | null
          id?: string
          media_ids?: string[]
          tailor_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "samples_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "samples_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shipments: {
        Row: {
          carrier: string | null
          created_at: string
          delivered_at: string | null
          est_delivery_date: string | null
          id: string
          order_id: string
          shipped_at: string | null
          status: string | null
          tracking_number: string | null
          tracking_url: string | null
        }
        Insert: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          est_delivery_date?: string | null
          id?: string
          order_id: string
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Update: {
          carrier?: string | null
          created_at?: string
          delivered_at?: string | null
          est_delivery_date?: string | null
          id?: string
          order_id?: string
          shipped_at?: string | null
          status?: string | null
          tracking_number?: string | null
          tracking_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "shipments_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
        ]
      }
      shipping_options: {
        Row: {
          active: boolean
          additional_item_price: number | null
          base_price: number
          carrier: string | null
          currency: string
          destination_countries: string[]
          id: string
          label: string
          max_days: number | null
          min_days: number | null
          per_item_type_pricing: Json | null
          tailor_id: string
        }
        Insert: {
          active?: boolean
          additional_item_price?: number | null
          base_price?: number
          carrier?: string | null
          currency?: string
          destination_countries?: string[]
          id?: string
          label: string
          max_days?: number | null
          min_days?: number | null
          per_item_type_pricing?: Json | null
          tailor_id: string
        }
        Update: {
          active?: boolean
          additional_item_price?: number | null
          base_price?: number
          carrier?: string | null
          currency?: string
          destination_countries?: string[]
          id?: string
          label?: string
          max_days?: number | null
          min_days?: number | null
          per_item_type_pricing?: Json | null
          tailor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shipping_options_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      shop_garment_types: {
        Row: {
          active: boolean
          base_price: number
          currency: string
          garment_type_id: string
          tailor_id: string
        }
        Insert: {
          active?: boolean
          base_price?: number
          currency?: string
          garment_type_id: string
          tailor_id: string
        }
        Update: {
          active?: boolean
          base_price?: number
          currency?: string
          garment_type_id?: string
          tailor_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "shop_garment_types_garment_type_id_fkey"
            columns: ["garment_type_id"]
            isOneToOne: false
            referencedRelation: "garment_types"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "shop_garment_types_tailor_id_fkey"
            columns: ["tailor_id"]
            isOneToOne: false
            referencedRelation: "tailor_profiles"
            referencedColumns: ["user_id"]
          },
        ]
      }
      tailor_profiles: {
        Row: {
          bio: string | null
          created_at: string
          languages: string[]
          location_city: string | null
          location_country: string | null
          rating_avg: number | null
          shop_name: string
          slug: string
          stripe_account_id: string | null
          turnaround_days: number | null
          updated_at: string
          user_id: string
          verification_status: Database["public"]["Enums"]["verification_status"]
        }
        Insert: {
          bio?: string | null
          created_at?: string
          languages?: string[]
          location_city?: string | null
          location_country?: string | null
          rating_avg?: number | null
          shop_name: string
          slug: string
          stripe_account_id?: string | null
          turnaround_days?: number | null
          updated_at?: string
          user_id: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Update: {
          bio?: string | null
          created_at?: string
          languages?: string[]
          location_city?: string | null
          location_country?: string | null
          rating_avg?: number | null
          shop_name?: string
          slug?: string
          stripe_account_id?: string | null
          turnaround_days?: number | null
          updated_at?: string
          user_id?: string
          verification_status?: Database["public"]["Enums"]["verification_status"]
        }
        Relationships: [
          {
            foreignKeyName: "tailor_profiles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      user_roles: {
        Row: {
          granted_at: string
          granted_by: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Insert: {
          granted_at?: string
          granted_by?: string | null
          role: Database["public"]["Enums"]["user_role"]
          user_id: string
        }
        Update: {
          granted_at?: string
          granted_by?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_roles_granted_by_fkey"
            columns: ["granted_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_roles_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          country: string | null
          created_at: string
          email: string | null
          id: string
          locale: string | null
          name: string | null
        }
        Insert: {
          country?: string | null
          created_at?: string
          email?: string | null
          id: string
          locale?: string | null
          name?: string | null
        }
        Update: {
          country?: string | null
          created_at?: string
          email?: string | null
          id?: string
          locale?: string | null
          name?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      has_role: {
        Args: { _role: Database["public"]["Enums"]["user_role"] }
        Returns: boolean
      }
      is_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      ai_status: "none" | "pending" | "done" | "failed"
      measurement_source: "manual" | "garment" | "video" | "ar"
      media_kind:
        | "fabric"
        | "garment"
        | "sample"
        | "measurement_video"
        | "evidence"
        | "other"
      order_status:
        | "draft"
        | "placed"
        | "accepted"
        | "in_production"
        | "shipped"
        | "delivered"
        | "fit_confirmed"
        | "cancelled"
      review_status: "pending" | "customer_accepted" | "customer_declined"
      user_role: "customer" | "tailor" | "admin" | "finisher"
      verification_status: "unverified" | "pending" | "verified" | "rejected"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}
