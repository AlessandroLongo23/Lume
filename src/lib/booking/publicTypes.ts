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
