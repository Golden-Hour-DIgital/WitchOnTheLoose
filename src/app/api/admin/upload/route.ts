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
