-- ============================================
-- Sample Products Seed (development only)
-- ============================================

INSERT INTO products (name, slug, description, price, category, featured_image, images, status, is_featured, materials, dimensions, care_instructions)
VALUES
(
    'Midnight Velvet Cloak',
    'midnight-velvet-cloak',
    'A sweeping, floor-length cloak in deep midnight velvet. Hand-stitched with invisible seams and a hidden inner pocket just big enough for a sprig of rosemary or a small charm.',
    285.00,
    'clothing',
    '',
    '[]',
    'available',
    TRUE,
    'Reclaimed velvet, cotton lining',
    'One size fits most. Length: 58"',
    'Spot clean only. Hang dry. Do not machine wash.'
),
(
    'Waxed Canvas Herb Pouch',
    'waxed-canvas-herb-pouch',
    'A small, rugged pouch in waxed canvas with a hand-tooled botanical motif on the front. Fits herbs, crystals, coins, or anything sacred to you.',
    68.00,
    'leather',
    '',
    '[]',
    'available',
    TRUE,
    'Waxed canvas, brass hardware, leather strap',
    '5" x 4" x 1.5"',
    'Wipe clean with damp cloth. Re-wax annually for best waterproofing.'
),
(
    'Mugwort Dream Salve',
    'mugwort-dream-salve',
    'A slow-craft dream salve made with wildcrafted mugwort, lavender, and beeswax. Apply to temples and wrists before sleep. Aids vivid dreaming and restful nights.',
    32.00,
    'herbals',
    '',
    '[]',
    'available',
    TRUE,
    'Mugwort (Artemisia vulgaris), lavender essential oil, organic beeswax, jojoba oil',
    '2 oz glass jar',
    'Keep in a cool, dark place. Use within 12 months.'
),
(
    'Patchwork Forest Jacket',
    'patchwork-forest-jacket',
    'An oversized, boxy jacket assembled from fabric scraps — greens, browns, and a flash of gold. No two pieces are the same; this one is layered with intention.',
    320.00,
    'clothing',
    '',
    '[]',
    'available',
    FALSE,
    'Mixed reclaimed fabrics: linen, cotton, wool',
    'Fits S–L. Bust: 50", Length: 26"',
    'Hand wash cold, lay flat to dry.'
),
(
    'Hand-Stitched Leather Journal Cover',
    'hand-stitched-leather-journal-cover',
    'Fits standard A5 notebooks. Saddle-stitched with waxed linen thread, pre-aged to a warm tobacco brown. This one is for your secrets.',
    110.00,
    'leather',
    '',
    '[]',
    'sold',
    FALSE,
    'Vegetable-tanned leather, waxed linen thread',
    'Fits A5 notebooks (5.8" x 8.3")',
    'Condition with leather balm every few months. Develops beautiful patina over time.'
);
