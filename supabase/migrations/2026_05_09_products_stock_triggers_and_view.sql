-- ─── Trigger: order_products → stock increases when a purchase is recorded ────

CREATE OR REPLACE FUNCTION fn_sync_stock_from_order_products()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET stock_quantity = stock_quantity + NEW.quantity WHERE id = NEW.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products SET stock_quantity = stock_quantity + (NEW.quantity - OLD.quantity) WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET stock_quantity = stock_quantity - OLD.quantity WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_order_products_stock ON order_products;
CREATE TRIGGER trg_order_products_stock
AFTER INSERT OR UPDATE OF quantity OR DELETE ON order_products
FOR EACH ROW EXECUTE FUNCTION fn_sync_stock_from_order_products();

-- ─── Trigger: fiche_products → stock decreases when a treatment uses a product ─

CREATE OR REPLACE FUNCTION fn_sync_stock_from_fiche_products()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE products SET stock_quantity = stock_quantity - NEW.quantity WHERE id = NEW.product_id;
  ELSIF TG_OP = 'UPDATE' THEN
    UPDATE products SET stock_quantity = stock_quantity - (NEW.quantity - OLD.quantity) WHERE id = NEW.product_id;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE products SET stock_quantity = stock_quantity + OLD.quantity WHERE id = OLD.product_id;
  END IF;
  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_fiche_products_stock ON fiche_products;
CREATE TRIGGER trg_fiche_products_stock
AFTER INSERT OR UPDATE OF quantity OR DELETE ON fiche_products
FOR EACH ROW EXECUTE FUNCTION fn_sync_stock_from_fiche_products();

-- ─── RPC: atomic stock adjustment for manual +/− corrections ─────────────────
-- SECURITY DEFINER so the UPDATE bypasses RLS; salon_id check keeps it scoped.

CREATE OR REPLACE FUNCTION adjust_product_stock(p_id uuid, p_salon_id uuid, p_delta integer)
RETURNS void LANGUAGE sql SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE products
  SET stock_quantity = stock_quantity + p_delta
  WHERE id = p_id AND salon_id = p_salon_id;
$$;

-- ─── View: products enriched with lifetime purchase and sale totals ───────────
-- security_invoker = true means the caller's RLS (salon_id filter) is enforced
-- on all underlying tables without needing extra policies on the view itself.

CREATE OR REPLACE VIEW products_with_stats
WITH (security_invoker = true) AS
SELECT
  p.*,
  COALESCE(op.total_purchased, 0)::integer AS total_purchased,
  COALESCE(fp.total_sold, 0)::integer      AS total_sold
FROM products p
LEFT JOIN (
  SELECT product_id, SUM(quantity)::integer AS total_purchased
  FROM order_products
  GROUP BY product_id
) op ON op.product_id = p.id
LEFT JOIN (
  SELECT product_id, SUM(quantity)::integer AS total_sold
  FROM fiche_products
  GROUP BY product_id
) fp ON fp.product_id = p.id;
