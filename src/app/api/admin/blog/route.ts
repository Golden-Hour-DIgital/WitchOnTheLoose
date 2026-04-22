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
