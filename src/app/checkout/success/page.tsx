import Link from "next/link";
import Button from "@/components/ui/Button";

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ order?: string }>;
}) {
  const sp = await searchParams;
  return (
    <div className="container-site py-24 text-center animate-fade-in">
      <div className="max-w-lg mx-auto">
        <p className="text-7xl mb-6">✦</p>
        <h1 className="font-display text-5xl text-burnt mb-4">Order Confirmed!</h1>
        {sp.order && (
          <p className="font-mono text-sm text-ink/50 mb-2">{sp.order}</p>
        )}
        <p className="font-serif italic text-ink/60 text-lg mb-6">
          Your magical piece is on its way. Check your email for a confirmation.
        </p>
        <p className="text-sm text-ink/50 font-sans mb-10">
          Each item is handled with care and ships within 3–5 business days.
          You&apos;ll receive a tracking number when it ships.
        </p>
        <Link href="/shop">
          <Button>Continue Shopping</Button>
        </Link>
      </div>
    </div>
  );
}
