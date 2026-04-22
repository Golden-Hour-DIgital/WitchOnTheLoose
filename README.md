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

All content is managed through the admin portal at `/admin`.

1. Add your email to the `ADMIN_EMAILS` environment variable (comma-separated for multiple admins).
2. Visit `/admin/login`, request a magic link, click the link in your email.
3. From the dashboard:
   - **Products** — add, edit, mark sold, set featured. Check **"Taxable in PA"** for leather accessories, jewelry, cosmetics. Leave unchecked for clothing and vintage clothing (PA exempts them).
   - **Orders** — see new orders, copy the shipping address for Pirate Ship, paste tracking numbers back. Setting status to "shipped" with a tracking number emails the customer.
   - **Blog** — write posts in Markdown, toggle draft/published.
   - **Messages** — contact-form submissions, reply by email.

Supabase dashboard access is no longer needed for day-to-day content. Keep it as a backup.

## Tax Notes (Pennsylvania)

- The site charges 6% sales tax on orders shipped to a PA address — but **only on products marked `is_taxable`**.
- PA exempts most clothing and vintage clothing — leave those unchecked.
- Leather accessories, jewelry, cosmetics, and non-food herbals are typically taxable.
- You must have a PA Sales Tax License (free, via myPATH at revenue.pa.gov) before the site starts collecting tax. Until then, toggle `is_taxable` off on all products.
- Philadelphia adds 2% local, Allegheny adds 1%. Current setup uses statewide 6% only. Revisit if she registers for local licenses.

## Production Checklist

Before flipping to production:

- [ ] Square: switch `NEXT_PUBLIC_SQUARE_ENV=production` and `SQUARE_API_BASE_URL=https://connect.squareup.com`; use production App ID / Location ID / Access Token.
- [ ] Resend: add SPF, DKIM, DMARC DNS records on `witchontheloose.com`; verify the `orders@witchontheloose.com` sender.
- [ ] Supabase Auth: Site URL and Redirect URLs include the production domain (`https://www.witchontheloose.com/admin`).
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.witchontheloose.com`.
- [ ] `ADMIN_EMAILS` = the owner's real email(s).
- [ ] PA Sales Tax License obtained; `is_taxable` set correctly on every product.
- [ ] About page: real name swapped in for `[Name]`; headshot uploaded to `public/images/about-founder.jpg` and the placeholder `<span>✦</span>` replaced with `<Image>`.
- [ ] Hero video `public/videos/witch-flying.mp4` present.
- [ ] Vercel project has all env vars set for the Production environment.
- [ ] Run a real low-value purchase end-to-end before announcing launch.
