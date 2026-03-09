-- Add 'vintage' to products category constraint
ALTER TABLE products DROP CONSTRAINT IF EXISTS products_category_check;
ALTER TABLE products ADD CONSTRAINT products_category_check
    CHECK (category IN ('clothing', 'leather', 'herbals', 'vintage'));
