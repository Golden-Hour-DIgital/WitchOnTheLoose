# Witch on the Loose

E-commerce site for handmade clothing, leather goods, and herbal products.

**Stack:** Next.js 14 · Tailwind CSS · Supabase · Square Payments · Resend

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Set up environment variables

```bash
cp .env.example .env.local
# Fill in values for Supabase, Square, and Resend
```

### 3. Set up the database

- Create a [Supabase](https://supabase.com) project
- Run the migrations in `supabase/migrations/` via the Supabase SQL editor or CLI:

```bash
npx supabase db push
# or paste migration files manually in the SQL editor
```

### 4. Set up Square

- Create a [Square Developer](https://developer.squareup.com) account
- Create an application and get your Application ID, Location ID, and Access Token
- Start with Sandbox environment, switch to Production when ready

### 5. Set up Resend

- Create a [Resend](https://resend.com) account
- Verify your sending domain
- Add your API key to `.env.local`
- Update the `from` email address in `src/app/api/checkout/create-payment/route.ts`

### 6. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Route Structure

| Route | Description |
|---|---|
| `/` | Home page |
| `/shop` | All products with filters |
| `/shop/clothing` | Redirects to /shop?category=clothing |
| `/shop/leather` | Redirects to /shop?category=leather |
| `/shop/herbals` | Redirects to /shop?category=herbals |
| `/shop/[slug]` | Product detail page |
| `/cart` | Shopping cart |
| `/checkout` | Square checkout |
| `/checkout/success` | Order confirmation |
| `/about` | About page |
| `/blog` | Blog listing |
| `/blog/[slug]` | Blog post |
| `/contact` | Contact form |
| `/policies/shipping` | Shipping policy |
| `/policies/returns` | Returns policy |
| `/policies/privacy` | Privacy policy |

## Key Files

```
src/
  app/                  Next.js App Router pages
  components/
    layout/             Header, Footer, Navigation, MobileMenu
    product/            ProductCard, ProductGrid, ProductGallery, AddToCartButton, ShopFilters
    cart/               CartItem
    forms/              ContactForm
    ui/                 Button, Badge
  lib/
    cart-context.tsx    Cart state (localStorage-backed)
    supabase/           Client + server Supabase clients
    utils.ts            cn(), formatPrice(), etc.
  types/index.ts        All TypeScript types

supabase/migrations/    Database schema + seed data
```

## Deploying to Vercel

1. Push to GitHub
2. Import in [Vercel](https://vercel.com)
3. Add all environment variables from `.env.example`
4. Deploy

For production, update `NEXT_PUBLIC_SQUARE_ENV=production` and `SQUARE_API_BASE_URL=https://connect.squareup.com`.

## Content Management

All content is managed via the Supabase dashboard directly (MVP).

- **Products:** `products` table — add/edit/mark as sold
- **Blog posts:** `blog_posts` table — set `status='published'` and `published_at` to go live
- **Orders:** `orders` table — view orders, update status and tracking numbers
- **Messages:** `contact_messages` table — view incoming contact form submissions
