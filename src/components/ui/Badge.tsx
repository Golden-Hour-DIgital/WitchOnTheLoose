import { cn } from "@/lib/utils";

type BadgeVariant = "one-of-one" | "sold" | "sale" | "new" | "featured";

interface BadgeProps {
  variant?: BadgeVariant;
  className?: string;
  children: React.ReactNode;
}

const variantStyles: Record<BadgeVariant, string> = {
  "one-of-one": "bg-magic/10 text-magic-700 border border-magic/20",
  sold: "bg-ink/10 text-ink/50 border border-ink/10",
  sale: "bg-mushroom text-white",
  new: "bg-moss/20 text-moss-700 border border-moss/30",
  featured: "bg-gold/20 text-amber-800 border border-gold/30",
};

export default function Badge({ variant = "one-of-one", className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  );
}
