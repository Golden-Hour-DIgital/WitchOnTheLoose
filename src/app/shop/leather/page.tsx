import { redirect } from "next/navigation";

export default async function LeatherPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ ...sp, category: "leather" });
  redirect(`/shop?${params.toString()}`);
}
