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
    PostgrestVersion: "13.0.4"
  }
  public: {
    Tables: {
      abbonamenti: {
        Row: {
          client_id: string
          created_at: string
          created_by: string | null
          discount_percent: number | null
          id: string
          is_active: boolean
          notes: string | null
          pricing_mode: string
          sale_payment_method: string
          salon_id: string
          scope_service_ids: string[]
          total_paid: number
          total_treatments: number
          valid_from: string
          valid_until: string | null
        }
        Insert: {
          client_id: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          pricing_mode: string
          sale_payment_method: string
          salon_id: string
          scope_service_ids: string[]
          total_paid: number
          total_treatments: number
          valid_from?: string
          valid_until?: string | null
        }
        Update: {
          client_id?: string
          created_at?: string
          created_by?: string | null
          discount_percent?: number | null
          id?: string
          is_active?: boolean
          notes?: string | null
          pricing_mode?: string
          sale_payment_method?: string
          salon_id?: string
          scope_service_ids?: string[]
          total_paid?: number
          total_treatments?: number
          valid_from?: string
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "abbonamenti_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "abbonamenti_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      activity_log: {
        Row: {
          action: string
          actor_id: string | null
          actor_name: string | null
          changes: Json | null
          created_at: string
          entity_id: string | null
          entity_type: string
          id: string
          salon_id: string
          summary: string | null
        }
        Insert: {
          action: string
          actor_id?: string | null
          actor_name?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type: string
          id?: string
          salon_id: string
          summary?: string | null
        }
        Update: {
          action?: string
          actor_id?: string | null
          actor_name?: string | null
          changes?: Json | null
          created_at?: string
          entity_id?: string | null
          entity_type?: string
          id?: string
          salon_id?: string
          summary?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_log_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          archived_at: string | null
          birthDate: string | null
          can_book_online: boolean
          city: string | null
          color: string | null
          created_at: string
          email: string | null
          firstName: string | null
          formulas: string | null
          gender: string | null
          id: string
          isTourist: boolean | null
          landline: string | null
          lastName: string | null
          note: string | null
          phoneNumber: string | null
          phonePrefix: string | null
          photoUrl: string | null
          postal_code: string | null
          profession: string | null
          referral_source: string | null
          salon_id: string
          user_id: string | null
        }
        Insert: {
          address?: string | null
          archived_at?: string | null
          birthDate?: string | null
          can_book_online?: boolean
          city?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          firstName?: string | null
          formulas?: string | null
          gender?: string | null
          id?: string
          isTourist?: boolean | null
          landline?: string | null
          lastName?: string | null
          note?: string | null
          phoneNumber?: string | null
          phonePrefix?: string | null
          photoUrl?: string | null
          postal_code?: string | null
          profession?: string | null
          referral_source?: string | null
          salon_id: string
          user_id?: string | null
        }
        Update: {
          address?: string | null
          archived_at?: string | null
          birthDate?: string | null
          can_book_online?: boolean
          city?: string | null
          color?: string | null
          created_at?: string
          email?: string | null
          firstName?: string | null
          formulas?: string | null
          gender?: string | null
          id?: string
          isTourist?: boolean | null
          landline?: string | null
          lastName?: string | null
          note?: string | null
          phoneNumber?: string | null
          phonePrefix?: string | null
          photoUrl?: string | null
          postal_code?: string | null
          profession?: string | null
          referral_source?: string | null
          salon_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "clients_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupon_redemptions: {
        Row: {
          amount_applied: number
          applied_at: string
          applied_by: string | null
          coupon_id: string
          fiche_id: string
          id: string
          remaining_after: number | null
          salon_id: string
        }
        Insert: {
          amount_applied: number
          applied_at?: string
          applied_by?: string | null
          coupon_id: string
          fiche_id: string
          id?: string
          remaining_after?: number | null
          salon_id: string
        }
        Update: {
          amount_applied?: number
          applied_at?: string
          applied_by?: string | null
          coupon_id?: string
          fiche_id?: string
          id?: string
          remaining_after?: number | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupon_redemptions_coupon_id_fkey"
            columns: ["coupon_id"]
            isOneToOne: false
            referencedRelation: "coupons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_fiche_id_fkey"
            columns: ["fiche_id"]
            isOneToOne: false
            referencedRelation: "fiches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupon_redemptions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          created_at: string
          created_by: string | null
          discount_type: string
          discount_value: number | null
          free_item_id: string | null
          free_item_kind: string | null
          id: string
          is_active: boolean
          kind: string
          notes: string | null
          original_value: number | null
          purchaser_client_id: string | null
          recipient_client_id: string
          remaining_value: number | null
          sale_amount: number | null
          sale_payment_method: string | null
          salon_id: string
          scope_product_category_ids: string[] | null
          scope_product_ids: string[] | null
          scope_service_category_ids: string[] | null
          scope_service_ids: string[] | null
          valid_from: string
          valid_until: string
        }
        Insert: {
          created_at?: string
          created_by?: string | null
          discount_type: string
          discount_value?: number | null
          free_item_id?: string | null
          free_item_kind?: string | null
          id?: string
          is_active?: boolean
          kind: string
          notes?: string | null
          original_value?: number | null
          purchaser_client_id?: string | null
          recipient_client_id: string
          remaining_value?: number | null
          sale_amount?: number | null
          sale_payment_method?: string | null
          salon_id: string
          scope_product_category_ids?: string[] | null
          scope_product_ids?: string[] | null
          scope_service_category_ids?: string[] | null
          scope_service_ids?: string[] | null
          valid_from: string
          valid_until: string
        }
        Update: {
          created_at?: string
          created_by?: string | null
          discount_type?: string
          discount_value?: number | null
          free_item_id?: string | null
          free_item_kind?: string | null
          id?: string
          is_active?: boolean
          kind?: string
          notes?: string | null
          original_value?: number | null
          purchaser_client_id?: string | null
          recipient_client_id?: string
          remaining_value?: number | null
          sale_amount?: number | null
          sale_payment_method?: string | null
          salon_id?: string
          scope_product_category_ids?: string[] | null
          scope_product_ids?: string[] | null
          scope_service_category_ids?: string[] | null
          scope_service_ids?: string[] | null
          valid_from?: string
          valid_until?: string
        }
        Relationships: [
          {
            foreignKeyName: "coupons_purchaser_client_id_fkey"
            columns: ["purchaser_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_recipient_client_id_fkey"
            columns: ["recipient_client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "coupons_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      data_subject_requests: {
        Row: {
          fulfilled_at: string | null
          fulfillment_notes: string | null
          id: string
          request_type: string
          requested_at: string
          salon_id: string | null
          user_id: string | null
        }
        Insert: {
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          id?: string
          request_type: string
          requested_at?: string
          salon_id?: string | null
          user_id?: string | null
        }
        Update: {
          fulfilled_at?: string | null
          fulfillment_notes?: string | null
          id?: string
          request_type?: string
          requested_at?: string
          salon_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "data_subject_requests_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_comments: {
        Row: {
          author_id: string
          body: string
          created_at: string
          feedback_id: string
          id: string
          image_paths: string[]
          updated_at: string
        }
        Insert: {
          author_id: string
          body: string
          created_at?: string
          feedback_id: string
          id?: string
          image_paths?: string[]
          updated_at?: string
        }
        Update: {
          author_id?: string
          body?: string
          created_at?: string
          feedback_id?: string
          id?: string
          image_paths?: string[]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_entries: {
        Row: {
          author_id: string
          completed_at: string | null
          created_at: string
          description: string
          id: string
          image_paths: string[]
          linked_branch: string | null
          linked_pr_url: string | null
          status: string
          title: string
          type: string
          updated_at: string
        }
        Insert: {
          author_id: string
          completed_at?: string | null
          created_at?: string
          description: string
          id?: string
          image_paths?: string[]
          linked_branch?: string | null
          linked_pr_url?: string | null
          status?: string
          title: string
          type: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          completed_at?: string | null
          created_at?: string
          description?: string
          id?: string
          image_paths?: string[]
          linked_branch?: string | null
          linked_pr_url?: string | null
          status?: string
          title?: string
          type?: string
          updated_at?: string
        }
        Relationships: []
      }
      feedback_upvotes: {
        Row: {
          created_at: string
          feedback_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          feedback_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          feedback_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "feedback_upvotes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_upvotes_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      fiche_edits: {
        Row: {
          changes: Json
          edited_at: string
          edited_by: string | null
          fiche_id: string
          id: string
          reason: string | null
          salon_id: string
        }
        Insert: {
          changes: Json
          edited_at?: string
          edited_by?: string | null
          fiche_id: string
          id?: string
          reason?: string | null
          salon_id: string
        }
        Update: {
          changes?: Json
          edited_at?: string
          edited_by?: string | null
          fiche_id?: string
          id?: string
          reason?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiche_edits_fiche_id_fkey"
            columns: ["fiche_id"]
            isOneToOne: false
            referencedRelation: "fiches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiche_edits_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      fiche_payments: {
        Row: {
          amount: number
          created_at: string
          fiche_id: string
          id: string
          method: string
          salon_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          fiche_id: string
          id?: string
          method: string
          salon_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          fiche_id?: string
          id?: string
          method?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiche_payments_fiche_id_fkey"
            columns: ["fiche_id"]
            isOneToOne: false
            referencedRelation: "fiches"
            referencedColumns: ["id"]
          },
        ]
      }
      fiche_products: {
        Row: {
          fiche_id: string
          final_price: number
          id: string
          list_price: number
          product_id: string
          quantity: number
          salon_id: string
        }
        Insert: {
          fiche_id: string
          final_price?: number
          id?: string
          list_price?: number
          product_id: string
          quantity?: number
          salon_id: string
        }
        Update: {
          fiche_id?: string
          final_price?: number
          id?: string
          list_price?: number
          product_id?: string
          quantity?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiche_products_fiche_id_fkey"
            columns: ["fiche_id"]
            isOneToOne: false
            referencedRelation: "fiches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiche_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiche_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiche_products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      fiche_services: {
        Row: {
          abbonamento_id: string | null
          created_at: string
          duration: number | null
          end_time: string | null
          fiche_id: string | null
          final_price: number
          id: string
          list_price: number
          name: string
          operator_id: string | null
          salon_id: string
          service_id: string | null
          start_time: string
        }
        Insert: {
          abbonamento_id?: string | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          fiche_id?: string | null
          final_price?: number
          id?: string
          list_price?: number
          name: string
          operator_id?: string | null
          salon_id: string
          service_id?: string | null
          start_time?: string
        }
        Update: {
          abbonamento_id?: string | null
          created_at?: string
          duration?: number | null
          end_time?: string | null
          fiche_id?: string | null
          final_price?: number
          id?: string
          list_price?: number
          name?: string
          operator_id?: string | null
          salon_id?: string
          service_id?: string | null
          start_time?: string
        }
        Relationships: [
          {
            foreignKeyName: "fiche_services_abbonamento_id_fkey"
            columns: ["abbonamento_id"]
            isOneToOne: false
            referencedRelation: "abbonamenti"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiche_services_fiche_id_fkey"
            columns: ["fiche_id"]
            isOneToOne: false
            referencedRelation: "fiches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiche_services_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiche_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_services_fish_id_fkey"
            columns: ["fiche_id"]
            isOneToOne: false
            referencedRelation: "fiches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      fiches: {
        Row: {
          booking_source: string
          cancel_token: string | null
          client_id: string | null
          created_at: string
          datetime: string | null
          id: string
          miscela: string | null
          note: string | null
          paid: boolean
          review_request_error: string | null
          review_request_sent_at: string | null
          review_request_sid: string | null
          review_request_status: string | null
          salon_id: string
          send_review_request: boolean
          status: string | null
          tecnica: string | null
          total_override: number | null
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          booking_source?: string
          cancel_token?: string | null
          client_id?: string | null
          created_at?: string
          datetime?: string | null
          id?: string
          miscela?: string | null
          note?: string | null
          paid?: boolean
          review_request_error?: string | null
          review_request_sent_at?: string | null
          review_request_sid?: string | null
          review_request_status?: string | null
          salon_id: string
          send_review_request?: boolean
          status?: string | null
          tecnica?: string | null
          total_override?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          booking_source?: string
          cancel_token?: string | null
          client_id?: string | null
          created_at?: string
          datetime?: string | null
          id?: string
          miscela?: string | null
          note?: string | null
          paid?: boolean
          review_request_error?: string | null
          review_request_sent_at?: string | null
          review_request_sid?: string | null
          review_request_status?: string | null
          salon_id?: string
          send_review_request?: boolean
          status?: string | null
          tecnica?: string | null
          total_override?: number | null
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "fiches_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      import_jobs: {
        Row: {
          auto_commit_eligible: boolean
          completed_at: string | null
          created_at: string
          created_by: string
          entity: string | null
          error_log: Json | null
          failed_rows: number
          failure_reason: string | null
          id: string
          mapping_json: Json | null
          onboarding_id: string | null
          preview_json: Json | null
          processed_rows: number
          salon_id: string
          skipped_rows: number
          source_filename: string
          source_sheet_name: string | null
          source_size_bytes: number | null
          status: string
          storage_path: string
          total_rows: number | null
        }
        Insert: {
          auto_commit_eligible?: boolean
          completed_at?: string | null
          created_at?: string
          created_by: string
          entity?: string | null
          error_log?: Json | null
          failed_rows?: number
          failure_reason?: string | null
          id?: string
          mapping_json?: Json | null
          onboarding_id?: string | null
          preview_json?: Json | null
          processed_rows?: number
          salon_id: string
          skipped_rows?: number
          source_filename: string
          source_sheet_name?: string | null
          source_size_bytes?: number | null
          status?: string
          storage_path: string
          total_rows?: number | null
        }
        Update: {
          auto_commit_eligible?: boolean
          completed_at?: string | null
          created_at?: string
          created_by?: string
          entity?: string | null
          error_log?: Json | null
          failed_rows?: number
          failure_reason?: string | null
          id?: string
          mapping_json?: Json | null
          onboarding_id?: string | null
          preview_json?: Json | null
          processed_rows?: number
          salon_id?: string
          skipped_rows?: number
          source_filename?: string
          source_sheet_name?: string | null
          source_size_bytes?: number | null
          status?: string
          storage_path?: string
          total_rows?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "import_jobs_onboarding_id_fkey"
            columns: ["onboarding_id"]
            isOneToOne: false
            referencedRelation: "onboarding_imports"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "import_jobs_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      legal_acceptances: {
        Row: {
          accepted_at: string
          document_type: string
          document_version: string
          id: string
          ip_address: unknown
          salon_id: string | null
          user_agent: string | null
          user_id: string
        }
        Insert: {
          accepted_at?: string
          document_type: string
          document_version: string
          id?: string
          ip_address?: unknown
          salon_id?: string | null
          user_agent?: string | null
          user_id: string
        }
        Update: {
          accepted_at?: string
          document_type?: string
          document_version?: string
          id?: string
          ip_address?: unknown
          salon_id?: string | null
          user_agent?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "legal_acceptances_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      manufacturers: {
        Row: {
          created_at: string
          id: string
          name: string | null
          salon_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          name?: string | null
          salon_id: string
        }
        Update: {
          created_at?: string
          id?: string
          name?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "manufacturers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      notifications: {
        Row: {
          action_required: boolean
          body: string | null
          created_at: string
          id: string
          link: string | null
          read_at: string | null
          salon_id: string
          title: string
          type: string
          user_id: string
        }
        Insert: {
          action_required?: boolean
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          salon_id: string
          title: string
          type: string
          user_id: string
        }
        Update: {
          action_required?: boolean
          body?: string | null
          created_at?: string
          id?: string
          link?: string | null
          read_at?: string | null
          salon_id?: string
          title?: string
          type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      obiettivi: {
        Row: {
          buffer_percent: number
          casa: number
          famiglia: number
          id: string
          salon_id: string
          spese_personali: number
          tempo_libero: number
          trasporti: number
          updated_at: string | null
        }
        Insert: {
          buffer_percent?: number
          casa?: number
          famiglia?: number
          id?: string
          salon_id: string
          spese_personali?: number
          tempo_libero?: number
          trasporti?: number
          updated_at?: string | null
        }
        Update: {
          buffer_percent?: number
          casa?: number
          famiglia?: number
          id?: string
          salon_id?: string
          spese_personali?: number
          tempo_libero?: number
          trasporti?: number
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "obiettivi_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: true
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      onboarding_imports: {
        Row: {
          classified_count: number
          committed_count: number
          completed_at: string | null
          created_at: string
          created_by: string
          failure_reason: string | null
          file_count: number
          id: string
          salon_id: string
          started_at: string | null
          status: string
          summary_json: Json | null
        }
        Insert: {
          classified_count?: number
          committed_count?: number
          completed_at?: string | null
          created_at?: string
          created_by: string
          failure_reason?: string | null
          file_count?: number
          id?: string
          salon_id: string
          started_at?: string | null
          status?: string
          summary_json?: Json | null
        }
        Update: {
          classified_count?: number
          committed_count?: number
          completed_at?: string | null
          created_at?: string
          created_by?: string
          failure_reason?: string | null
          file_count?: number
          id?: string
          salon_id?: string
          started_at?: string | null
          status?: string
          summary_json?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "onboarding_imports_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_services: {
        Row: {
          created_at: string
          id: string
          operator_id: string
          salon_id: string
          service_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          operator_id: string
          salon_id: string
          service_id: string
        }
        Update: {
          created_at?: string
          id?: string
          operator_id?: string
          salon_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_services_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_services_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      operator_unavailabilities: {
        Row: {
          all_day: boolean
          created_at: string
          created_by: string | null
          end_at: string
          id: string
          note: string | null
          operator_id: string
          salon_id: string
          start_at: string
        }
        Insert: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          end_at: string
          id?: string
          note?: string | null
          operator_id: string
          salon_id: string
          start_at: string
        }
        Update: {
          all_day?: boolean
          created_at?: string
          created_by?: string | null
          end_at?: string
          id?: string
          note?: string | null
          operator_id?: string
          salon_id?: string
          start_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "operator_unavailabilities_operator_id_fkey"
            columns: ["operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "operator_unavailabilities_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      operators: {
        Row: {
          archived_at: string | null
          avatar_url: string | null
          created_at: string
          email: string | null
          firstName: string | null
          id: string
          lastName: string | null
          must_change_password: boolean
          phoneNumber: string | null
          phonePrefix: string | null
          salon_id: string
          user_id: string | null
          working_hours: Json | null
        }
        Insert: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          must_change_password?: boolean
          phoneNumber?: string | null
          phonePrefix?: string | null
          salon_id: string
          user_id?: string | null
          working_hours?: Json | null
        }
        Update: {
          archived_at?: string | null
          avatar_url?: string | null
          created_at?: string
          email?: string | null
          firstName?: string | null
          id?: string
          lastName?: string | null
          must_change_password?: boolean
          phoneNumber?: string | null
          phonePrefix?: string | null
          salon_id?: string
          user_id?: string | null
          working_hours?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "operators_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      order_products: {
        Row: {
          created_at: string
          id: string
          order_id: string | null
          product_id: string | null
          quantity: number | null
          salon_id: string
          unit_price: number | null
        }
        Insert: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          salon_id: string
          unit_price?: number | null
        }
        Update: {
          created_at?: string
          id?: string
          order_id?: string | null
          product_id?: string | null
          quantity?: number | null
          salon_id?: string
          unit_price?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "order_products_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "order_products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      orders: {
        Row: {
          created_at: string
          datetime: string | null
          id: string
          salon_id: string
          status: string | null
          supplier_id: string
        }
        Insert: {
          created_at?: string
          datetime?: string | null
          id?: string
          salon_id: string
          status?: string | null
          supplier_id: string
        }
        Update: {
          created_at?: string
          datetime?: string | null
          id?: string
          salon_id?: string
          status?: string | null
          supplier_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "orders_operator_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "orders_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      pending_membership_invites: {
        Row: {
          claimed_at: string | null
          created_at: string
          declined_at: string | null
          email: string
          expires_at: string
          id: string
          invited_by: string
          salon_id: string
          target_role: string
          token: string
        }
        Insert: {
          claimed_at?: string | null
          created_at?: string
          declined_at?: string | null
          email: string
          expires_at?: string
          id?: string
          invited_by: string
          salon_id: string
          target_role: string
          token: string
        }
        Update: {
          claimed_at?: string | null
          created_at?: string
          declined_at?: string | null
          email?: string
          expires_at?: string
          id?: string
          invited_by?: string
          salon_id?: string
          target_role?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "pending_membership_invites_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      product_categories: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          description: string | null
          id: string
          imageUrl: string | null
          name: string | null
          salon_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          imageUrl?: string | null
          name?: string | null
          salon_id: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          imageUrl?: string | null
          name?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_categories_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      product_price_history: {
        Row: {
          changed_at: string
          id: string
          new_price: number | null
          new_sell_price: number | null
          old_price: number | null
          old_sell_price: number | null
          product_id: string
          salon_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_price?: number | null
          new_sell_price?: number | null
          old_price?: number | null
          old_sell_price?: number | null
          product_id: string
          salon_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_price?: number | null
          new_sell_price?: number | null
          old_price?: number | null
          old_sell_price?: number | null
          product_id?: string
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "product_price_history_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_stats"
            referencedColumns: ["id"]
          },
        ]
      }
      products: {
        Row: {
          archived_at: string | null
          created_at: string
          description: string | null
          id: string
          imageUrl: string | null
          is_for_retail: boolean | null
          manufacturer_id: string | null
          min_threshold: number | null
          name: string | null
          price: number | null
          product_category_id: string | null
          quantity_ml: number | null
          salon_id: string
          sell_price: number | null
          stock_quantity: number | null
          supplier_id: string | null
        }
        Insert: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          imageUrl?: string | null
          is_for_retail?: boolean | null
          manufacturer_id?: string | null
          min_threshold?: number | null
          name?: string | null
          price?: number | null
          product_category_id?: string | null
          quantity_ml?: number | null
          salon_id: string
          sell_price?: number | null
          stock_quantity?: number | null
          supplier_id?: string | null
        }
        Update: {
          archived_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          imageUrl?: string | null
          is_for_retail?: boolean | null
          manufacturer_id?: string | null
          min_threshold?: number | null
          name?: string | null
          price?: number | null
          product_category_id?: string | null
          quantity_ml?: number | null
          salon_id?: string
          sell_price?: number | null
          stock_quantity?: number | null
          supplier_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          first_name: string
          id: string
          is_platform_admin: boolean
          last_name: string
          phone_number: string | null
          phone_prefix: string | null
          preferences: Json
          role: string
          salon_id: string | null
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          first_name: string
          id: string
          is_platform_admin?: boolean
          last_name: string
          phone_number?: string | null
          phone_prefix?: string | null
          preferences?: Json
          role?: string
          salon_id?: string | null
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          first_name?: string
          id?: string
          is_platform_admin?: boolean
          last_name?: string
          phone_number?: string | null
          phone_prefix?: string | null
          preferences?: Json
          role?: string
          salon_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      prospects: {
        Row: {
          address: string | null
          call_count: number
          callback_at: string | null
          city: string | null
          comune_code: string | null
          created_at: string
          created_by: string | null
          current_software: string | null
          google_maps_url: string | null
          id: string
          last_call_at: string | null
          materials_sent_at: string | null
          name: string
          notes: string | null
          owner_name: string | null
          phone_personal: string | null
          phone_shop: string | null
          province: string | null
          region: string | null
          status: Database["public"]["Enums"]["prospect_status"]
          updated_at: string
        }
        Insert: {
          address?: string | null
          call_count?: number
          callback_at?: string | null
          city?: string | null
          comune_code?: string | null
          created_at?: string
          created_by?: string | null
          current_software?: string | null
          google_maps_url?: string | null
          id?: string
          last_call_at?: string | null
          materials_sent_at?: string | null
          name: string
          notes?: string | null
          owner_name?: string | null
          phone_personal?: string | null
          phone_shop?: string | null
          province?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          updated_at?: string
        }
        Update: {
          address?: string | null
          call_count?: number
          callback_at?: string | null
          city?: string | null
          comune_code?: string | null
          created_at?: string
          created_by?: string | null
          current_software?: string | null
          google_maps_url?: string | null
          id?: string
          last_call_at?: string | null
          materials_sent_at?: string | null
          name?: string
          notes?: string | null
          owner_name?: string | null
          phone_personal?: string | null
          phone_shop?: string | null
          province?: string | null
          region?: string | null
          status?: Database["public"]["Enums"]["prospect_status"]
          updated_at?: string
        }
        Relationships: []
      }
      referral_credits: {
        Row: {
          applied_at: string | null
          created_at: string
          earned_at: string | null
          id: string
          new_period_end: string | null
          previous_period_end: string | null
          referred_salon_id: string
          referrer_salon_id: string
          status: string
        }
        Insert: {
          applied_at?: string | null
          created_at?: string
          earned_at?: string | null
          id?: string
          new_period_end?: string | null
          previous_period_end?: string | null
          referred_salon_id: string
          referrer_salon_id: string
          status?: string
        }
        Update: {
          applied_at?: string | null
          created_at?: string
          earned_at?: string | null
          id?: string
          new_period_end?: string | null
          previous_period_end?: string | null
          referred_salon_id?: string
          referrer_salon_id?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_credits_referred_salon_id_fkey"
            columns: ["referred_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_credits_referrer_salon_id_fkey"
            columns: ["referrer_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      reviews: {
        Row: {
          author_id: string
          created_at: string
          id: string
          message: string
          rating: number
          updated_at: string
        }
        Insert: {
          author_id: string
          created_at?: string
          id?: string
          message: string
          rating: number
          updated_at?: string
        }
        Update: {
          author_id?: string
          created_at?: string
          id?: string
          message?: string
          rating?: number
          updated_at?: string
        }
        Relationships: []
      }
      salon_closures: {
        Row: {
          created_at: string
          ends_on: string
          id: string
          note: string | null
          salon_id: string
          starts_on: string
        }
        Insert: {
          created_at?: string
          ends_on: string
          id?: string
          note?: string | null
          salon_id: string
          starts_on: string
        }
        Update: {
          created_at?: string
          ends_on?: string
          id?: string
          note?: string | null
          salon_id?: string
          starts_on?: string
        }
        Relationships: [
          {
            foreignKeyName: "salon_closures_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      salons: {
        Row: {
          address: string | null
          allow_operator_self_unavailability: boolean
          booking_config: Json
          booking_enabled: boolean
          booking_setup_dismissed_at: string | null
          brand_color: string | null
          cap: string | null
          city: string | null
          color_by_client: boolean
          created_at: string
          current_period_end: string | null
          current_period_start: string | null
          default_appointment_duration_min: number
          default_low_stock_threshold: number
          email_notifications: Json
          favicon_url: string | null
          fiscal: Json
          form_defaults: Json
          id: string
          invite_code: string | null
          is_test: boolean
          logo_url: string | null
          name: string
          onboarded_at: string | null
          onboarding_dismissed_at: string | null
          operating_hours: Json
          origin: string
          owner_id: string
          phone: string | null
          province: string | null
          public_email: string | null
          referral_code: string
          referral_extension_until: string | null
          referred_by_salon_id: string | null
          review_request_config: Json
          slot_granularity_min: number
          slug: string | null
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_ends_at: string | null
          subscription_plan: string | null
          subscription_status: string
          track_inventory: boolean | null
          trial_ends_at: string
          type: string
          whatsapp_credits: number
        }
        Insert: {
          address?: string | null
          allow_operator_self_unavailability?: boolean
          booking_config?: Json
          booking_enabled?: boolean
          booking_setup_dismissed_at?: string | null
          brand_color?: string | null
          cap?: string | null
          city?: string | null
          color_by_client?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          default_appointment_duration_min?: number
          default_low_stock_threshold?: number
          email_notifications?: Json
          favicon_url?: string | null
          fiscal?: Json
          form_defaults?: Json
          id?: string
          invite_code?: string | null
          is_test?: boolean
          logo_url?: string | null
          name: string
          onboarded_at?: string | null
          onboarding_dismissed_at?: string | null
          operating_hours?: Json
          origin: string
          owner_id: string
          phone?: string | null
          province?: string | null
          public_email?: string | null
          referral_code?: string
          referral_extension_until?: string | null
          referred_by_salon_id?: string | null
          review_request_config?: Json
          slot_granularity_min?: number
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string
          track_inventory?: boolean | null
          trial_ends_at?: string
          type: string
          whatsapp_credits?: number
        }
        Update: {
          address?: string | null
          allow_operator_self_unavailability?: boolean
          booking_config?: Json
          booking_enabled?: boolean
          booking_setup_dismissed_at?: string | null
          brand_color?: string | null
          cap?: string | null
          city?: string | null
          color_by_client?: boolean
          created_at?: string
          current_period_end?: string | null
          current_period_start?: string | null
          default_appointment_duration_min?: number
          default_low_stock_threshold?: number
          email_notifications?: Json
          favicon_url?: string | null
          fiscal?: Json
          form_defaults?: Json
          id?: string
          invite_code?: string | null
          is_test?: boolean
          logo_url?: string | null
          name?: string
          onboarded_at?: string | null
          onboarding_dismissed_at?: string | null
          operating_hours?: Json
          origin?: string
          owner_id?: string
          phone?: string | null
          province?: string | null
          public_email?: string | null
          referral_code?: string
          referral_extension_until?: string | null
          referred_by_salon_id?: string | null
          review_request_config?: Json
          slot_granularity_min?: number
          slug?: string | null
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_ends_at?: string | null
          subscription_plan?: string | null
          subscription_status?: string
          track_inventory?: boolean | null
          trial_ends_at?: string
          type?: string
          whatsapp_credits?: number
        }
        Relationships: [
          {
            foreignKeyName: "salons_referred_by_salon_id_fkey"
            columns: ["referred_by_salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      service_categories: {
        Row: {
          archived_at: string | null
          color: string
          created_at: string
          description: string | null
          id: string
          imageUrl: string | null
          name: string | null
          salon_id: string
        }
        Insert: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          imageUrl?: string | null
          name?: string | null
          salon_id: string
        }
        Update: {
          archived_at?: string | null
          color?: string
          created_at?: string
          description?: string | null
          id?: string
          imageUrl?: string | null
          name?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_categories_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      service_price_history: {
        Row: {
          changed_at: string
          id: string
          new_price: number
          old_price: number | null
          salon_id: string
          service_id: string
        }
        Insert: {
          changed_at?: string
          id?: string
          new_price: number
          old_price?: number | null
          salon_id: string
          service_id: string
        }
        Update: {
          changed_at?: string
          id?: string
          new_price?: number
          old_price?: number | null
          salon_id?: string
          service_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_price_history_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      service_products: {
        Row: {
          created_at: string
          id: number
          product_id: string | null
          salon_id: string
          service_id: string | null
        }
        Insert: {
          created_at?: string
          id?: number
          product_id?: string | null
          salon_id: string
          service_id?: string | null
        }
        Update: {
          created_at?: string
          id?: number
          product_id?: string | null
          salon_id?: string
          service_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "service_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_product_id_fkey"
            columns: ["product_id"]
            isOneToOne: false
            referencedRelation: "products_with_stats"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "service_products_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          archived_at: string | null
          bookable_online: boolean
          category_id: string | null
          created_at: string
          description: string | null
          duration: number | null
          id: string
          imageUrl: string | null
          name: string | null
          price: number | null
          product_cost: number
          salon_id: string
        }
        Insert: {
          archived_at?: string | null
          bookable_online?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          imageUrl?: string | null
          name?: string | null
          price?: number | null
          product_cost?: number
          salon_id: string
        }
        Update: {
          archived_at?: string | null
          bookable_online?: boolean
          category_id?: string | null
          created_at?: string
          description?: string | null
          duration?: number | null
          id?: string
          imageUrl?: string | null
          name?: string | null
          price?: number | null
          product_cost?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "services_category_id_fkey"
            columns: ["category_id"]
            isOneToOne: false
            referencedRelation: "service_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "services_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      spese: {
        Row: {
          categoria: string
          created_at: string | null
          data: string
          fornitore: string
          id: string
          imponibile: number | null
          importo: number
          salon_id: string
        }
        Insert: {
          categoria: string
          created_at?: string | null
          data: string
          fornitore: string
          id?: string
          imponibile?: number | null
          importo: number
          salon_id: string
        }
        Update: {
          categoria?: string
          created_at?: string | null
          data?: string
          fornitore?: string
          id?: string
          imponibile?: number | null
          importo?: number
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "spese_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      subscription_cancellations: {
        Row: {
          cancel_at: string | null
          canceled_at: string
          comment: string | null
          created_at: string
          id: string
          reactivated_at: string | null
          reason: string | null
          salon_id: string
        }
        Insert: {
          cancel_at?: string | null
          canceled_at?: string
          comment?: string | null
          created_at?: string
          id?: string
          reactivated_at?: string | null
          reason?: string | null
          salon_id: string
        }
        Update: {
          cancel_at?: string | null
          canceled_at?: string
          comment?: string | null
          created_at?: string
          id?: string
          reactivated_at?: string | null
          reason?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "subscription_cancellations_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      super_admin_impersonation: {
        Row: {
          created_at: string
          salon_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          salon_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "super_admin_impersonation_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      suppliers: {
        Row: {
          city: string | null
          created_at: string
          email: string | null
          id: string
          name: string | null
          phone: string | null
          salon_id: string
        }
        Insert: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          salon_id: string
        }
        Update: {
          city?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string | null
          phone?: string | null
          salon_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "suppliers_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_active_salon: {
        Row: {
          salon_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          salon_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          salon_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_active_salon_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_salon_memberships: {
        Row: {
          id: string
          is_primary: boolean
          joined_at: string
          role: string
          salon_id: string
          user_id: string
        }
        Insert: {
          id?: string
          is_primary?: boolean
          joined_at?: string
          role: string
          salon_id: string
          user_id: string
        }
        Update: {
          id?: string
          is_primary?: boolean
          joined_at?: string
          role?: string
          salon_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_salon_memberships_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
      whatsapp_credit_transactions: {
        Row: {
          balance_after: number
          created_at: string
          delta: number
          fiche_id: string | null
          id: string
          reason: string
          salon_id: string
          stripe_session_id: string | null
        }
        Insert: {
          balance_after: number
          created_at?: string
          delta: number
          fiche_id?: string | null
          id?: string
          reason: string
          salon_id: string
          stripe_session_id?: string | null
        }
        Update: {
          balance_after?: number
          created_at?: string
          delta?: number
          fiche_id?: string | null
          id?: string
          reason?: string
          salon_id?: string
          stripe_session_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "whatsapp_credit_transactions_fiche_id_fkey"
            columns: ["fiche_id"]
            isOneToOne: false
            referencedRelation: "fiches"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "whatsapp_credit_transactions_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      client_ratings: {
        Row: {
          client_id: string | null
          salon_id: string | null
          spend_stars: number | null
          total_spent: number | null
          visit_count: number | null
          visit_stars: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiches_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_stats: {
        Row: {
          avg_ticket: number | null
          client_id: string | null
          first_visit: string | null
          last_visit: string | null
          salon_id: string | null
          top_operator_id: string | null
          top_operator_name: string | null
          top_service_id: string | null
          top_service_name: string | null
          total_spent: number | null
          visit_count: number | null
        }
        Relationships: [
          {
            foreignKeyName: "fiche_services_operator_id_fkey"
            columns: ["top_operator_id"]
            isOneToOne: false
            referencedRelation: "operators"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fiches_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fish_services_service_id_fkey"
            columns: ["top_service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fishes_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_comments_with_author: {
        Row: {
          author_first_name: string | null
          author_id: string | null
          author_last_name: string | null
          author_role: string | null
          author_salon_id: string | null
          author_salon_name: string | null
          body: string | null
          created_at: string | null
          feedback_id: string | null
          id: string | null
          image_paths: string[] | null
          updated_at: string | null
        }
        Relationships: [
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feedback_comments_feedback_id_fkey"
            columns: ["feedback_id"]
            isOneToOne: false
            referencedRelation: "feedback_entries_with_counts"
            referencedColumns: ["id"]
          },
        ]
      }
      feedback_entries_with_counts: {
        Row: {
          author_first_name: string | null
          author_id: string | null
          author_last_name: string | null
          author_salon_id: string | null
          author_salon_name: string | null
          comment_count: number | null
          completed_at: string | null
          created_at: string | null
          description: string | null
          id: string | null
          image_paths: string[] | null
          linked_branch: string | null
          linked_pr_url: string | null
          status: string | null
          title: string | null
          type: string | null
          updated_at: string | null
          upvote_count: number | null
        }
        Relationships: []
      }
      products_with_stats: {
        Row: {
          archived_at: string | null
          created_at: string | null
          description: string | null
          id: string | null
          imageUrl: string | null
          is_for_retail: boolean | null
          manufacturer_id: string | null
          min_threshold: number | null
          name: string | null
          price: number | null
          product_category_id: string | null
          quantity_ml: number | null
          salon_id: string | null
          sell_price: number | null
          stock_quantity: number | null
          supplier_id: string | null
          total_purchased: number | null
          total_sold: number | null
        }
        Relationships: [
          {
            foreignKeyName: "products_manufacturer_id_fkey"
            columns: ["manufacturer_id"]
            isOneToOne: false
            referencedRelation: "manufacturers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_product_category_id_fkey"
            columns: ["product_category_id"]
            isOneToOne: false
            referencedRelation: "product_categories"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_salon_id_fkey"
            columns: ["salon_id"]
            isOneToOne: false
            referencedRelation: "salons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "products_supplier_id_fkey"
            columns: ["supplier_id"]
            isOneToOne: false
            referencedRelation: "suppliers"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      _ptfh5_import_batch: { Args: { p: Json }; Returns: Json }
      actor_display_name: { Args: { p_uid: string }; Returns: string }
      adjust_product_stock: {
        Args: { p_delta: number; p_id: string; p_salon_id: string }
        Returns: undefined
      }
      bilancio: {
        Args: { p_from: string; p_salon_id?: string; p_to: string }
        Returns: Json
      }
      bilancio_voce_spesa: { Args: { p_categoria: string }; Returns: string }
      cancel_online_booking_by_token: {
        Args: { p_token: string }
        Returns: {
          client_email: string
          client_first: string
          client_last: string
          fiche_id: string
          operator_id: string
          salon_id: string
          service_name: string
          start_at: string
        }[]
      }
      claim_membership_invite: { Args: { p_token: string }; Returns: Json }
      consume_whatsapp_credit: {
        Args: { p_fiche_id: string; p_salon_id: string }
        Returns: number
      }
      create_online_booking: {
        Args: {
          p_client_email: string
          p_client_first: string
          p_client_last: string
          p_client_phone: string
          p_client_phone_prefix: string
          p_note: string
          p_operator_id: string
          p_salon_id: string
          p_service_id: string
          p_start_at: string
        }
        Returns: {
          cancel_token: string
          fiche_id: string
          status: string
        }[]
      }
      due_review_requests: {
        Args: { p_now: string }
        Returns: {
          client_id: string
          end_time: string
          fiche_id: string
          salon_id: string
        }[]
      }
      get_author_card: {
        Args: { p_user_id: string }
        Returns: {
          first_name: string
          id: string
          last_name: string
          role: string
          salon_id: string
          salon_name: string
        }[]
      }
      get_available_slots: {
        Args: {
          p_day: string
          p_operator_id: string
          p_salon_id: string
          p_service_id: string
        }
        Returns: {
          end_at: string
          operator_id: string
          start_at: string
        }[]
      }
      get_bookable_operators: {
        Args: { p_salon_id: string; p_service_id: string }
        Returns: {
          avatar_url: string
          first_name: string
          id: string
          last_name: string
        }[]
      }
      get_bookable_services: {
        Args: { p_salon_id: string }
        Returns: {
          category_id: string
          description: string
          duration: number
          id: string
          image_url: string
          name: string
          price: number
        }[]
      }
      get_booking_by_token: {
        Args: { p_token: string }
        Returns: {
          can_cancel_now: boolean
          cancel_window_hours: number
          client_email: string
          client_first: string
          end_at: string
          fiche_id: string
          operator_first: string
          operator_last: string
          salon_address: string
          salon_brand_color: string
          salon_cap: string
          salon_city: string
          salon_id: string
          salon_logo_url: string
          salon_name: string
          salon_phone: string
          salon_province: string
          salon_slug: string
          service_name: string
          start_at: string
          status: string
        }[]
      }
      get_public_closures: {
        Args: { p_salon_id: string }
        Returns: {
          ends_on: string
          starts_on: string
        }[]
      }
      get_salon_by_slug: {
        Args: { p_slug: string }
        Returns: {
          address: string
          booking_config: Json
          brand_color: string
          cap: string
          city: string
          favicon_url: string
          id: string
          logo_url: string
          name: string
          operating_hours: Json
          phone: string
          province: string
          public_email: string
          slot_granularity_min: number
        }[]
      }
      get_user_role: { Args: never; Returns: string }
      get_user_salon_id: { Args: never; Returns: string }
      grant_whatsapp_topup: {
        Args: { p_credits: number; p_salon_id: string; p_session_id: string }
        Returns: number
      }
      is_client_allowed_to_book: {
        Args: { p_email: string; p_phone: string; p_salon_id: string }
        Returns: boolean
      }
      platform_salon_stats: {
        Args: { p_month_start: string; p_salon_ids: string[] }
        Returns: {
          clients_count: number
          fiches_this_month: number
          products_revenue: number
          salon_id: string
          services_revenue: number
        }[]
      }
      refund_whatsapp_credit: {
        Args: { p_fiche_id: string; p_salon_id: string }
        Returns: number
      }
      search_global: {
        Args: { q: string }
        Returns: {
          entity_type: string
          id: string
          label: string
          score: number
          subtitle: string
        }[]
      }
      show_limit: { Args: never; Returns: number }
      show_trgm: { Args: { "": string }; Returns: string[] }
      statistiche: {
        Args: { p_from: string; p_salon_id?: string; p_to: string }
        Returns: Json
      }
      statistiche_andamento: {
        Args: { p_mesi?: number; p_salon_id?: string }
        Returns: Json
      }
      update_fiche_with_audit: {
        Args: { p_fiche_id: string; p_patch: Json; p_reason?: string }
        Returns: {
          booking_source: string
          cancel_token: string | null
          client_id: string | null
          created_at: string
          datetime: string | null
          id: string
          miscela: string | null
          note: string | null
          paid: boolean
          review_request_error: string | null
          review_request_sent_at: string | null
          review_request_sid: string | null
          review_request_status: string | null
          salon_id: string
          send_review_request: boolean
          status: string | null
          tecnica: string | null
          total_override: number | null
          updated_at: string
          updated_by: string | null
        }
        SetofOptions: {
          from: "*"
          to: "fiches"
          isOneToOne: true
          isSetofReturn: false
        }
      }
    }
    Enums: {
      FicheStatus: "Completed" | "Pending" | "Created"
      prospect_status:
        | "not_contacted"
        | "no_answer"
        | "callback_scheduled"
        | "not_interested"
        | "no_pc"
        | "interested"
        | "materials_sent"
        | "signed_up"
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
      FicheStatus: ["Completed", "Pending", "Created"],
      prospect_status: [
        "not_contacted",
        "no_answer",
        "callback_scheduled",
        "not_interested",
        "no_pc",
        "interested",
        "materials_sent",
        "signed_up",
      ],
    },
  },
} as const
