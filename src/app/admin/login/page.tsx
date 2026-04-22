"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import Button from "@/components/ui/Button";

export default function AdminLoginPage() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    setError(null);

    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;

    const { error: authError } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${siteUrl}/admin`,
        shouldCreateUser: true,
      },
    });

    if (authError) {
      setError(authError.message);
      setState("error");
    } else {
      setState("sent");
    }
  };

  return (
    <div className="container-site py-20 max-w-md animate-fade-in">
      <h1 className="section-heading mb-2">Admin Sign-In</h1>
      <p className="section-subheading mb-10">
        Enter your email and we&apos;ll send you a magic link.
      </p>

      {state === "sent" ? (
        <div className="card p-6 text-center">
          <p className="font-serif text-ink">
            Check <strong>{email}</strong> for your sign-in link.
          </p>
          <p className="text-xs text-ink/40 mt-3 font-serif italic">
            Didn&apos;t arrive? Check spam, or try again in a minute.
          </p>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="card p-6 space-y-4">
          <input
            type="email"
            required
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full border border-moss/20 rounded-xl px-4 py-3 text-sm font-sans bg-white focus:outline-none focus:ring-2 focus:ring-magic/30"
          />
          {error && (
            <div className="rounded-xl bg-mushroom/10 border border-mushroom/20 px-4 py-3 text-sm text-mushroom">
              {error}
            </div>
          )}
          <Button type="submit" className="w-full" loading={state === "sending"}>
            Send magic link
          </Button>
        </form>
      )}
    </div>
  );
}
