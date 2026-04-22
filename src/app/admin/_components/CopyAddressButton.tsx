"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";
import type { ShippingAddress } from "@/types";

export function CopyAddressButton({ address }: { address: ShippingAddress }) {
  const [copied, setCopied] = useState(false);

  const formatted = [
    address.name,
    address.line1,
    address.line2,
    `${address.city}, ${address.state} ${address.zip}`,
    address.country && address.country !== "US" ? address.country : null,
  ]
    .filter(Boolean)
    .join("\n");

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formatted);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <button
      type="button"
      onClick={handleCopy}
      className="inline-flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-sans bg-magic/10 text-magic hover:bg-magic/20"
    >
      {copied ? <Check size={14} /> : <Copy size={14} />}
      {copied ? "Copied!" : "Copy address for Pirate Ship"}
    </button>
  );
}
