import { createServiceClient } from "@/lib/supabase/service";
import { MessageRow } from "@/app/admin/_components/MessageRow";

export const dynamic = "force-dynamic";

export default async function AdminMessagesPage() {
  const supabase = createServiceClient();
  const { data: messages } = await supabase.from("contact_messages").select("*").order("created_at", { ascending: false });

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <h1 className="section-heading">Messages</h1>
      <div className="card divide-y divide-moss/10">
        {(messages ?? []).map((m) => (
          <MessageRow key={m.id} message={m} />
        ))}
        {!messages?.length && (
          <div className="p-10 text-center text-ink/50 font-serif italic">No messages yet.</div>
        )}
      </div>
    </div>
  );
}
