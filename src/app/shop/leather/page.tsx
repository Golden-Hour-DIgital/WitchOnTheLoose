import { redirect } from "next/navigation";

export default function LeatherPage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams({ ...searchParams, category: "leather" });
  redirect(`/shop?${params.toString()}`);
}
