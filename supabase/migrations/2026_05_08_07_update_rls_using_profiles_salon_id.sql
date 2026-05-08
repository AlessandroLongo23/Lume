-- Five legacy RLS policies bypassed get_user_salon_id() and read profiles.salon_id
-- directly. Once PR C drops profiles.salon_id, those would break. Convert them
-- to use get_user_salon_id() now so PR C is mechanical.

-- fiche_payments
DROP POLICY IF EXISTS salon_members_own_payments ON public.fiche_payments;
CREATE POLICY salon_members_own_payments ON public.fiche_payments
  FOR ALL
  USING (salon_id = public.get_user_salon_id())
  WITH CHECK (salon_id = public.get_user_salon_id());

-- obiettivi
DROP POLICY IF EXISTS salon_members_all ON public.obiettivi;
CREATE POLICY salon_members_all ON public.obiettivi
  FOR ALL
  USING (salon_id = public.get_user_salon_id())
  WITH CHECK (salon_id = public.get_user_salon_id());

-- product_price_history
DROP POLICY IF EXISTS salon_read_own_product_history ON public.product_price_history;
CREATE POLICY salon_read_own_product_history ON public.product_price_history
  FOR SELECT
  USING (salon_id = public.get_user_salon_id());

-- service_price_history
DROP POLICY IF EXISTS salon_read_own_service_history ON public.service_price_history;
CREATE POLICY salon_read_own_service_history ON public.service_price_history
  FOR SELECT
  USING (salon_id = public.get_user_salon_id());

-- spese
DROP POLICY IF EXISTS salon_members_all ON public.spese;
CREATE POLICY salon_members_all ON public.spese
  FOR ALL
  USING (salon_id = public.get_user_salon_id())
  WITH CHECK (salon_id = public.get_user_salon_id());
