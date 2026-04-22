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
