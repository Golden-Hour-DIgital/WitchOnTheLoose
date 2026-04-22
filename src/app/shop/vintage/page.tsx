import { redirect } from "next/navigation";

export default async function VintagePage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const sp = await searchParams;
  const params = new URLSearchParams({ ...sp, category: "vintage" });
  redirect(`/shop?${params.toString()}`);
}
