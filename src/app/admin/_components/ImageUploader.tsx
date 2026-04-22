"use client";

import { useState } from "react";
import Image from "next/image";
import { X, Upload, Loader2 } from "lucide-react";

interface Props {
  value: string[];
  onChange: (urls: string[]) => void;
  max?: number;
}

export function ImageUploader({ value, onChange, max = 8 }: Props) {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    if (value.length + files.length > max) {
      setError(`Max ${max} images`);
      return;
    }
    setUploading(true);
    setError(null);
    try {
      const newUrls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData();
        fd.append("file", file);
        const res = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Upload failed");
        newUrls.push(json.url);
      }
      onChange([...value, ...newUrls]);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const remove = (url: string) => onChange(value.filter((u) => u !== url));

  return (
    <div>
      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mb-3">
        {value.map((url) => (
          <div key={url} className="relative aspect-square rounded-lg overflow-hidden bg-moss/5 group">
            <Image src={url} alt="" fill className="object-cover" sizes="200px" />
            <button
              type="button"
              onClick={() => remove(url)}
              className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition"
              aria-label="Remove"
            >
              <X size={12} />
            </button>
          </div>
        ))}

        <label className="aspect-square rounded-lg border-2 border-dashed border-moss/30 flex flex-col items-center justify-center text-ink/50 hover:border-magic hover:text-magic cursor-pointer transition">
          {uploading ? <Loader2 className="animate-spin" size={20} /> : <Upload size={20} />}
          <span className="text-xs mt-1 font-sans">{uploading ? "Uploading…" : "Add image"}</span>
          <input
            type="file"
            accept="image/*"
            multiple
            className="hidden"
            disabled={uploading || value.length >= max}
            onChange={(e) => {
              handleFiles(e.target.files);
              e.target.value = "";
            }}
          />
        </label>
      </div>
      {error && <p className="text-sm text-mushroom font-sans">{error}</p>}
      <p className="text-xs text-ink/40 font-serif italic">
        First image is the featured image. Max {max}, 10 MB each.
      </p>
    </div>
  );
}
