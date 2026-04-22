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
