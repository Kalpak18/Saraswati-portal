"use client";

import { clientAction } from "@/lib/clientAction";
import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import { toast } from "sonner";
import { Archive, Check, Inbox, Mail, MailOpen, Phone, Reply, Trash2 } from "lucide-react";
import { Badge } from "@/components/ui/Badge";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { EmptyState } from "@/components/ui/EmptyState";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { cn } from "@/lib/utils";
import { setMessageStatus as setMessageStatusAction, deleteMessage as deleteMessageAction } from "./actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const setMessageStatus = clientAction(setMessageStatusAction);
const deleteMessage = clientAction(deleteMessageAction);

export type Message = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  subject: string | null;
  message: string;
  status: "new" | "read" | "replied" | "archived";
  created_at: string;
};

const FILTERS = [
  { key: "inbox", label: "Inbox" },        // new + read
  { key: "new", label: "New" },
  { key: "replied", label: "Replied" },
  { key: "archived", label: "Archived" },
  { key: "all", label: "All" },
] as const;

const STATUS_TONE = { new: "brand", read: "gray", replied: "green", archived: "gray" } as const;

function when(iso: string) {
  return new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", year: "numeric", hour: "numeric", minute: "2-digit" });
}

export default function MessagesClient({ messages }: { messages: Message[] }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["key"]>("inbox");
  const [open, setOpen] = useState<string | null>(null);
  const [confirm, setConfirm] = useState<Message | null>(null);

  const counts = useMemo(() => ({
    new: messages.filter((m) => m.status === "new").length,
  }), [messages]);

  const visible = messages.filter((m) =>
    filter === "all" ? true
    : filter === "inbox" ? m.status === "new" || m.status === "read"
    : m.status === filter);

  function run(fn: () => Promise<unknown>, ok?: string) {
    startTransition(async () => {
      try { await fn(); if (ok) toast.success(ok); router.refresh(); }
      catch (err) { toast.error((err as Error).message); }
    });
  }

  function toggle(m: Message) {
    setOpen(open === m.id ? null : m.id);
    // Opening a new message marks it read.
    if (open !== m.id && m.status === "new") run(() => setMessageStatus(m.id, "read"));
  }

  return (
    <div className="mx-auto max-w-4xl">
      <PageHeader
        breadcrumbs={[{ label: "Website", href: "/admin/website" }, { label: "Contact inbox" }]}
        title="Contact inbox"
        description="Messages sent from the Contact page. Reply by email or phone, then mark them replied."
      />

      <div className="mb-4 flex flex-wrap gap-2">
        {FILTERS.map((f) => (
          <button key={f.key} type="button" onClick={() => setFilter(f.key)}
            className={cn("rounded-full px-3 py-1 text-xs font-medium ring-1 transition-colors",
              filter === f.key ? "bg-brand-700 text-white ring-brand-700" : "bg-white text-ink-700 ring-ink-200 hover:bg-ink-50")}>
            {f.label}{f.key === "new" && counts.new > 0 ? ` (${counts.new})` : ""}
          </button>
        ))}
      </div>

      {visible.length === 0 ? (
        <div className="rounded-xl border border-ink-200 bg-white shadow-sm">
          <EmptyState icon={<Inbox className="h-6 w-6" />}
            title={messages.length ? "Nothing here" : "No messages yet"}
            description={messages.length ? undefined : "When someone uses the Contact page, their message appears here."} />
        </div>
      ) : (
        <ul className="divide-y divide-ink-100 overflow-hidden rounded-xl border border-ink-200 bg-white shadow-sm">
          {visible.map((m) => {
            const isOpen = open === m.id;
            const replySubject = encodeURIComponent(`Re: ${m.subject || "Your message to the school"}`);
            return (
              <li key={m.id} className={cn(m.status === "new" && "bg-brand-50/40")}>
                <button type="button" onClick={() => toggle(m)} aria-expanded={isOpen}
                  className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-ink-50">
                  {m.status === "new" ? <Mail className="mt-0.5 h-4 w-4 flex-none text-brand-700" /> : <MailOpen className="mt-0.5 h-4 w-4 flex-none text-ink-400" />}
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className={cn("truncate text-sm", m.status === "new" ? "font-semibold text-ink-900" : "font-medium text-ink-800")}>{m.name}</span>
                      <Badge tone={STATUS_TONE[m.status]}>{m.status}</Badge>
                      <span className="ml-auto text-xs tabular-nums text-ink-500">{when(m.created_at)}</span>
                    </div>
                    <div className="truncate text-sm text-ink-700">{m.subject || "(no subject)"}</div>
                    {!isOpen && <div className="truncate text-xs text-ink-500">{m.message}</div>}
                  </div>
                </button>

                {isOpen && (
                  <div className="border-t border-ink-100 bg-white px-4 py-4 sm:pl-11">
                    <p className="whitespace-pre-line text-sm leading-relaxed text-ink-800">{m.message}</p>
                    <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-ink-600">
                      {m.email && <a href={`mailto:${m.email}`} className="hover:text-brand-700 hover:underline">{m.email}</a>}
                      {m.phone && <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`} className="tabular-nums hover:text-brand-700 hover:underline">{m.phone}</a>}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {m.email && (
                        <a href={`mailto:${m.email}?subject=${replySubject}`}
                          onClick={() => run(() => setMessageStatus(m.id, "replied"))}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md bg-brand-700 px-3.5 text-sm font-medium text-white hover:bg-brand-800">
                          <Reply className="h-4 w-4" /> Reply by email
                        </a>
                      )}
                      {m.phone && (
                        <a href={`tel:${m.phone.replace(/[^\d+]/g, "")}`}
                          className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-800 hover:bg-ink-50">
                          <Phone className="h-4 w-4" /> Call
                        </a>
                      )}
                      <span className="flex-1" />
                      {m.status !== "replied" && (
                        <IconButton label="Mark replied" tone="brand" disabled={pending}
                          onClick={() => run(() => setMessageStatus(m.id, "replied"), "Marked replied")}><Check className="h-4 w-4" /></IconButton>
                      )}
                      {m.status !== "archived" && (
                        <IconButton label="Archive" disabled={pending}
                          onClick={() => run(() => setMessageStatus(m.id, "archived"), "Archived")}><Archive className="h-4 w-4" /></IconButton>
                      )}
                      {m.status !== "new" && (
                        <IconButton label="Mark unread" disabled={pending}
                          onClick={() => run(() => setMessageStatus(m.id, "new"))}><Mail className="h-4 w-4" /></IconButton>
                      )}
                      <IconButton label="Delete" tone="danger" onClick={() => setConfirm(m)}><Trash2 className="h-4 w-4" /></IconButton>
                    </div>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        title="Delete this message?"
        description="It can't be recovered. Archive it instead if you might need it later."
        confirmLabel="Delete"
        loading={pending}
        onConfirm={() => { const id = confirm!.id; setConfirm(null); setOpen(null); run(() => deleteMessage(id), "Message deleted"); }}
      />
    </div>
  );
}
