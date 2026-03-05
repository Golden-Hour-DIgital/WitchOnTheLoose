"use client";

import { useState } from "react";
import Button from "@/components/ui/Button";

interface FormState {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export default function ContactForm() {
  const [form, setForm] = useState<FormState>({ name: "", email: "", subject: "", message: "" });
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setStatus("loading");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error("Failed");
      setStatus("success");
      setForm({ name: "", email: "", subject: "", message: "" });
    } catch {
      setStatus("error");
    }
  };

  if (status === "success") {
    return (
      <div className="card p-10 text-center">
        <p className="text-5xl mb-4">✦</p>
        <h3 className="font-display text-3xl text-burnt mb-2">Message Received!</h3>
        <p className="text-ink/60 font-serif italic">
          Thank you for reaching out. I&apos;ll be in touch within a few days.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="card p-6 space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <input
          name="name"
          placeholder="Your name"
          required
          value={form.name}
          onChange={handleChange}
          className="border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30 w-full"
        />
        <input
          name="email"
          type="email"
          placeholder="Email address"
          required
          value={form.email}
          onChange={handleChange}
          className="border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30 w-full"
        />
      </div>
      <input
        name="subject"
        placeholder="Subject"
        required
        value={form.subject}
        onChange={handleChange}
        className="border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30 w-full"
      />
      <textarea
        name="message"
        placeholder="Your message…"
        required
        rows={5}
        value={form.message}
        onChange={handleChange}
        className="border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30 w-full resize-none"
      />

      {status === "error" && (
        <p className="text-sm text-mushroom font-sans">
          Something went wrong. Please try again.
        </p>
      )}

      <Button type="submit" loading={status === "loading"} className="w-full">
        Send Message
      </Button>
    </form>
  );
}
