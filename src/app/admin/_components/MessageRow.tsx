"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { ContactMessage } from "@/types";

export function MessageRow({ message }: { message: ContactMessage }) {
  const [open, setOpen] = useState(false);
  const [read, setRead] = useState(message.read);
  const router = useRouter();

  const toggleRead = async (newVal: boolean) => {
    setRead(newVal);
    await fetch(`/api/admin/messages/${message.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ read: newVal }),
    });
    router.refresh();
  };

  const handleOpen = async () => {
    const next = !open;
    setOpen(next);
    if (next && !read) await toggleRead(true);
  };

  return (
    <div className="p-4">
      <button
        onClick={handleOpen}
        className="w-full flex justify-between items-center text-left"
      >
        <div className="flex items-center gap-3">
          {!read && <span className="w-2 h-2 rounded-full bg-magic" />}
          <div>
            <div className={`font-sans ${!read ? "font-semibold text-ink" : "text-ink/60"}`}>
              {message.name} <span className="text-ink/40">· {message.subject}</span>
            </div>
            <div className="text-xs text-ink/40 font-serif italic">{message.email}</div>
          </div>
        </div>
        <span className="text-xs text-ink/40 font-sans">
          {new Date(message.created_at).toLocaleDateString()}
        </span>
      </button>
      {open && (
        <div className="mt-3 pl-5 pr-2 pb-2 border-l-2 border-magic/20">
          <p className="text-sm text-ink font-serif whitespace-pre-wrap">{message.message}</p>
          <div className="flex gap-3 mt-3 text-xs font-sans">
            <a href={`mailto:${message.email}?subject=Re: ${encodeURIComponent(message.subject)}`}
              className="text-magic hover:underline">Reply by email</a>
            <button onClick={() => toggleRead(!read)} className="text-ink/50 hover:text-ink">
              Mark {read ? "unread" : "read"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
