import type { MergeDeep } from 'type-fest';
import type { Database as GeneratedDatabase } from './database.types';
import type { AbbonamentoPaymentMethod, AbbonamentoPricingMode } from '@/lib/types/Abbonamento';
import type { ActivityAction } from '@/lib/types/ActivityLog';
import type { Stars } from '@/lib/types/ClientRating';
import type {
  CouponDiscountType,
  CouponFreeItemKind,
  CouponKind,
  CouponSalePaymentMethod,
} from '@/lib/types/Coupon';
import type { FicheBookingSource } from '@/lib/types/Fiche';
import type { FichePaymentMethod } from '@/lib/types/fichePaymentMethod';
import type { FicheStatus } from '@/lib/types/ficheStatus';
import type { Gender } from '@/lib/types/Gender';

export type { Json } from './database.types';

/**
 * Corrects the generated types where the schema is looser than the data.
 * Every entry was checked against live data on 2026-10-18 and goes away once
 * the schema enforces it and `npm run db:types` picks that up:
 *
 * - enum columns: `text` in Postgres, but only ever hold the values of a
 *   TypeScript enum (pending: convert to Postgres enums);
 * - non-null columns: nullable in Postgres, but no row holds a null
 *   (pending: `NOT NULL` constraints). Only `Row` is narrowed; writes keep
 *   the generated types.
 */
type ColumnOverrides = {
  public: {
    Tables: {
      abbonamenti: {
        Row:    { pricing_mode: AbbonamentoPricingMode; sale_payment_method: AbbonamentoPaymentMethod };
        Insert: { pricing_mode: AbbonamentoPricingMode; sale_payment_method: AbbonamentoPaymentMethod };
        Update: { pricing_mode?: AbbonamentoPricingMode; sale_payment_method?: AbbonamentoPaymentMethod };
      };
      activity_log: {
        Row:    { action: ActivityAction };
        Insert: { action: ActivityAction };
        Update: { action?: ActivityAction };
      };
      clients: {
        Row:    { gender: Gender | null; firstName: string; lastName: string };
        Insert: { gender?: Gender | null };
        Update: { gender?: Gender | null };
      };
      coupons: {
        Row: {
          kind: CouponKind;
          discount_type: CouponDiscountType;
          free_item_kind: CouponFreeItemKind | null;
          sale_payment_method: CouponSalePaymentMethod | null;
        };
        Insert: {
          kind: CouponKind;
          discount_type: CouponDiscountType;
          free_item_kind?: CouponFreeItemKind | null;
          sale_payment_method?: CouponSalePaymentMethod | null;
        };
        Update: {
          kind?: CouponKind;
          discount_type?: CouponDiscountType;
          free_item_kind?: CouponFreeItemKind | null;
          sale_payment_method?: CouponSalePaymentMethod | null;
        };
      };
      fiche_payments: {
        Row:    { method: FichePaymentMethod };
        Insert: { method: FichePaymentMethod };
        Update: { method?: FichePaymentMethod };
      };
      fiche_services: {
        Row: { fiche_id: string; service_id: string; operator_id: string; end_time: string; duration: number };
      };
      fiches: {
        Row:    { status: FicheStatus; datetime: string; client_id: string; booking_source: FicheBookingSource };
        Insert: { status?: FicheStatus | null; booking_source?: FicheBookingSource };
        Update: { status?: FicheStatus | null; booking_source?: FicheBookingSource };
      };
      manufacturers: {
        Row: { name: string };
      };
      operators: {
        Row: { firstName: string; lastName: string };
      };
      products: {
        Row: { name: string; is_for_retail: boolean; stock_quantity: number; min_threshold: number };
      };
      services: {
        Row: { name: string; price: number };
      };
      spese: {
        Row: { created_at: string };
      };
      suppliers: {
        Row: { name: string };
      };
    };
    Functions: {
      // The generator marks every function argument non-null; these accept null.
      create_online_booking: {
        Args: { p_client_email: string | null; p_note: string | null };
      };
      get_available_slots: {
        Args: { p_operator_id: string | null };
      };
      is_client_allowed_to_book: {
        Args: { p_phone: string | null; p_email: string | null };
      };
    };
    // Every view column comes back nullable; these mirror non-null table columns.
    Views: {
      client_ratings: {
        Row: { client_id: string; salon_id: string; total_spent: number; visit_count: number; spend_stars: Stars; visit_stars: Stars };
      };
      client_stats: {
        Row: { client_id: string; salon_id: string; total_spent: number; visit_count: number; avg_ticket: number };
      };
      products_with_stats: {
        Row: {
          id: string;
          salon_id: string;
          created_at: string;
          name: string;
          is_for_retail: boolean;
          stock_quantity: number;
          min_threshold: number;
          total_purchased: number;
          total_sold: number;
        };
      };
    };
  };
};

export type Database = MergeDeep<GeneratedDatabase, ColumnOverrides>;

type PublicSchema = Database['public'];
type TableName = keyof PublicSchema['Tables'];
type ViewName = keyof PublicSchema['Views'];

/** A row as read from a table or view. */
export type Tables<T extends TableName | ViewName> = T extends TableName
  ? PublicSchema['Tables'][T]['Row']
  : T extends ViewName
    ? PublicSchema['Views'][T]['Row']
    : never;

/** The payload accepted by `.insert()` on a table. */
export type TablesInsert<T extends TableName> = PublicSchema['Tables'][T]['Insert'];

/** The payload accepted by `.update()` on a table. */
export type TablesUpdate<T extends TableName> = PublicSchema['Tables'][T]['Update'];
