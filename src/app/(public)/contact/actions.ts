"use server";

import { toResult } from "@/lib/actionResult";
import { headers } from "next/headers";
import { createHash } from "node:crypto";
import { z } from "zod";
import { createSupabaseAdmin } from "@/lib/supabase/admin";
import { env } from "@/lib/env";

const ContactSchema = z.object({
  name: z.string().min(1, "Name required").max(200),
  email: z.string().email("Invalid email").max(200).nullable().or(z.literal("").transform(() => null)),
  phone: z.string().max(30).nullable().or(z.literal("").transform(() => null)),
  subject: z.string().max(200).nullable().or(z.literal("").transform(() => null)),
  message: z.string().min(5, "Message too short").max(4000),
  website: z.string().max(200).optional(),   // honeypot — must stay empty
});

const MAX_PER_WINDOW = 3;
const WINDOW_MINUTES = 10;

async function submitContactMessage__impl(input: unknown) {
  const parsed = ContactSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const p = parsed.data;
  // A bot filled the hidden field: pretend it worked, store nothing.
  if (p.website) return;

  const h = await headers();
  const rawIp = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "";
  const ip_hash = rawIp
    ? createHash("sha256").update(rawIp + "|" + env.IP_HASH_SALT).digest("hex")
    : null;
  const user_agent = h.get("user-agent")?.slice(0, 400) ?? null;

  const admin = createSupabaseAdmin();

  // Rate limit per visitor (hashed IP), so the inbox can't be flooded.
  if (ip_hash) {
    const since = new Date(Date.now() - WINDOW_MINUTES * 60_000).toISOString();
    const { count } = await admin
      .from("contact_messages").select("id", { count: "exact", head: true })
      .eq("ip_hash", ip_hash).gte("created_at", since);
    if ((count ?? 0) >= MAX_PER_WINDOW) {
      throw new Error("खूप संदेश पाठवले. थोड्या वेळाने प्रयत्न करा · Too many messages — please try again in a few minutes");
    }
  }

  const { error } = await admin.from("contact_messages").insert({
    name: p.name,
    email: p.email,
    phone: p.phone,
    subject: p.subject,
    message: p.message,
    status: "new",
    ip_hash,
    user_agent,
  });
  if (error) {
    console.error("[contact] insert failed:", error.message);
    throw new Error("तांत्रिक अडचण. कृपया पुन्हा प्रयत्न करा · Something went wrong, please try again");
  }
}

// ---- Exported actions: errors come back as values (see lib/actionResult.ts) ----
export async function submitContactMessage(...args: Parameters<typeof submitContactMessage__impl>) { return toResult(() => submitContactMessage__impl(...args)); }
