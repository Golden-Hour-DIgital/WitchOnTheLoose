-- ============================================
-- Add is_taxable to products (PA category-based tax)
-- ============================================
ALTER TABLE products
  ADD COLUMN IF NOT EXISTS is_taxable BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN products.is_taxable IS
  'If true, apply sales tax when shipping to PA. Clothing/vintage clothing: false. Leather accessories, jewelry, cosmetics: true.';

-- Sensible defaults for existing rows based on category:
--   leather  -> taxable (handbags, belts, wallets)
--   herbals  -> taxable (soaps, cosmetics; she can uncheck for food/supplements)
--   clothing -> not taxable (PA exemption)
--   vintage  -> not taxable (clothing exemption; she can flip for non-clothing vintage)
UPDATE products SET is_taxable = TRUE  WHERE category IN ('leather', 'herbals');
UPDATE products SET is_taxable = FALSE WHERE category IN ('clothing', 'vintage');

-- ============================================
-- Storage bucket for product images
-- ============================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', TRUE)
ON CONFLICT (id) DO NOTHING;

-- Public read (anyone can view product images)
DROP POLICY IF EXISTS "Public read product images" ON storage.objects;
CREATE POLICY "Public read product images"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'product-images');

-- Only authenticated users can insert/update/delete — the API route further restricts
-- to ADMIN_EMAILS before calling storage, so authenticated-only here is sufficient.
DROP POLICY IF EXISTS "Authenticated write product images" ON storage.objects;
CREATE POLICY "Authenticated write product images"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated update product images" ON storage.objects;
CREATE POLICY "Authenticated update product images"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "Authenticated delete product images" ON storage.objects;
CREATE POLICY "Authenticated delete product images"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'product-images');
