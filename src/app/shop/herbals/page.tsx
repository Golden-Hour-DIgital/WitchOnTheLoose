import { redirect } from "next/navigation";

export default function HerbalsPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams({ ...searchParams, category: "herbals" });
  redirect(`/shop?${params.toString()}`);
}
