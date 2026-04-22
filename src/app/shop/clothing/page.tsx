import { redirect } from "next/navigation";

export default async function ClothingPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ ...sp, category: "clothing" });
  redirect(`/shop?${params.toString()}`);
}
