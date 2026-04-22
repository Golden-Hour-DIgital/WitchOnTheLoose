import { redirect } from "next/navigation";

export default async function HerbalsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ ...sp, category: "herbals" });
  redirect(`/shop?${params.toString()}`);
}
