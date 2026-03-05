"use client";

import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { cn } from "@/lib/utils";

interface ShopFiltersProps {
  showCategoryFilter?: boolean;
}

const statusOptions = [
  { value: "", label: "All" },
  { value: "available", label: "Available" },
  { value: "sold", label: "Sold" },
];

const sortOptions = [
  { value: "newest", label: "Newest" },
  { value: "price_asc", label: "Price: Low to High" },
  { value: "price_desc", label: "Price: High to Low" },
];

const categoryOptions = [
  { value: "", label: "All Categories" },
  { value: "clothing", label: "Clothing" },
  { value: "leather", label: "Leather Goods" },
  { value: "herbals", label: "Herbals" },
];

export default function ShopFilters({ showCategoryFilter = true }: ShopFiltersProps) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const createQueryString = useCallback(
    (name: string, value: string) => {
      const params = new URLSearchParams(searchParams.toString());
      if (value) {
        params.set(name, value);
      } else {
        params.delete(name);
      }
      return params.toString();
    },
    [searchParams]
  );

  const currentStatus = searchParams.get("status") ?? "";
  const currentSort = searchParams.get("sort") ?? "newest";
  const currentCategory = searchParams.get("category") ?? "";

  const handleChange = (key: string, value: string) => {
    router.push(`${pathname}?${createQueryString(key, value)}`);
  };

  return (
    <div className="flex flex-wrap gap-3 items-center">
      {showCategoryFilter && (
        <div className="flex items-center gap-2">
          <label className="text-xs font-medium text-ink/50 uppercase tracking-wider">Category</label>
          <div className="flex gap-1">
            {categoryOptions.map(({ value, label }) => (
              <button
                key={value}
                onClick={() => handleChange("category", value)}
                className={cn(
                  "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
                  currentCategory === value
                    ? "bg-burnt text-white"
                    : "bg-moss/10 text-ink/70 hover:bg-moss/20"
                )}
              >
                {label}
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <label className="text-xs font-medium text-ink/50 uppercase tracking-wider">Status</label>
        <div className="flex gap-1">
          {statusOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleChange("status", value)}
              className={cn(
                "px-3 py-1.5 rounded-full text-sm font-medium transition-colors duration-150",
                currentStatus === value
                  ? "bg-burnt text-white"
                  : "bg-moss/10 text-ink/70 hover:bg-moss/20"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center gap-2 ml-auto">
        <label className="text-xs font-medium text-ink/50 uppercase tracking-wider">Sort</label>
        <select
          value={currentSort}
          onChange={(e) => handleChange("sort", e.target.value)}
          className="text-sm border border-moss/20 rounded-lg px-3 py-1.5 bg-white text-ink focus:outline-none focus:ring-2 focus:ring-magic/30"
        >
          {sortOptions.map(({ value, label }) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>
    </div>
  );
}
