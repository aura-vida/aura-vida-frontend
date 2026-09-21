CREATE TABLE public.orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  razorpay_order_id text NOT NULL UNIQUE,
  razorpay_payment_id text,
  amount integer NOT NULL,
  currency text NOT NULL DEFAULT 'INR',
  item_id text NOT NULL,
  item_name text NOT NULL,
  item_type text NOT NULL,
  customer_name text,
  customer_email text,
  customer_phone text,
  details jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'created',
  paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT ALL ON public.orders TO service_role;

ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No public access to orders" ON public.orders FOR SELECT TO authenticated USING (false);

CREATE INDEX orders_created_at_idx ON public.orders (created_at DESC);