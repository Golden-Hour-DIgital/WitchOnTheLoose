import { redirect } from "next/navigation";

export default function VintagePage({
  searchParams,
}: {
  searchParams: Record<string, string>;
}) {
  const params = new URLSearchParams({ ...searchParams, category: "vintage" });
  redirect(`/shop?${params.toString()}`);
}
