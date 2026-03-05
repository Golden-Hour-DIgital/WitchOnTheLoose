import { redirect } from "next/navigation";

export default function ClothingPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams({ ...searchParams, category: "clothing" });
  redirect(`/shop?${params.toString()}`);
}
