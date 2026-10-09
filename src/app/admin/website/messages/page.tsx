import { createSupabaseServer } from "@/lib/supabase/server";
import MessagesClient, { type Message } from "./MessagesClient";

export const dynamic = "force-dynamic";
export const metadata = { title: "Contact inbox" };

export default async function MessagesPage() {
  const supabase = await createSupabaseServer();
  const { data, error } = await supabase
    .from("contact_messages")
    .select("id, name, email, phone, subject, message, status, created_at")
    .order("created_at", { ascending: false })
    .limit(500);
  if (error) {
    return (
      <div className="mx-auto max-w-3xl rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-900">
        Couldn&apos;t load messages: {error.message}
      </div>
    );
  }
  return <MessagesClient messages={(data ?? []) as Message[]} />;
}
