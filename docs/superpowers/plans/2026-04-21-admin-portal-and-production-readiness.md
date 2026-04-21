# Admin Portal & Production Readiness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a complete admin portal for Witch on the Loose, fix sales tax to be Pennsylvania-correct per-category, add a shipment-notification email, and finish the production-readiness items (Supabase Storage for product images, About-page placeholders, env hardening) so the site can be handed to the client for real use.

**Architecture:** A `/admin/*` route tree inside the existing Next.js App Router app, guarded by Next.js middleware that checks a Supabase Auth session against an `ADMIN_EMAILS` allowlist. Admin mutations go through `/api/admin/*` API routes that double-check the session and then use the existing service-role client. Product images live in a Supabase Storage bucket uploaded via an API route. Tax is computed server-side from cart contents + shipping state + per-product `is_taxable` flag.

**Tech Stack:** Next.js 14 App Router, TypeScript, Tailwind CSS, Supabase (Postgres + Auth + Storage), Resend, Vitest (added in Task 2 for the one unit-tested module — the tax calculator).

---

## File Structure

**New files:**

```
src/
  middleware.ts                                         # Supabase session refresh + /admin guard
  lib/
    tax.ts                                              # Pure tax calculation (unit tested)
    tax.test.ts                                         # Vitest tests for tax
    admin-auth.ts                                       # getAdminSession() server helper
    resend.ts                                           # Shared Resend client + email templates
  app/
    admin/
      layout.tsx                                        # Admin chrome (sidebar, sign out) + auth guard
      page.tsx                                          # Dashboard: stats + recent orders
      login/
        page.tsx                                        # Magic-link login form
      orders/
        page.tsx                                        # Orders list
        [id]/
          page.tsx                                      # Order detail + status/tracking form
      products/
        page.tsx                                        # Products list
        new/
          page.tsx                                      # Create product
        [id]/
          edit/
            page.tsx                                    # Edit product
      blog/
        page.tsx                                        # Blog list
        new/
          page.tsx                                      # Create post
        [id]/
          edit/
            page.tsx                                    # Edit post
      messages/
        page.tsx                                        # Contact inbox
      _components/
        AdminSidebar.tsx
        OrderStatusForm.tsx
        ProductForm.tsx
        BlogPostForm.tsx
        ImageUploader.tsx
        CopyAddressButton.tsx
    api/
      admin/
        orders/
          [id]/
            route.ts                                    # PATCH: update status/tracking (fires shipped email)
        products/
          route.ts                                      # POST: create product
          [id]/
            route.ts                                    # PATCH, DELETE
        blog/
          route.ts                                      # POST: create post
          [id]/
            route.ts                                    # PATCH, DELETE
        messages/
          [id]/
            route.ts                                    # PATCH: mark read
        upload/
          route.ts                                      # POST: product image upload to Storage
supabase/
  migrations/
    20260421000000_add_is_taxable_and_storage.sql       # is_taxable column, storage bucket + policies
vitest.config.ts
```

**Modified files:**

- `package.json` — add `vitest`, `@vitejs/plugin-react`, `jsdom`, `@testing-library/react`; add `test` script
- `src/types/index.ts` — add `is_taxable` to `Product`; add admin helper types
- `src/lib/supabase/server.ts` — unchanged, but reused in middleware
- `src/app/checkout/page.tsx` — replace hardcoded 8% with call to new tax function
- `src/app/api/checkout/create-payment/route.ts` — recompute tax server-side (don't trust client); factor email into `lib/resend.ts`
- `src/app/about/page.tsx` — real founder name/bio placeholders + photo slot ready
- `.env.example` — add `ADMIN_EMAILS`, `NEXT_PUBLIC_SITE_URL`
- `README.md` — production env checklist; content-management note flipped ("use /admin", not Supabase dashboard)

---

## Pre-flight Notes

- Supabase Auth: use **magic link** flow (no password). She clicks the link in her email, gets a session cookie, middleware lets her into `/admin`.
- `ADMIN_EMAILS` is a comma-separated env var, e.g. `ADMIN_EMAILS=shannon@witchontheloose.com,tsummers9036@gmail.com`. The app checks `session.user.email` against this list. An email NOT in the list is logged in to Supabase but bounced at the middleware → gets redirected to `/admin/login?error=not-admin`.
- Supabase Storage bucket: `product-images`, public-read, insert restricted to authenticated admins via an RLS policy on `storage.objects`.
- Pennsylvania tax:
  - Non-PA shipping state → tax = 0
  - PA shipping state + item with `is_taxable=false` → that line = 0
  - PA + `is_taxable=true` → 6% (flat statewide rate; ignore county surcharges for v1; add a TODO note)
- Pirate Ship has no official public API at her volume. The "Copy Address" button just puts a USPS-format address string on the clipboard.
- Shipping email fires when order transitions from any status → `shipped` AND tracking_number is non-empty. We detect the transition in the PATCH route by reading the old status before the update.
- No existing tests. Adding Vitest only for `src/lib/tax.ts` (pure function, high value, cheap to test). Everything else is verified via manual run steps.

---

## Task 1: Database migration — is_taxable, storage bucket, storage policies

**Files:**
- Create: `supabase/migrations/20260421000000_add_is_taxable_and_storage.sql`

- [ ] **Step 1: Write the migration**

```sql
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
```

- [ ] **Step 2: Apply the migration**

Run in Supabase SQL editor (paste file contents) OR via CLI:

```bash
npx supabase db push
```

Expected: migration succeeds, no errors. Verify in Supabase dashboard → Storage → `product-images` bucket exists → Products table has `is_taxable` column.

- [ ] **Step 3: Commit**

```bash
git add supabase/migrations/20260421000000_add_is_taxable_and_storage.sql
git commit -m "feat(db): add is_taxable column and product-images storage bucket"
```

---

## Task 2: Set up Vitest (for tax tests only)

**Files:**
- Modify: `package.json`
- Create: `vitest.config.ts`

- [ ] **Step 1: Install Vitest**

```bash
cd C:/tmp/WitchOnTheLoose
npm install --save-dev vitest @vitejs/plugin-react jsdom
```

- [ ] **Step 2: Create `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";

export default defineConfig({
  plugins: [react()],
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
});
```

- [ ] **Step 3: Add `test` script to `package.json`**

In the `scripts` block, add:

```json
"test": "vitest run",
"test:watch": "vitest"
```

- [ ] **Step 4: Verify Vitest runs (empty suite)**

Run: `npm test`
Expected: "No test files found" — that's fine, no tests yet.

- [ ] **Step 5: Commit**

```bash
git add package.json package-lock.json vitest.config.ts
git commit -m "chore: add Vitest for unit tests"
```

---

## Task 3: Tax calculator (TDD)

**Files:**
- Create: `src/lib/tax.ts`
- Create: `src/lib/tax.test.ts`

- [ ] **Step 1: Write the failing tests**

```ts
// src/lib/tax.test.ts
import { describe, it, expect } from "vitest";
import { calculateTax, PA_TAX_RATE } from "./tax";

type Item = { price: number; is_taxable: boolean };

describe("calculateTax", () => {
  it("returns 0 when shipping outside PA", () => {
    const items: Item[] = [
      { price: 100, is_taxable: true },
      { price: 50, is_taxable: false },
    ];
    expect(calculateTax(items, "NY")).toBe(0);
    expect(calculateTax(items, "CA")).toBe(0);
  });

  it("returns 0 when PA but no items are taxable", () => {
    const items: Item[] = [
      { price: 100, is_taxable: false },
      { price: 50, is_taxable: false },
    ];
    expect(calculateTax(items, "PA")).toBe(0);
  });

  it("applies 6% to taxable items only when shipping to PA", () => {
    const items: Item[] = [
      { price: 100, is_taxable: true },  // taxable
      { price: 50, is_taxable: false },  // exempt
    ];
    // 100 * 0.06 = 6.00
    expect(calculateTax(items, "PA")).toBeCloseTo(6.0, 2);
  });

  it("sums taxable items across the cart", () => {
    const items: Item[] = [
      { price: 100, is_taxable: true },
      { price: 50, is_taxable: true },
      { price: 25, is_taxable: false },
    ];
    // (100 + 50) * 0.06 = 9.00
    expect(calculateTax(items, "PA")).toBeCloseTo(9.0, 2);
  });

  it("rounds to cents (2 decimals)", () => {
    const items: Item[] = [{ price: 33.33, is_taxable: true }];
    // 33.33 * 0.06 = 1.9998 → 2.00
    expect(calculateTax(items, "PA")).toBe(2.0);
  });

  it("is case-insensitive on state code", () => {
    const items: Item[] = [{ price: 100, is_taxable: true }];
    expect(calculateTax(items, "pa")).toBeCloseTo(6.0, 2);
    expect(calculateTax(items, "Pa")).toBeCloseTo(6.0, 2);
  });

  it("exports the PA rate as a constant", () => {
    expect(PA_TAX_RATE).toBe(0.06);
  });
});
```

- [ ] **Step 2: Run the tests to confirm they fail**

Run: `npm test -- tax.test.ts`
Expected: FAIL — "Cannot find module './tax'"

- [ ] **Step 3: Implement the tax function**

```ts
// src/lib/tax.ts
export const PA_TAX_RATE = 0.06;

export interface TaxableItem {
  price: number;
  is_taxable: boolean;
}

/**
 * Sales tax for Witch on the Loose.
 *
 * Rule: only charge PA customers, only on taxable items. PA exempts most clothing;
 * the `is_taxable` flag on each product records whether it's taxable under PA rules.
 *
 * TODO(tax-v2): Philadelphia adds 2% local, Allegheny adds 1%. If/when she registers
 * for local licenses or the site grows, switch to destination-based by ZIP lookup.
 */
export function calculateTax(items: TaxableItem[], shippingState: string): number {
  if (shippingState.toUpperCase() !== "PA") return 0;

  const taxableSubtotal = items
    .filter((i) => i.is_taxable)
    .reduce((sum, i) => sum + i.price, 0);

  return Math.round(taxableSubtotal * PA_TAX_RATE * 100) / 100;
}
```

- [ ] **Step 4: Run tests to confirm they pass**

Run: `npm test -- tax.test.ts`
Expected: PASS (7 passing)

- [ ] **Step 5: Commit**

```bash
git add src/lib/tax.ts src/lib/tax.test.ts
git commit -m "feat(tax): per-category PA sales tax calculator with tests"
```

---

## Task 4: Update Product type

**Files:**
- Modify: `src/types/index.ts`

- [ ] **Step 1: Add `is_taxable` to the Product interface**

In `src/types/index.ts`, inside `interface Product`, add `is_taxable: boolean;` (alphabetical by group — drop it next to the other `is_*` booleans):

```ts
  is_one_of_one: boolean;
  is_featured: boolean;
  is_taxable: boolean;
```

- [ ] **Step 2: Verify type-check passes**

Run: `npx tsc --noEmit`
Expected: PASS (or only pre-existing unrelated errors). Existing `Product` literals aren't strictly-constructed anywhere, but fix any surfaced error by adding `is_taxable: false` where needed.

- [ ] **Step 3: Commit**

```bash
git add src/types/index.ts
git commit -m "feat(types): add is_taxable to Product"
```

---

## Task 5: Wire the tax calculator into checkout (client)

**Files:**
- Modify: `src/app/checkout/page.tsx:23-47`

- [ ] **Step 1: Replace the hardcoded tax calculation**

Delete lines 23-24:

```ts
const SHIPPING_FLAT = 8.00;
const TAX_RATE = 0.08; // 8% — adjust per state
```

Replace with:

```ts
import { calculateTax } from "@/lib/tax";

const SHIPPING_FLAT = 8.00;
```

Then replace the tax computation around line 46. The cart doesn't carry `is_taxable` today, so we fetch the current products to know. Simpler path for v1: include `is_taxable` in the `CartItem.product` shape (update [src/lib/cart-context.tsx] and [src/types/index.ts] `CartItem` pick to include `is_taxable`). Then in the page:

```ts
const taxableItems = items.map((i) => ({
  price: i.product.price,
  is_taxable: i.product.is_taxable,
}));
const tax = calculateTax(taxableItems, form.state);
```

- [ ] **Step 2: Update `CartItem` type**

In `src/types/index.ts`, change `CartItem`:

```ts
export interface CartItem {
  product: Pick<Product, "id" | "name" | "slug" | "price" | "featured_image" | "status" | "is_taxable">;
}
```

- [ ] **Step 3: Update add-to-cart sites**

Find every place that pushes to the cart and make sure `is_taxable` is included. Run:

```bash
grep -rn "addItem\|addToCart" src/
```

For each call site (likely `src/components/product/AddToCartButton.tsx` and `src/app/shop/[slug]/page.tsx`), confirm they pass the full `product` object from a DB fetch (which now includes `is_taxable`). If they hand-construct a trimmed object, add `is_taxable: product.is_taxable` there.

- [ ] **Step 4: Manual verification**

Run: `npm run dev`

Visit `http://localhost:3000`, add a taxable item (e.g. a leather good) to the cart, go to `/checkout`, type PA in the State field — verify tax line appears at 6%. Type NY — verify tax drops to $0.00. Remove the leather item, add a clothing item, stay in PA — verify tax is $0.00.

- [ ] **Step 5: Commit**

```bash
git add src/app/checkout/page.tsx src/types/index.ts src/lib/cart-context.tsx
git commit -m "feat(checkout): per-category PA tax on checkout totals"
```

---

## Task 6: Server-side tax recomputation in payment API

**Files:**
- Modify: `src/app/api/checkout/create-payment/route.ts`

Never trust client-computed money.

- [ ] **Step 1: Refactor the POST handler to recompute totals server-side**

After parsing the request body (line 12-24), fetch the full products from Supabase by the `product_id`s the client sent, then recompute subtotal/tax/total server-side and compare. Replace `amount` math with the server's recomputation.

```ts
import { calculateTax } from "@/lib/tax";

// ... inside POST, after `const body = await req.json();`:

const { sourceId, items, shippingAddress, customerEmail, customerName } = body;

if (!Array.isArray(items) || items.length === 0) {
  return NextResponse.json({ error: "Cart is empty" }, { status: 400 });
}

const supabase = createServiceClient();

// Re-fetch each product (prices + is_taxable) — source of truth is DB, not client.
const productIds = items.map((i: { product_id: string }) => i.product_id);
const { data: products, error: pErr } = await supabase
  .from("products")
  .select("id, name, slug, price, featured_image, status, is_taxable")
  .in("id", productIds);

if (pErr || !products || products.length !== items.length) {
  return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
}

// Reject if any product is already sold.
const soldOut = products.find((p) => p.status !== "available");
if (soldOut) {
  return NextResponse.json(
    { error: `${soldOut.name} has already been sold` },
    { status: 409 }
  );
}

const subtotal = products.reduce((sum, p) => sum + Number(p.price), 0);
const shipping = 8.0;
const tax = calculateTax(
  products.map((p) => ({ price: Number(p.price), is_taxable: p.is_taxable })),
  shippingAddress.state
);
const total = Math.round((subtotal + shipping + tax) * 100) / 100;
const amount = Math.round(total * 100); // cents for Square
```

Then use these server-computed values when inserting the order and building the email. Remove the `subtotal`, `shipping`, `tax`, `total`, `amount` that came from the body.

- [ ] **Step 2: Manual verification**

1. `npm run dev`
2. Open browser dev tools → Network. Add a taxable item to cart, go to checkout, but before submitting, edit the request body in a test (or use a tool like Postman) to send a tampered `amount` — verify the API ignores it and charges the correct amount.
3. Do a happy-path purchase through Square sandbox and confirm the order row in Supabase has correct subtotal/tax/total.

- [ ] **Step 3: Commit**

```bash
git add src/app/api/checkout/create-payment/route.ts
git commit -m "fix(checkout): recompute totals server-side; never trust client prices"
```

---

## Task 7: Environment variables — admin emails, site URL

**Files:**
- Modify: `.env.example`
- Modify: local `.env.local` (manual, not committed)

- [ ] **Step 1: Append to `.env.example`**

```
# ─── Admin Access ────────────────────────────────
# Comma-separated emails allowed to sign into /admin
ADMIN_EMAILS=shannon@witchontheloose.com

# Public URL of the site (used for magic-link redirect)
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

- [ ] **Step 2: Copy into `.env.local`**

Add matching values to your local `.env.local` (use your own email for testing). Restart the dev server after editing.

- [ ] **Step 3: Commit**

```bash
git add .env.example
git commit -m "chore: add ADMIN_EMAILS and NEXT_PUBLIC_SITE_URL env vars"
```

---

## Task 8: Admin auth helper + middleware

**Files:**
- Create: `src/lib/admin-auth.ts`
- Create: `src/middleware.ts`

- [ ] **Step 1: Create `src/lib/admin-auth.ts`**

```ts
import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";

export function parseAdminEmails(): string[] {
  return (process.env.ADMIN_EMAILS ?? "")
    .split(",")
    .map((e) => e.trim().toLowerCase())
    .filter(Boolean);
}

export function isAdminEmail(email: string | null | undefined): boolean {
  if (!email) return false;
  return parseAdminEmails().includes(email.toLowerCase());
}

/**
 * For server components / API routes: returns the session if the caller is an admin,
 * otherwise redirects to /admin/login (server components) or throws (use getAdminSessionOrNull for API).
 */
export async function requireAdmin() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) {
    redirect("/admin/login");
  }
  return user;
}

export async function getAdminUserOrNull() {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user || !isAdminEmail(user.email)) return null;
  return user;
}
```

- [ ] **Step 2: Create `src/middleware.ts`**

```ts
import { NextResponse, type NextRequest } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { parseAdminEmails } from "@/lib/admin-auth";

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh the session cookie on every request so it doesn't expire mid-navigation.
  const { data: { user } } = await supabase.auth.getUser();

  const pathname = request.nextUrl.pathname;
  const isAdminRoute = pathname.startsWith("/admin") && pathname !== "/admin/login";
  const isAdminApi = pathname.startsWith("/api/admin");

  if (isAdminRoute || isAdminApi) {
    const allowed = parseAdminEmails();
    const email = user?.email?.toLowerCase();
    const ok = !!email && allowed.includes(email);
    if (!ok) {
      if (isAdminApi) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      url.searchParams.set("from", pathname);
      return NextResponse.redirect(url);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Run on all routes except static assets, Next internals, and image optimization.
     * This is required so Supabase can refresh the auth cookie on every navigation.
     */
    "/((?!_next/static|_next/image|favicon.ico|videos|images|.*\\.(?:png|jpg|jpeg|svg|webp|ico|mp4)).*)",
  ],
};
```

- [ ] **Step 3: Manual verification**

1. `npm run dev`
2. Visit `/admin` — expect redirect to `/admin/login` (page doesn't exist yet, you'll get a 404 at `/admin/login` — that's fine, we build it next).

- [ ] **Step 4: Commit**

```bash
git add src/lib/admin-auth.ts src/middleware.ts
git commit -m "feat(admin): auth helpers and middleware guard for /admin and /api/admin"
```

---

## Task 9: Admin login page (magic link)

**Files:**
- Create: `src/app/admin/login/page.tsx`

- [ ] **Step 1: Create the login page**

```tsx
"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(null);

    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/admin`,
        shouldCreateUser: true,
      },
    });

    if (authError) {
      setError(authError.message);
      setState("error");
    } else {
      setState("sent");
    }
  };

  return (
    <div className="container-site py-20 max-w-md animate-fade-in">
      <h1 className="section-heading mb-2">Admin Sign-In</h1>
      <p className="section-subheading mb-10">
        Enter your email and we&apos;ll send you a magic link.
      </p>

      {state === "sent" ? (
        <div className="card p-6 text-center">
          <p className="font-serif text-ink">
            Check <strong>{email}</strong> for your sign-in link.
          </p>
          <p className="text-xs text-ink/40 mt-3 font-serif italic">
            Didn&apos;t arrive? Check spam, or try again in a minute.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30"
          />
          {error && (
            <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" loading={state === "sending"}>
            Send magic link
          </Button>
        </form>
      )}
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

1. `npm run dev`
2. Visit `/admin/login`. Enter your (ADMIN_EMAILS-listed) email.
3. Check your inbox for the magic link. Click it.
4. You should land on `/admin` — expect another 404 for now (page doesn't exist yet), but the URL should be `/admin`, not `/admin/login`.

If the magic link doesn't arrive: in Supabase dashboard → Authentication → URL Configuration → set `Site URL` to `http://localhost:3000` and add `http://localhost:3000/admin` to `Redirect URLs`.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/login/page.tsx
git commit -m "feat(admin): magic-link login page"
```

---

## Task 10: Admin chrome (layout, sidebar, sign-out)

**Files:**
- Create: `src/app/admin/layout.tsx`
- Create: `src/app/admin/_components/AdminSidebar.tsx`

- [ ] **Step 1: Create `AdminSidebar.tsx`**

```tsx
"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { LayoutDashboard, Package, ShoppingBag, FileText, Mail, LogOut } from "lucide-react";

const LINKS = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboard },
  { href: "/admin/orders", label: "Orders", icon: ShoppingBag },
  { href: "/admin/products", label: "Products", icon: Package },
  { href: "/admin/blog", label: "Blog", icon: FileText },
  { href: "/admin/messages", label: "Messages", icon: Mail },
];

export function AdminSidebar({ email }: { email: string }) {
  const pathname = usePathname();
  const router = useRouter();

  const signOut = async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/admin/login");
  };

  return (
    <aside className="w-56 shrink-0 border-r border-moss/10 bg-cream/30 min-h-screen p-4 flex flex-col">
      <div className="font-display text-2xl text-magic mb-8 px-2">Witch Admin</div>
      <nav className="space-y-1 flex-1">
        {LINKS.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || (href !== "/admin" && pathname.startsWith(href));
          return (
            <Link
              key={href}
              href={href}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-sans transition ${
                active ? "bg-magic/10 text-magic" : "text-ink/70 hover:bg-moss/5"
              }`}
            >
              <Icon size={16} />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-moss/10 pt-3 mt-3">
        <p className="text-xs text-ink/40 px-2 pb-2 truncate font-serif italic">{email}</p>
        <button
          onClick={signOut}
          className="flex items-center gap-3 w-full px-3 py-2 rounded-lg text-sm font-sans text-ink/70 hover:bg-mushroom/10 hover:text-mushroom"
        >
          <LogOut size={16} />
          Sign out
        </button>
      </div>
    </aside>
  );
}
```

- [ ] **Step 2: Create `src/app/admin/layout.tsx`**

```tsx
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "./_components/AdminSidebar";
import { headers } from "next/headers";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  // Login page has its own layout — detect and skip chrome.
  const pathname = headers().get("x-pathname") ?? "";
  if (pathname.endsWith("/admin/login")) return <>{children}</>;

  const user = await requireAdmin();

  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar email={user.email ?? ""} />
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
```

Note: Next.js App Router doesn't automatically expose pathname in headers. Instead, put the login page outside the admin layout by using a route group. Restructure:

Move `src/app/admin/login/page.tsx` to `src/app/(admin-public)/admin/login/page.tsx` — OR simpler, just let the login page render inside `AdminLayout` and have `requireAdmin()` not redirect if already on `/login`. Cleanest path: make the login page its **own** segment by wrapping only authenticated admin routes in a subfolder. Use this structure:

```
src/app/admin/
  login/page.tsx          # public
  (authed)/
    layout.tsx            # the one above, calls requireAdmin
    page.tsx              # dashboard
    orders/…
    products/…
    blog/…
    messages/…
```

**Do the restructure now:** `mkdir src/app/admin/(authed)` and move all authenticated admin pages into it. The URL paths stay the same because `(authed)` is a route group. `src/app/admin/layout.tsx` can be removed — use `src/app/admin/(authed)/layout.tsx` instead, with the content above (minus the `x-pathname` check).

Final layout file:

```tsx
// src/app/admin/(authed)/layout.tsx
import { requireAdmin } from "@/lib/admin-auth";
import { AdminSidebar } from "../_components/AdminSidebar";

export default async function AdminAuthedLayout({ children }: { children: React.ReactNode }) {
  const user = await requireAdmin();
  return (
    <div className="flex min-h-screen bg-cream">
      <AdminSidebar email={user.email ?? ""} />
      <main className="flex-1 p-8 overflow-x-auto">{children}</main>
    </div>
  );
}
```

Move `AdminSidebar.tsx` to `src/app/admin/_components/AdminSidebar.tsx` (shared; `_components` is ignored by the router).

- [ ] **Step 3: Add a placeholder dashboard so you can verify the layout**

```tsx
// src/app/admin/(authed)/page.tsx
export default function AdminDashboard() {
  return <div className="font-serif text-ink">Dashboard (coming in Task 11)</div>;
}
```

- [ ] **Step 4: Manual verification**

1. `npm run dev`
2. Sign in via `/admin/login`.
3. Verify you land on `/admin` with a sidebar visible.
4. Click each nav link — the others 404 (not built yet), that's fine. Nav highlight should update.
5. Click "Sign out" — verify redirect to `/admin/login`.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin
git commit -m "feat(admin): authenticated layout, sidebar, sign-out"
```

---

## Task 11: Dashboard page

**Files:**
- Modify: `src/app/admin/(authed)/page.tsx`

- [ ] **Step 1: Replace dashboard placeholder with real stats**

```tsx
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  const supabase = createServiceClient();

  const [
    { count: availableCount },
    { count: soldCount },
    { count: pendingShipment },
    { count: unreadMessages },
    { data: recentOrders },
    { data: monthOrders },
  ] = await Promise.all([
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "available"),
    supabase.from("products").select("id", { count: "exact", head: true }).eq("status", "sold"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "paid"),
    supabase.from("contact_messages").select("id", { count: "exact", head: true }).eq("read", false),
    supabase.from("orders").select("*").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("orders")
      .select("total")
      .gte("created_at", new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString())
      .in("status", ["paid", "shipped", "delivered"]),
  ]);

  const revenueMTD = (monthOrders ?? []).reduce((s, o) => s + Number(o.total), 0);

  return (
    <div className="space-y-8 animate-fade-in">
      <h1 className="section-heading">Dashboard</h1>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Stat label="Available products" value={availableCount ?? 0} />
        <Stat label="Sold (lifetime)" value={soldCount ?? 0} />
        <Stat label="To ship" value={pendingShipment ?? 0} highlight={(pendingShipment ?? 0) > 0} />
        <Stat label="Unread messages" value={unreadMessages ?? 0} highlight={(unreadMessages ?? 0) > 0} />
      </div>

      <div className="card p-6">
        <h2 className="font-serif text-lg text-ink mb-3">Revenue this month</h2>
        <p className="font-display text-3xl text-magic">{formatPrice(revenueMTD)}</p>
      </div>

      <div className="card p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-serif text-lg text-ink">Recent orders</h2>
          <Link href="/admin/orders" className="text-sm text-magic hover:underline font-sans">
            View all →
          </Link>
        </div>
        {!recentOrders?.length ? (
          <p className="text-sm text-ink/50 font-serif italic">No orders yet.</p>
        ) : (
          <ul className="divide-y divide-moss/10">
            {recentOrders.map((o) => (
              <li key={o.id} className="py-3 flex justify-between items-center text-sm font-sans">
                <div>
                  <Link href={`/admin/orders/${o.id}`} className="text-ink hover:text-magic">
                    {o.order_number}
                  </Link>
                  <span className="text-ink/50 ml-3">{o.customer_name}</span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="text-xs uppercase tracking-wide text-ink/40">{o.status}</span>
                  <span className="text-ink">{formatPrice(Number(o.total))}</span>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value, highlight }: { label: string; value: number; highlight?: boolean }) {
  return (
    <div className={`card p-4 ${highlight ? "ring-2 ring-magic/30" : ""}`}>
      <p className="text-xs uppercase tracking-wider text-ink/50 font-sans">{label}</p>
      <p className="font-display text-3xl text-ink mt-1">{value}</p>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

1. `npm run dev`, sign in, land on `/admin`.
2. See stats cards, revenue number, recent orders list.
3. If any recent orders exist, clicking `order_number` routes to `/admin/orders/<id>` (404 for now — next task).

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(authed)/page.tsx
git commit -m "feat(admin): dashboard with stats, MTD revenue, recent orders"
```

---

## Task 12: Orders list page

**Files:**
- Create: `src/app/admin/(authed)/orders/page.tsx`

- [ ] **Step 1: Create the orders list**

```tsx
import { createServiceClient } from "@/lib/supabase/service";
import Link from "next/link";
import { formatPrice } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: { status?: string };
}) {
  const supabase = createServiceClient();
  let query = supabase.from("orders").select("*").order("created_at", { ascending: false });
  if (searchParams.status && searchParams.status !== "all") {
    query = query.eq("status", searchParams.status);
  }
  const { data: orders } = await query;

  const statuses = ["all", "paid", "shipped", "delivered", "cancelled"];
  const active = searchParams.status ?? "all";

  return (
    <div className="space-y-6 animate-fade-in">
      <h1 className="section-heading">Orders</h1>

      <div className="flex gap-2 flex-wrap">
        {statuses.map((s) => (
          <Link
            key={s}
            href={s === "all" ? "/admin/orders" : `/admin/orders?status=${s}`}
            className={`px-3 py-1.5 rounded-full text-xs uppercase tracking-wider font-sans ${
              active === s ? "bg-magic text-white" : "bg-white border border-moss/20 text-ink/60 hover:bg-moss/5"
            }`}
          >
            {s}
          </Link>
        ))}
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-cream/60 text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="text-left py-3 px-4">Order</th>
              <th className="text-left py-3 px-4">Customer</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Tracking</th>
              <th className="text-right py-3 px-4">Total</th>
              <th className="text-right py-3 px-4">Date</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-moss/10">
            {(orders ?? []).map((o) => (
              <tr key={o.id} className="hover:bg-moss/5">
                <td className="py-3 px-4">
                  <Link href={`/admin/orders/${o.id}`} className="text-magic hover:underline">
                    {o.order_number}
                  </Link>
                </td>
                <td className="py-3 px-4 text-ink">{o.customer_name}</td>
                <td className="py-3 px-4 uppercase text-xs tracking-wider text-ink/60">{o.status}</td>
                <td className="py-3 px-4 text-ink/70">{o.tracking_number ?? "—"}</td>
                <td className="py-3 px-4 text-right text-ink">{formatPrice(Number(o.total))}</td>
                <td className="py-3 px-4 text-right text-ink/50 text-xs">
                  {new Date(o.created_at).toLocaleDateString()}
                </td>
              </tr>
            ))}
            {(!orders || orders.length === 0) && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink/50 font-serif italic">
                  No orders.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: Manual verification**

Visit `/admin/orders`. See table of orders (if any). Click a status filter, see URL update and rows filter.

- [ ] **Step 3: Commit**

```bash
git add src/app/admin/(authed)/orders/page.tsx
git commit -m "feat(admin): orders list with status filters"
```

---

## Task 13: Order detail page + "Copy for Pirate Ship" + status form

**Files:**
- Create: `src/app/admin/(authed)/orders/[id]/page.tsx`
- Create: `src/app/admin/_components/CopyAddressButton.tsx`
- Create: `src/app/admin/_components/OrderStatusForm.tsx`

- [ ] **Step 1: Create `CopyAddressButton.tsx`**

```tsx
"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ShippingAddress } from "@/types";

export function CopyAddressButton({ address }: { address: ShippingAddress }) {
  const [copied, setCopied] = useState(false);

  // Pirate Ship's paste-address feature accepts plain multi-line USPS format.
  const formatted = [
    address.name,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country && address.country !== "US" ? address.country : null,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans bg-magic/10 text-magic hover:bg-magic/20"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : "Copy address for Pirate Ship"}
    </button>
  );
}
```

- [ ] **Step 2: Create `OrderStatusForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import type { Order, OrderStatus } from "@/types";

const STATUSES: OrderStatus[] = ["paid", "shipped", "delivered", "cancelled"];

export function OrderStatusForm({ order }: { order: Order }) {
  const router = useRouter();
  const [status, setStatus] = useState<OrderStatus>(order.status);
  const [tracking, setTracking] = useState(order.tracking_number ?? "");
  const [notes, setNotes] = useState(order.notes ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const res = await fetch(`/api/admin/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status, tracking_number: tracking || null, notes: notes || null }),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <h2 className="font-serif text-lg text-ink">Fulfillment</h2>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-ink/50">Status</span>
        <select
          value={status}
          onChange={(e) => setStatus(e.target.value as OrderStatus)}
          className="mt-1 w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {s}
            </option>
          ))}
        </select>
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-ink/50">Tracking number</span>
        <input
          type="text"
          value={tracking}
          onChange={(e) => setTracking(e.target.value)}
          placeholder="9400 1000 0000 …"
          className="mt-1 w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white"
        />
      </label>

      <label className="block">
        <span className="text-xs uppercase tracking-wider text-ink/50">Notes (private)</span>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          rows={3}
          className="mt-1 w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white"
        />
      </label>

      {error && (
        <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">
          {error}
        </div>
      )}

      <Button type="submit" loading={saving}>
        Save
      </Button>
      <p className="text-xs text-ink/40 font-serif italic">
        Setting status to <strong>shipped</strong> with a tracking number will email the customer.
      </p>
    </form>
  );
}
```

- [ ] **Step 3: Create the order detail page**

```tsx
// src/app/admin/(authed)/orders/[id]/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { formatPrice } from "@/lib/utils";
import { notFound } from "next/navigation";
import Link from "next/link";
import { CopyAddressButton } from "@/app/admin/_components/CopyAddressButton";
import { OrderStatusForm } from "@/app/admin/_components/OrderStatusForm";
import type { Order } from "@/types";

export const dynamic = "force-dynamic";

export default async function OrderDetailPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data: order } = await supabase.from("orders").select("*").eq("id", params.id).single();
  if (!order) notFound();

  const o = order as Order;

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between">
        <div>
          <Link href="/admin/orders" className="text-sm text-ink/50 hover:text-magic">
            ← All orders
          </Link>
          <h1 className="section-heading mt-2">{o.order_number}</h1>
          <p className="text-sm text-ink/50 font-sans">
            {new Date(o.created_at).toLocaleString()} · {o.customer_email}
          </p>
        </div>
        <CopyAddressButton address={o.shipping_address} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="card p-6">
          <h2 className="font-serif text-lg text-ink mb-4">Ship to</h2>
          <address className="not-italic text-sm font-sans text-ink space-y-1">
            <div>{o.shipping_address.name}</div>
            <div>{o.shipping_address.line1}</div>
            {o.shipping_address.line2 && <div>{o.shipping_address.line2}</div>}
            <div>
              {o.shipping_address.city}, {o.shipping_address.state} {o.shipping_address.zip}
            </div>
            <div>{o.shipping_address.country}</div>
          </address>
        </div>

        <div className="card p-6">
          <h2 className="font-serif text-lg text-ink mb-4">Items</h2>
          <ul className="space-y-2 text-sm font-sans">
            {o.items.map((item, idx) => (
              <li key={idx} className="flex justify-between">
                <span className="text-ink">{item.name}</span>
                <span className="text-ink/60">{formatPrice(Number(item.price))}</span>
              </li>
            ))}
          </ul>
          <div className="border-t border-moss/10 mt-4 pt-4 space-y-1 text-sm font-sans">
            <Row label="Subtotal" value={formatPrice(Number(o.subtotal))} />
            <Row label="Shipping" value={formatPrice(Number(o.shipping_cost))} />
            <Row label="Tax" value={formatPrice(Number(o.tax))} />
            <Row label="Total" value={formatPrice(Number(o.total))} bold />
          </div>
        </div>
      </div>

      <OrderStatusForm order={o} />
    </div>
  );
}

function Row({ label, value, bold }: { label: string; value: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "font-semibold text-ink" : "text-ink/70"}`}>
      <span>{label}</span>
      <span>{value}</span>
    </div>
  );
}
```

- [ ] **Step 4: Manual verification (deferred)**

Sign in, go to `/admin/orders`, click an order — the page should render; the Save button will fail with 404 until Task 15 builds the API. If no orders exist yet, insert a row manually via Supabase SQL editor:

```sql
INSERT INTO orders (order_number, customer_email, customer_name, shipping_address, items, subtotal, shipping_cost, tax, total, square_payment_id, status)
VALUES ('WOTL-TEST', 'test@example.com', 'Test Customer',
  '{"name":"Test","line1":"123 Main St","city":"Philadelphia","state":"PA","zip":"19103","country":"US"}',
  '[{"product_id":"00000000-0000-0000-0000-000000000000","name":"Test item","price":50,"featured_image":"","slug":"test"}]',
  50, 8, 3, 61, 'TEST', 'paid');
```

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/(authed)/orders/[id] src/app/admin/_components/CopyAddressButton.tsx src/app/admin/_components/OrderStatusForm.tsx
git commit -m "feat(admin): order detail page with copy-address and status form"
```

---

## Task 14: Shipped-email template + resend helper

**Files:**
- Create: `src/lib/resend.ts`

- [ ] **Step 1: Create a shared Resend module**

```ts
// src/lib/resend.ts
import { Resend } from "resend";
import { formatPrice } from "@/lib/utils";

const getClient = () => new Resend(process.env.RESEND_API_KEY!);
const FROM = "Witch on the Loose <orders@witchontheloose.com>";

interface OrderConfirmationParams {
  to: string;
  orderNumber: string;
  customerName: string;
  items: { name: string; price: number }[];
  subtotal: number;
  shipping: number;
  tax: number;
  total: number;
}

export async function sendOrderConfirmation(p: OrderConfirmationParams) {
  const itemsHtml = p.items
    .map((i) => `<tr><td>${escapeHtml(i.name)}</td><td align="right">${formatPrice(i.price)}</td></tr>`)
    .join("");

  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1A1A;">
  <h1 style="color:#C75B28;">Witch on the Loose</h1>
  <p>Hi ${escapeHtml(p.customerName)},</p>
  <p>Your order <strong>${p.orderNumber}</strong> is confirmed! Thank you for supporting handmade magic.</p>
  <table width="100%" cellpadding="8" style="border-collapse:collapse;margin:16px 0;">
    <thead><tr style="background:#FAF7F2;"><th align="left">Item</th><th align="right">Price</th></tr></thead>
    <tbody>${itemsHtml}</tbody>
    <tfoot>
      <tr><td>Subtotal</td><td align="right">${formatPrice(p.subtotal)}</td></tr>
      <tr><td>Shipping</td><td align="right">${formatPrice(p.shipping)}</td></tr>
      <tr><td>Tax</td><td align="right">${formatPrice(p.tax)}</td></tr>
      <tr style="font-weight:bold;"><td>Total</td><td align="right">${formatPrice(p.total)}</td></tr>
    </tfoot>
  </table>
  <p>Your items will ship within 3–5 business days. You'll get a tracking number when they're on the way.</p>
  <p style="color:#8B5CF6;font-style:italic;">With magic &amp; care,<br />Witch on the Loose</p>
</body>
</html>`.trim();

  return getClient().emails.send({
    from: FROM,
    to: p.to,
    subject: `Order Confirmed — ${p.orderNumber}`,
    html,
  });
}

interface OrderShippedParams {
  to: string;
  orderNumber: string;
  customerName: string;
  trackingNumber: string;
}

export async function sendOrderShipped(p: OrderShippedParams) {
  const html = `
<!DOCTYPE html>
<html>
<head><meta charset="UTF-8" /></head>
<body style="font-family:Georgia,serif;max-width:600px;margin:0 auto;padding:24px;color:#1A1A1A;">
  <h1 style="color:#C75B28;">Witch on the Loose</h1>
  <p>Hi ${escapeHtml(p.customerName)},</p>
  <p>Your order <strong>${p.orderNumber}</strong> is on its way.</p>
  <p style="margin:24px 0;">
    <strong>Tracking:</strong>
    <a href="https://tools.usps.com/go/TrackConfirmAction?tLabels=${encodeURIComponent(p.trackingNumber)}" style="color:#8B5CF6;">${p.trackingNumber}</a>
  </p>
  <p>Thank you again for supporting handmade magic.</p>
  <p style="color:#8B5CF6;font-style:italic;">With magic &amp; care,<br />Witch on the Loose</p>
</body>
</html>`.trim();

  return getClient().emails.send({
    from: FROM,
    to: p.to,
    subject: `Your order is shipped — ${p.orderNumber}`,
    html,
  });
}

function escapeHtml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
```

- [ ] **Step 2: Refactor the checkout route to use `sendOrderConfirmation`**

In `src/app/api/checkout/create-payment/route.ts`:

- Delete the inline `buildOrderEmail` function and the direct Resend usage.
- Import `sendOrderConfirmation` and call it instead:

```ts
import { sendOrderConfirmation } from "@/lib/resend";

// ... after order insert + products marked sold:
try {
  await sendOrderConfirmation({
    to: customerEmail,
    orderNumber,
    customerName,
    items: products.map((p) => ({ name: p.name, price: Number(p.price) })),
    subtotal, shipping, tax, total,
  });
} catch (emailErr) {
  console.error("Email send failed:", emailErr);
}
```

- [ ] **Step 3: Manual verification**

Complete a sandbox checkout. Confirm the customer receives the order-confirmation email. Visual parity with previous behavior.

- [ ] **Step 4: Commit**

```bash
git add src/lib/resend.ts src/app/api/checkout/create-payment/route.ts
git commit -m "refactor(email): extract Resend helpers; add shipped-email template"
```

---

## Task 15: Order PATCH API (status/tracking + fires shipped email)

**Files:**
- Create: `src/app/api/admin/orders/[id]/route.ts`

- [ ] **Step 1: Create the PATCH endpoint**

```ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";
import { sendOrderShipped } from "@/lib/resend";
import type { OrderStatus } from "@/types";

const ALLOWED_STATUSES: OrderStatus[] = ["pending", "paid", "shipped", "delivered", "cancelled"];

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  // Middleware already blocks non-admins, but double-check.
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { status, tracking_number, notes } = body as {
    status?: OrderStatus;
    tracking_number?: string | null;
    notes?: string | null;
  };

  if (status && !ALLOWED_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  }

  const supabase = createServiceClient();
  const { data: before, error: fetchErr } = await supabase
    .from("orders")
    .select("*")
    .eq("id", params.id)
    .single();

  if (fetchErr || !before) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  const update: Record<string, unknown> = {};
  if (status !== undefined) update.status = status;
  if (tracking_number !== undefined) update.tracking_number = tracking_number;
  if (notes !== undefined) update.notes = notes;

  const { error: updErr } = await supabase.from("orders").update(update).eq("id", params.id);
  if (updErr) {
    return NextResponse.json({ error: updErr.message }, { status: 500 });
  }

  // Fire the shipped email if we just transitioned to shipped AND have a tracking number.
  const justShipped =
    status === "shipped" &&
    before.status !== "shipped" &&
    !!(tracking_number ?? before.tracking_number);

  if (justShipped) {
    try {
      await sendOrderShipped({
        to: before.customer_email,
        orderNumber: before.order_number,
        customerName: before.customer_name,
        trackingNumber: (tracking_number ?? before.tracking_number) as string,
      });
    } catch (e) {
      console.error("Shipped email failed:", e);
      // Don't fail the PATCH — she can resend manually.
    }
  }

  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 2: Manual verification**

1. Sign into admin.
2. Open a paid test order.
3. Set status = `shipped`, enter a fake tracking `9400 1000 0000 0000 0000 00`, save.
4. Supabase → orders table → confirm row updated.
5. Check your test customer email for the "shipped" email.
6. Re-save with same status — verify no duplicate email sent (since `before.status === "shipped"`, transition check fails).

- [ ] **Step 3: Commit**

```bash
git add src/app/api/admin/orders/[id]/route.ts
git commit -m "feat(api): PATCH /admin/orders/[id] with shipped-email trigger"
```

---

## Task 16: Image uploader component + upload API

**Files:**
- Create: `src/app/api/admin/upload/route.ts`
- Create: `src/app/admin/_components/ImageUploader.tsx`

- [ ] **Step 1: Upload API**

```ts
// src/app/api/admin/upload/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const form = await req.formData();
  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json({ error: "No file" }, { status: 400 });
  }
  if (!file.type.startsWith("image/")) {
    return NextResponse.json({ error: "Must be an image" }, { status: 400 });
  }
  if (file.size > 10 * 1024 * 1024) {
    return NextResponse.json({ error: "Max 10 MB" }, { status: 400 });
  }

  const ext = file.name.split(".").pop() ?? "jpg";
  const key = `${Date.now()}-${crypto.randomUUID()}.${ext}`;

  const supabase = createServiceClient();
  const { error } = await supabase.storage
    .from("product-images")
    .upload(key, file, { contentType: file.type });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const { data: pub } = supabase.storage.from("product-images").getPublicUrl(key);
  return NextResponse.json({ url: pub.publicUrl });
}
```

- [ ] **Step 2: `ImageUploader` component (multi-image, reorder, delete)**

```tsx
// src/app/admin/_components/ImageUploader.tsx
"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function ImageUploader({ value, onChange, max = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (value.length + files.length > max) {
      setError(`Max ${max} images`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        newUrls.push(json.url);
      }
      onChange([...value, ...newUrls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {value.map((url) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-moss/5 group">
            <Image src={url} alt="" fill className="object-cover" sizes="200px" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <label className="aspect-square rounded-lg border-2 border-dashed border-moss/30 flex flex-col items-center justify-center text-ink/50 hover:border-magic hover:text-magic cursor-pointer transition">
          {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          <span className="text-xs mt-1 font-sans">{uploading ? "Uploading…" : "Add image"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading || value.length >= max}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="text-sm text-mushroom font-sans">{error}</p>}
      <p className="text-xs text-ink/40 font-serif italic">
        First image is the featured image. Max {max}, 10 MB each.
      </p>
    </div>
  );
}
```

- [ ] **Step 3: Manual verification**

Deferred — exercised in the product form (next task). For now `curl -X POST http://localhost:3000/api/admin/upload -F file=@/path/to/image.jpg` from a shell where you've logged in (cookie auth makes this awkward; realistically test via the UI after Task 17).

- [ ] **Step 4: Commit**

```bash
git add src/app/api/admin/upload/route.ts src/app/admin/_components/ImageUploader.tsx
git commit -m "feat(admin): product image upload endpoint and uploader component"
```

---

## Task 17: Product form component + create/edit pages

**Files:**
- Create: `src/app/admin/_components/ProductForm.tsx`
- Create: `src/app/admin/(authed)/products/new/page.tsx`
- Create: `src/app/admin/(authed)/products/[id]/edit/page.tsx`

- [ ] **Step 1: `ProductForm.tsx` (shared create/edit)**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ImageUploader } from "./ImageUploader";
import type { Product, ProductCategory, ProductStatus } from "@/types";

const CATEGORIES: ProductCategory[] = ["clothing", "leather", "herbals", "vintage"];
const STATUSES: ProductStatus[] = ["available", "sold", "hidden"];

export interface ProductFormValues {
  name: string;
  slug: string;
  description: string;
  price: number;
  compare_at_price: number | null;
  category: ProductCategory;
  images: string[];
  status: ProductStatus;
  is_one_of_one: boolean;
  is_featured: boolean;
  is_taxable: boolean;
  materials: string | null;
  dimensions: string | null;
  care_instructions: string | null;
}

const BLANK: ProductFormValues = {
  name: "", slug: "", description: "", price: 0, compare_at_price: null,
  category: "clothing", images: [], status: "available",
  is_one_of_one: true, is_featured: false, is_taxable: false,
  materials: null, dimensions: null, care_instructions: null,
};

export function ProductForm({ initial, productId }: { initial?: Product; productId?: string }) {
  const router = useRouter();
  const [v, setV] = useState<ProductFormValues>(
    initial ? pickValues(initial) : BLANK
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = <K extends keyof ProductFormValues>(k: K, val: ProductFormValues[K]) =>
    setV((s) => ({ ...s, [k]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSaving(true);

    const featured = v.images[0] ?? "";
    const payload = { ...v, featured_image: featured };

    const url = productId ? `/api/admin/products/${productId}` : "/api/admin/products";
    const method = productId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) {
      setError(data.error ?? "Save failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!productId) return;
    if (!confirm("Delete this product? This cannot be undone.")) return;
    const res = await fetch(`/api/admin/products/${productId}`, { method: "DELETE" });
    if (!res.ok) {
      const d = await res.json();
      setError(d.error ?? "Delete failed");
      return;
    }
    router.push("/admin/products");
    router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="card p-6 space-y-4">
        <Field label="Name">
          <input type="text" required value={v.name}
            onChange={(e) => {
              update("name", e.target.value);
              if (!productId) update("slug", slugify(e.target.value));
            }}
            className={inputCls} />
        </Field>
        <Field label="Slug (URL)">
          <input type="text" required value={v.slug}
            onChange={(e) => update("slug", slugify(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Description">
          <textarea rows={5} value={v.description}
            onChange={(e) => update("description", e.target.value)} className={inputCls} />
        </Field>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Price (USD)">
            <input type="number" step="0.01" min="0" required value={v.price}
              onChange={(e) => update("price", Number(e.target.value))} className={inputCls} />
          </Field>
          <Field label="Compare-at price (optional)">
            <input type="number" step="0.01" min="0"
              value={v.compare_at_price ?? ""}
              onChange={(e) => update("compare_at_price", e.target.value ? Number(e.target.value) : null)}
              className={inputCls} />
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Field label="Category">
            <select value={v.category} onChange={(e) => update("category", e.target.value as ProductCategory)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="Status">
            <select value={v.status} onChange={(e) => update("status", e.target.value as ProductStatus)} className={inputCls}>
              {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
            </select>
          </Field>
        </div>
      </div>

      <div className="card p-6">
        <label className="text-xs uppercase tracking-wider text-ink/50 font-sans block mb-3">
          Images
        </label>
        <ImageUploader value={v.images} onChange={(imgs) => update("images", imgs)} />
      </div>

      <div className="card p-6 space-y-3">
        <Check label="One of one" value={v.is_one_of_one} onChange={(x) => update("is_one_of_one", x)} />
        <Check label="Featured on home page" value={v.is_featured} onChange={(x) => update("is_featured", x)} />
        <Check
          label="Taxable in PA"
          help="Leather accessories, jewelry, cosmetics: yes. Clothing, vintage clothing: no."
          value={v.is_taxable}
          onChange={(x) => update("is_taxable", x)}
        />
      </div>

      <div className="card p-6 space-y-4">
        <Field label="Materials"><input type="text" value={v.materials ?? ""} onChange={(e) => update("materials", e.target.value || null)} className={inputCls} /></Field>
        <Field label="Dimensions"><input type="text" value={v.dimensions ?? ""} onChange={(e) => update("dimensions", e.target.value || null)} className={inputCls} /></Field>
        <Field label="Care instructions"><textarea rows={2} value={v.care_instructions ?? ""} onChange={(e) => update("care_instructions", e.target.value || null)} className={inputCls} /></Field>
      </div>

      {error && <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">{error}</div>}

      <div className="flex justify-between">
        <Button type="submit" loading={saving}>{productId ? "Save changes" : "Create product"}</Button>
        {productId && (
          <button type="button" onClick={handleDelete}
            className="text-sm text-mushroom hover:underline font-sans">Delete</button>
        )}
      </div>
    </form>
  );
}

const inputCls = "w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="text-xs uppercase tracking-wider text-ink/50 font-sans">{label}</span>
      <div className="mt-1">{children}</div>
    </label>
  );
}

function Check({ label, value, onChange, help }: { label: string; value: boolean; onChange: (b: boolean) => void; help?: string }) {
  return (
    <label className="flex items-start gap-3 cursor-pointer">
      <input type="checkbox" checked={value} onChange={(e) => onChange(e.target.checked)}
        className="mt-1 accent-magic" />
      <div>
        <div className="text-sm font-sans text-ink">{label}</div>
        {help && <div className="text-xs text-ink/40 font-serif italic mt-0.5">{help}</div>}
      </div>
    </label>
  );
}

function slugify(s: string): string {
  return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function pickValues(p: Product): ProductFormValues {
  return {
    name: p.name, slug: p.slug, description: p.description, price: Number(p.price),
    compare_at_price: p.compare_at_price !== null ? Number(p.compare_at_price) : null,
    category: p.category, images: p.images ?? [], status: p.status,
    is_one_of_one: p.is_one_of_one, is_featured: p.is_featured, is_taxable: p.is_taxable,
    materials: p.materials, dimensions: p.dimensions, care_instructions: p.care_instructions,
  };
}
```

- [ ] **Step 2: Create page**

```tsx
// src/app/admin/(authed)/products/new/page.tsx
import { ProductForm } from "@/app/admin/_components/ProductForm";
import Link from "next/link";

export default function NewProductPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/products" className="text-sm text-ink/50 hover:text-magic">← All products</Link>
      <h1 className="section-heading">New Product</h1>
      <ProductForm />
    </div>
  );
}
```

- [ ] **Step 3: Edit page**

```tsx
// src/app/admin/(authed)/products/[id]/edit/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { ProductForm } from "@/app/admin/_components/ProductForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Product } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditProductPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("products").select("*").eq("id", params.id).single();
  if (!data) notFound();
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/products" className="text-sm text-ink/50 hover:text-magic">← All products</Link>
      <h1 className="section-heading">{data.name}</h1>
      <ProductForm initial={data as Product} productId={params.id} />
    </div>
  );
}
```

- [ ] **Step 4: Commit**

```bash
git add src/app/admin/_components/ProductForm.tsx src/app/admin/(authed)/products
git commit -m "feat(admin): product form (create/edit) with image uploader"
```

---

## Task 18: Products list page + product CRUD API

**Files:**
- Create: `src/app/admin/(authed)/products/page.tsx`
- Create: `src/app/api/admin/products/route.ts` (POST)
- Create: `src/app/api/admin/products/[id]/route.ts` (PATCH, DELETE)

- [ ] **Step 1: Products list**

```tsx
// src/app/admin/(authed)/products/page.tsx
import Link from "next/link";
import Image from "next/image";
import { createServiceClient } from "@/lib/supabase/service";
import { formatPrice } from "@/lib/utils";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminProductsPage() {
  const supabase = createServiceClient();
  const { data: products } = await supabase.from("products").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="section-heading">Products</h1>
        <Link href="/admin/products/new">
          <Button>+ New product</Button>
        </Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-cream/60 text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="text-left py-3 px-4">Image</th>
              <th className="text-left py-3 px-4">Name</th>
              <th className="text-left py-3 px-4">Category</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-left py-3 px-4">Taxable?</th>
              <th className="text-right py-3 px-4">Price</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-moss/10">
            {(products ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-moss/5">
                <td className="py-2 px-4">
                  {p.featured_image ? (
                    <div className="relative w-12 h-12 rounded overflow-hidden">
                      <Image src={p.featured_image} alt="" fill className="object-cover" sizes="48px" />
                    </div>
                  ) : (
                    <div className="w-12 h-12 rounded bg-moss/10" />
                  )}
                </td>
                <td className="py-3 px-4">
                  <Link href={`/admin/products/${p.id}/edit`} className="text-magic hover:underline">
                    {p.name}
                  </Link>
                </td>
                <td className="py-3 px-4 capitalize text-ink/70">{p.category}</td>
                <td className="py-3 px-4 uppercase text-xs tracking-wider text-ink/60">{p.status}</td>
                <td className="py-3 px-4 text-ink/70">{p.is_taxable ? "Yes" : "No"}</td>
                <td className="py-3 px-4 text-right text-ink">{formatPrice(Number(p.price))}</td>
              </tr>
            ))}
            {!products?.length && (
              <tr>
                <td colSpan={6} className="py-10 text-center text-ink/50 font-serif italic">
                  No products yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 2: POST `/api/admin/products`**

```ts
// src/app/api/admin/products/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = createServiceClient();

  const { data, error } = await supabase.from("products").insert({
    name: body.name,
    slug: body.slug,
    description: body.description ?? "",
    price: body.price,
    compare_at_price: body.compare_at_price ?? null,
    category: body.category,
    images: body.images ?? [],
    featured_image: body.featured_image ?? "",
    status: body.status ?? "available",
    is_one_of_one: !!body.is_one_of_one,
    is_featured: !!body.is_featured,
    is_taxable: !!body.is_taxable,
    materials: body.materials ?? null,
    dimensions: body.dimensions ?? null,
    care_instructions: body.care_instructions ?? null,
  }).select().single();

  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ product: data });
}
```

- [ ] **Step 3: PATCH + DELETE `/api/admin/products/[id]`**

```ts
// src/app/api/admin/products/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const supabase = createServiceClient();

  const update: Record<string, unknown> = {};
  const fields = ["name","slug","description","price","compare_at_price","category","images","featured_image","status","is_one_of_one","is_featured","is_taxable","materials","dimensions","care_instructions"];
  for (const k of fields) if (k in body) update[k] = body[k];

  const { error } = await supabase.from("products").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const supabase = createServiceClient();
  const { error } = await supabase.from("products").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Manual verification**

1. Go to `/admin/products` — see existing products.
2. Click "+ New product" → fill in name ("Test"), price ($10), category=leather, toggle "Taxable in PA" ON, upload 1–2 images, hit Create. Land back on list with the new row.
3. Visit the public `/shop` — verify the new product appears.
4. Visit the public product page → add to cart → checkout with PA address → tax appears. Checkout with NY → no tax.
5. Back in admin, edit the product, delete it — confirm gone from list and public shop.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/(authed)/products/page.tsx src/app/api/admin/products
git commit -m "feat(admin): products list and CRUD API"
```

---

## Task 19: Blog admin (list, form, create/edit, API)

**Files:**
- Create: `src/app/admin/_components/BlogPostForm.tsx`
- Create: `src/app/admin/(authed)/blog/page.tsx`
- Create: `src/app/admin/(authed)/blog/new/page.tsx`
- Create: `src/app/admin/(authed)/blog/[id]/edit/page.tsx`
- Create: `src/app/api/admin/blog/route.ts`
- Create: `src/app/api/admin/blog/[id]/route.ts`

- [ ] **Step 1: `BlogPostForm.tsx`**

```tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Button from "@/components/ui/Button";
import { ImageUploader } from "./ImageUploader";
import type { BlogPost, BlogPostStatus } from "@/types";

const STATUSES: BlogPostStatus[] = ["draft", "published"];

interface Values {
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  featured_image: string | null;
  status: BlogPostStatus;
}

const BLANK: Values = { title: "", slug: "", excerpt: "", content: "", featured_image: null, status: "draft" };

export function BlogPostForm({ initial, postId }: { initial?: BlogPost; postId?: string }) {
  const router = useRouter();
  const [v, setV] = useState<Values>(
    initial ? {
      title: initial.title, slug: initial.slug, excerpt: initial.excerpt,
      content: initial.content, featured_image: initial.featured_image, status: initial.status,
    } : BLANK
  );
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const up = <K extends keyof Values>(k: K, val: Values[K]) => setV((s) => ({ ...s, [k]: val }));

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    const payload = {
      ...v,
      // Set published_at when first published.
      published_at: v.status === "published" && !initial?.published_at ? new Date().toISOString() : initial?.published_at ?? null,
    };
    const url = postId ? `/api/admin/blog/${postId}` : "/api/admin/blog";
    const method = postId ? "PATCH" : "POST";
    const res = await fetch(url, {
      method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
    });
    const data = await res.json();
    setSaving(false);
    if (!res.ok) { setError(data.error ?? "Save failed"); return; }
    router.push("/admin/blog");
    router.refresh();
  };

  const handleDelete = async () => {
    if (!postId) return;
    if (!confirm("Delete this post?")) return;
    await fetch(`/api/admin/blog/${postId}`, { method: "DELETE" });
    router.push("/admin/blog"); router.refresh();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
      <div className="card p-6 space-y-4">
        <Field label="Title">
          <input type="text" required value={v.title}
            onChange={(e) => { up("title", e.target.value); if (!postId) up("slug", slugify(e.target.value)); }}
            className={inputCls} />
        </Field>
        <Field label="Slug (URL)">
          <input type="text" required value={v.slug} onChange={(e) => up("slug", slugify(e.target.value))} className={inputCls} />
        </Field>
        <Field label="Excerpt (preview)">
          <textarea rows={2} value={v.excerpt} onChange={(e) => up("excerpt", e.target.value)} className={inputCls} />
        </Field>
        <Field label="Content (Markdown)">
          <textarea rows={18} value={v.content} onChange={(e) => up("content", e.target.value)}
            className={`${inputCls} font-mono`} placeholder="## Heading&#10;&#10;Write your story here…" />
        </Field>
        <Field label="Status">
          <select value={v.status} onChange={(e) => up("status", e.target.value as BlogPostStatus)} className={inputCls}>
            {STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
        </Field>
      </div>

      <div className="card p-6">
        <label className="text-xs uppercase tracking-wider text-ink/50 font-sans block mb-3">Featured image</label>
        <ImageUploader
          value={v.featured_image ? [v.featured_image] : []}
          onChange={(imgs) => up("featured_image", imgs[0] ?? null)}
          max={1}
        />
      </div>

      {error && <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">{error}</div>}

      <div className="flex justify-between">
        <Button type="submit" loading={saving}>{postId ? "Save changes" : "Create post"}</Button>
        {postId && <button type="button" onClick={handleDelete} className="text-sm text-mushroom hover:underline font-sans">Delete</button>}
      </div>
    </form>
  );
}

const inputCls = "w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (<label className="block"><span className="text-xs uppercase tracking-wider text-ink/50 font-sans">{label}</span><div className="mt-1">{children}</div></label>);
}
function slugify(s: string): string { return s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
```

- [ ] **Step 2: Blog list**

```tsx
// src/app/admin/(authed)/blog/page.tsx
import Link from "next/link";
import { createServiceClient } from "@/lib/supabase/service";
import Button from "@/components/ui/Button";

export const dynamic = "force-dynamic";

export default async function AdminBlogPage() {
  const supabase = createServiceClient();
  const { data: posts } = await supabase.from("blog_posts").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <h1 className="section-heading">Blog</h1>
        <Link href="/admin/blog/new"><Button>+ New post</Button></Link>
      </div>

      <div className="card overflow-hidden">
        <table className="w-full text-sm font-sans">
          <thead className="bg-cream/60 text-xs uppercase tracking-wider text-ink/50">
            <tr>
              <th className="text-left py-3 px-4">Title</th>
              <th className="text-left py-3 px-4">Status</th>
              <th className="text-right py-3 px-4">Published</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-moss/10">
            {(posts ?? []).map((p) => (
              <tr key={p.id} className="hover:bg-moss/5">
                <td className="py-3 px-4">
                  <Link href={`/admin/blog/${p.id}/edit`} className="text-magic hover:underline">{p.title}</Link>
                </td>
                <td className="py-3 px-4 uppercase text-xs tracking-wider text-ink/60">{p.status}</td>
                <td className="py-3 px-4 text-right text-ink/50 text-xs">
                  {p.published_at ? new Date(p.published_at).toLocaleDateString() : "—"}
                </td>
              </tr>
            ))}
            {!posts?.length && (
              <tr><td colSpan={3} className="py-10 text-center text-ink/50 font-serif italic">No posts yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
```

- [ ] **Step 3: New/edit pages**

```tsx
// src/app/admin/(authed)/blog/new/page.tsx
import { BlogPostForm } from "@/app/admin/_components/BlogPostForm";
import Link from "next/link";

export default function NewBlogPostPage() {
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/blog" className="text-sm text-ink/50 hover:text-magic">← All posts</Link>
      <h1 className="section-heading">New Post</h1>
      <BlogPostForm />
    </div>
  );
}
```

```tsx
// src/app/admin/(authed)/blog/[id]/edit/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { BlogPostForm } from "@/app/admin/_components/BlogPostForm";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { BlogPost } from "@/types";

export const dynamic = "force-dynamic";

export default async function EditBlogPage({ params }: { params: { id: string } }) {
  const supabase = createServiceClient();
  const { data } = await supabase.from("blog_posts").select("*").eq("id", params.id).single();
  if (!data) notFound();
  return (
    <div className="space-y-6 animate-fade-in">
      <Link href="/admin/blog" className="text-sm text-ink/50 hover:text-magic">← All posts</Link>
      <h1 className="section-heading">{data.title}</h1>
      <BlogPostForm initial={data as BlogPost} postId={params.id} />
    </div>
  );
}
```

- [ ] **Step 4: Blog API routes**

```ts
// src/app/api/admin/blog/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";

export async function POST(req: NextRequest) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createServiceClient();
  const { data, error } = await supabase.from("blog_posts").insert({
    title: body.title, slug: body.slug, excerpt: body.excerpt ?? "",
    content: body.content ?? "", featured_image: body.featured_image ?? null,
    status: body.status ?? "draft", published_at: body.published_at ?? null,
  }).select().single();
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ post: data });
}
```

```ts
// src/app/api/admin/blog/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createServiceClient();
  const update: Record<string, unknown> = {};
  for (const k of ["title","slug","excerpt","content","featured_image","status","published_at"]) {
    if (k in body) update[k] = body[k];
  }
  const { error } = await supabase.from("blog_posts").update(update).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}

export async function DELETE(_req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const supabase = createServiceClient();
  const { error } = await supabase.from("blog_posts").delete().eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 5: Manual verification**

1. `/admin/blog` loads (empty if no posts).
2. Create a draft post — verify it does not appear on public `/blog`.
3. Change to `published`, save — refresh public `/blog`, post appears. `published_at` is set.
4. Edit, save. Delete, verify disappears.

- [ ] **Step 6: Commit**

```bash
git add src/app/admin/_components/BlogPostForm.tsx src/app/admin/(authed)/blog src/app/api/admin/blog
git commit -m "feat(admin): blog admin with list, form, and CRUD API"
```

---

## Task 20: Messages inbox

**Files:**
- Create: `src/app/admin/(authed)/messages/page.tsx`
- Create: `src/app/api/admin/messages/[id]/route.ts`

- [ ] **Step 1: Messages page**

```tsx
// src/app/admin/(authed)/messages/page.tsx
import { createServiceClient } from "@/lib/supabase/service";
import { MessageRow } from "@/app/admin/_components/MessageRow";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const supabase = createServiceClient();
  const { data: messages } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <h1 className="section-heading">Messages</h1>
      <div className="card divide-y divide-moss/10">
        {(messages ?? []).map((m) => (
          <MessageRow key={m.id} message={m} />
        ))}
        {!messages?.length && (
          <div className="p-10 text-center text-ink/50 font-serif italic">No messages yet.</div>
        )}
      </div>
    </div>
  );
}
```

- [ ] **Step 2: `MessageRow` component (client, for toggle)**

```tsx
// src/app/admin/_components/MessageRow.tsx
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactMessage } from "@/types";

export function MessageRow({ message }: { message: ContactMessage }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(message.read);
  const router = useRouter();

  const toggleRead = async (newVal: boolean) => {
    setRead(newVal);
    await fetch(`/api/admin/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: newVal }),
    });
    router.refresh();
  };

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && !read) await toggleRead(true);
  };

  return (
    <div className="p-4">
      <button
        onClick={handleOpen}
        className="w-full flex justify-between items-center text-left"
      >
        <div className="flex items-center gap-3">
          {!read && <span className="w-2 h-2 rounded-full bg-magic" />}
          <div>
            <div className={`font-sans ${!read ? "font-semibold text-ink" : "text-ink/60"}`}>
              {message.name} <span className="text-ink/40">· {message.subject}</span>
            </div>
            <div className="text-xs text-ink/40 font-serif italic">{message.email}</div>
          </div>
        </div>
        <span className="text-xs text-ink/40 font-sans">
          {new Date(message.created_at).toLocaleDateString()}
        </span>
      </button>
      {open && (
        <div className="mt-3 pl-5 pr-2 pb-2 border-l-2 border-magic/20">
          <p className="text-sm text-ink font-serif whitespace-pre-wrap">{message.message}</p>
          <div className="flex gap-3 mt-3 text-xs font-sans">
            <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
              className="text-magic hover:underline">Reply by email</a>
            <button onClick={() => toggleRead(!read)} className="text-ink/50 hover:text-ink">
              Mark {read ? "unread" : "read"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
```

- [ ] **Step 3: PATCH `/api/admin/messages/[id]`**

```ts
// src/app/api/admin/messages/[id]/route.ts
import { NextRequest, NextResponse } from "next/server";
import { createServiceClient } from "@/lib/supabase/service";
import { getAdminUserOrNull } from "@/lib/admin-auth";

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  const user = await getAdminUserOrNull();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const supabase = createServiceClient();
  const { error } = await supabase.from("contact_messages").update({ read: !!body.read }).eq("id", params.id);
  if (error) return NextResponse.json({ error: error.message }, { status: 400 });
  return NextResponse.json({ ok: true });
}
```

- [ ] **Step 4: Manual verification**

1. Submit the public `/contact` form with a test message.
2. In admin, go to `/admin/messages` — see the message with an unread dot.
3. Click to expand — the dot disappears (marked read).
4. Dashboard "Unread messages" count updates after refresh.

- [ ] **Step 5: Commit**

```bash
git add src/app/admin/(authed)/messages src/app/admin/_components/MessageRow.tsx src/app/api/admin/messages
git commit -m "feat(admin): contact messages inbox with read/unread"
```

---

## Task 21: About page + placeholders + production content

**Files:**
- Modify: `src/app/about/page.tsx:25-56`

- [ ] **Step 1: Replace name placeholder**

Change line 31 from `"Hi, I'm [Name]"` to `"Hi, I'm Shannon"` (confirm spelling with the client in the meeting — adjust as needed). Replace the star icon block (lines 25-27) with a real `<Image>` pointing at a headshot you put in `public/images/about-shannon.jpg`.

```tsx
// around line 25-27 — replace the star emoji div with:
import Image from "next/image";

<div className="relative aspect-[4/5] rounded-2xl overflow-hidden bg-moss/10">
  <Image
    src="/images/about-shannon.jpg"
    alt="Shannon, founder of Witch on the Loose"
    fill
    className="object-cover"
    sizes="(max-width: 768px) 100vw, 400px"
    priority
  />
</div>
```

If the client hasn't sent a headshot yet, keep the star placeholder but wrap it with a comment:

```tsx
{/* TODO: replace with Image when client sends headshot for public/images/about-shannon.jpg */}
```

- [ ] **Step 2: Verify hero video exists**

Run:

```bash
ls public/videos/witch-flying.mp4
```

If missing, the hero will fall back gracefully. Note in the client hand-off list that she owes us the video.

- [ ] **Step 3: Commit**

```bash
git add src/app/about/page.tsx
git commit -m "content: replace About placeholders with real name and photo slot"
```

---

## Task 22: README + env.example — production handover docs

**Files:**
- Modify: `README.md`
- Modify: `.env.example`

- [ ] **Step 1: Update `README.md` — content-management section now uses /admin**

Replace the "Content Management" section (lines 103-111) with:

```md
## Content Management

All content is managed through the admin portal at `/admin`.

1. Add your email to the `ADMIN_EMAILS` environment variable (comma-separated).
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
- TODO: Philadelphia adds 2% local, Allegheny adds 1%. Current setup uses statewide 6% only. Revisit if needed.
```

- [ ] **Step 2: Ensure `.env.example` has everything for prod**

Confirm it has:

```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SQUARE_APP_ID=
NEXT_PUBLIC_SQUARE_LOCATION_ID=
NEXT_PUBLIC_SQUARE_ENV=sandbox
SQUARE_ACCESS_TOKEN=
SQUARE_API_BASE_URL=https://connect.squareupsandbox.com
RESEND_API_KEY=
ADMIN_EMAILS=
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

Add a "Production checklist" block to the README:

```md
## Production Checklist

Before flipping to production:

- [ ] Square: switch `NEXT_PUBLIC_SQUARE_ENV=production` and `SQUARE_API_BASE_URL=https://connect.squareup.com`, use production App ID / Location ID / Access Token.
- [ ] Resend: add SPF, DKIM, DMARC DNS records on `witchontheloose.com`; verify the `orders@witchontheloose.com` sender.
- [ ] Supabase Auth: Site URL and Redirect URLs include your production domain (`https://www.witchontheloose.com/admin`).
- [ ] `NEXT_PUBLIC_SITE_URL=https://www.witchontheloose.com`.
- [ ] `ADMIN_EMAILS` = the owner's real email(s).
- [ ] PA Sales Tax License obtained; `is_taxable` set correctly on every product.
- [ ] About page photo uploaded; hero video file present in `public/videos/witch-flying.mp4`.
- [ ] Vercel project has all env vars set for Production environment.
- [ ] Test a real low-value purchase end-to-end before announcing launch.
```

- [ ] **Step 3: Commit**

```bash
git add README.md .env.example
git commit -m "docs: admin portal usage, PA tax notes, production checklist"
```

---

## Task 23: Full end-to-end smoke test

- [ ] **Step 1: Purchase flow (sandbox)**

1. `npm run dev`
2. Sign out of admin.
3. Public: add a taxable leather item + a non-taxable clothing item to cart.
4. Checkout with a PA address using Square's sandbox card `4111 1111 1111 1111` (any future date, any CVV, any ZIP).
5. Confirm:
   - Tax shown on `/checkout` matches: `leather_price * 0.06` (clothing is exempt)
   - Order confirmation email arrives
   - Both products now show status=sold in Supabase
   - Order row in Supabase has correct totals

- [ ] **Step 2: Fulfillment flow**

1. Sign into `/admin`.
2. Open the new order.
3. Click "Copy address for Pirate Ship" — paste into a text editor to verify format.
4. Enter a fake tracking number, set status = shipped, Save.
5. Confirm shipped email arrives.
6. In `/admin/orders`, filter by `shipped` — order appears there.

- [ ] **Step 3: Product/blog/message flows**

1. Create a new product in admin with images, verify it appears on public `/shop`.
2. Create a blog post in draft, verify it does NOT appear on public `/blog`. Publish, verify it does.
3. Submit a message via public `/contact`, verify it appears in `/admin/messages`.

- [ ] **Step 4: Auth edge cases**

1. Sign out. Try to visit `/admin/orders` — expect redirect to `/admin/login`.
2. Try to POST to `/api/admin/products` via curl without a session — expect 401.
3. Log in with an email NOT in `ADMIN_EMAILS` — expect redirect to `/admin/login?error=not-admin` (or similar). (If this doesn't happen, the middleware isn't checking properly — revisit Task 8.)

- [ ] **Step 5: Final commit + tag**

```bash
git commit --allow-empty -m "chore: admin portal and production readiness complete"
git tag v0.2.0-admin
```

---

## Self-Review

**Spec coverage checklist:**

| List 1 item | Task(s) |
|---|---|
| A1 — Auth gate with middleware, email allowlist | 7, 8 |
| A2 — Login page | 9 |
| A2b — Admin layout / sidebar / sign-out | 10 |
| A3 — Dashboard | 11 |
| A4 — Orders list + detail + status form | 12, 13, 15 |
| A5 — Products list/CRUD + image upload | 16, 17, 18 |
| A6 — Blog list/CRUD + markdown | 19 |
| A7 — Messages inbox | 20 |
| B7 — `is_taxable` migration | 1 |
| B8 — Tax logic in checkout (PA + taxable items only) | 3, 4, 5, 6 |
| B9 — Accurate tax label | 5 (within checkout edits) |
| C10 — Shipped email | 14, 15 |
| D11 — Storage bucket + RLS | 1 |
| D12 — About placeholders replaced | 21 |
| D13 — Verify hero video | 21 |
| D14 — Favicon + OG image | **GAP — see note below** |
| D15 — Production env vars | 22 |
| E16/E17 — SPF/DKIM/DMARC, Resend domain | **Out of code scope — in hand-off checklist only.** Included in the README production checklist in Task 22. |

**Identified gap:** Favicon + OG image (List 1 item 14) isn't a dedicated task. It's cosmetic and small; if missing, add as Task 21.5:

- [ ] Confirm `public/favicon.ico` and `public/og-image.png` exist. If not, create placeholder OG image (1200x630) with the logo over the brand palette and drop it at `public/og-image.png`. Add to `src/app/layout.tsx` `metadata.openGraph.images`.

**Placeholder scan:** no TBDs, TODO-without-code, or "similar to Task N" references. The Philadelphia/Allegheny tax is explicitly marked `TODO(tax-v2)` in the code comment with the rationale for deferral. The About headshot slot is explicitly marked as a TODO if the client hasn't supplied one yet.

**Type consistency:** `ProductFormValues` and `Product` match column-for-column on `is_taxable`; `OrderStatus`, `BlogPostStatus`, `ProductCategory`, `ProductStatus` are reused from `src/types/index.ts` throughout. `requireAdmin()` / `getAdminUserOrNull()` naming is consistent across files. `calculateTax(items, state)` signature matches all call sites.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-04-21-admin-portal-and-production-readiness.md`.**

Two execution options:

**1. Subagent-Driven (recommended)** — I dispatch a fresh subagent per task, review between tasks, fast iteration. Best for a plan this size (23 tasks) because each task gets a clean context window.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints.

Which approach?
