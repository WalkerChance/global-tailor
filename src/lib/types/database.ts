// Hand-written domain types for the Phase 1 schema.
// Regenerate a full typed client later with `supabase gen types typescript`.

export type UserRole = "customer" | "tailor" | "admin" | "finisher";

export type VerificationStatus =
  | "unverified"
  | "pending"
  | "verified"
  | "rejected";

export type OrderStatus =
  | "draft"
  | "placed"
  | "accepted"
  | "in_production"
  | "shipped"
  | "delivered"
  | "fit_confirmed"
  | "cancelled";

export type GarmentTypeKey = "suit" | "shirt" | "pants" | (string & {});

export interface TailorProfile {
  user_id: string;
  shop_name: string;
  slug: string;
  bio: string | null;
  location_country: string | null;
  location_city: string | null;
  languages: string[];
  turnaround_days: number | null;
  verification_status: VerificationStatus;
  rating_avg: number | null;
}

export interface GarmentType {
  id: string;
  key: GarmentTypeKey;
  name: string;
  is_standard: boolean;
  owner_tailor_id: string | null;
}

export interface MeasurementField {
  id: string;
  garment_type_id: string;
  key: string;
  label: string;
  unit: string;
  required: boolean;
  sort: number;
  owner_tailor_id: string | null;
}

/** Money is stored as integer minor units (cents) + a currency code. */
export interface Money {
  amount: number;
  currency: string;
}

export function formatMoney({ amount, currency }: Money): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency,
  }).format(amount / 100);
}
