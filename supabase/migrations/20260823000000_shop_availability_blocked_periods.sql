-- shop_availability: weekly working hours per shop
CREATE TABLE public.shop_availability (
  id          uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id     uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  day_of_week smallint NOT NULL CHECK (day_of_week BETWEEN 0 AND 6),
  opens_at    time NOT NULL DEFAULT '09:00',
  closes_at   time NOT NULL DEFAULT '18:00',
  is_open     boolean NOT NULL DEFAULT true,
  UNIQUE (shop_id, day_of_week)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.shop_availability TO authenticated;
GRANT SELECT ON public.shop_availability TO anon;
GRANT ALL ON public.shop_availability TO service_role;

ALTER TABLE public.shop_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "shop_availability public read"
  ON public.shop_availability FOR SELECT USING (true);

CREATE POLICY "owner manage shop_availability"
  ON public.shop_availability FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

CREATE INDEX shop_availability_shop_idx ON public.shop_availability(shop_id);

-- blocked_periods: date/time ranges when shop is unavailable
CREATE TABLE public.blocked_periods (
  id         uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  shop_id    uuid NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
  starts_at  timestamptz NOT NULL,
  ends_at    timestamptz NOT NULL,
  label      text,
  created_at timestamptz NOT NULL DEFAULT now(),
  CHECK (ends_at > starts_at)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.blocked_periods TO authenticated;
GRANT SELECT ON public.blocked_periods TO anon;
GRANT ALL ON public.blocked_periods TO service_role;

ALTER TABLE public.blocked_periods ENABLE ROW LEVEL SECURITY;

CREATE POLICY "blocked_periods public read"
  ON public.blocked_periods FOR SELECT USING (true);

CREATE POLICY "owner manage blocked_periods"
  ON public.blocked_periods FOR ALL TO authenticated
  USING  (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.shops s WHERE s.id = shop_id AND s.owner_id = auth.uid()));

CREATE INDEX blocked_periods_shop_idx ON public.blocked_periods(shop_id, starts_at);
