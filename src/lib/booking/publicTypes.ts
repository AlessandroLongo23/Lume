// Shapes of the rows returned by the public booking SECURITY DEFINER
// helpers. Kept in one place because both the server-side page (fetching
// the initial data) and the client-side wizard (fetching slots/operators
// after the visitor interacts) consume them.

export type BookableService = {
  id: string;
  name: string;
  duration: number;
  price: number;
  description: string | null;
  category_id: string | null;
  image_url: string | null;
};

export type BookableOperator = {
  id: string;
  first_name: string;
  last_name: string;
  avatar_url: string | null;
};

export type AvailableSlot = {
  start_at: string;
  end_at: string;
  operator_id: string;
};

export type PublicClosure = {
  starts_on: string;
  ends_on: string;
};

// Visitor-provided identity collected in the booking flow's identity step.
// Sent verbatim to /api/public/bookings, which passes it to
// create_online_booking — that function dedupes phone first, then email.
export type BookingIdentity = {
  first_name: string;
  last_name: string;
  phone_prefix: string;
  phone: string;
  email: string | null;
  note: string | null;
};

export type BookingResult =
  | { success: true; status: 'created' | 'pending_approval'; fiche_id: string }
  | { success: false; error: string };
