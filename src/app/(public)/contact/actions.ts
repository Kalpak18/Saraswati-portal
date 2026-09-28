"use server";

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
});

export async function submitContactMessage(input: unknown) {
  const parsed = ContactSchema.safeParse(input);
  if (!parsed.success) throw new Error(parsed.error.issues[0].message);
  const p = parsed.data;

  const h = await headers();
  const rawIp = h.get("x-forwarded-for")?.split(",")[0]?.trim() ?? h.get("x-real-ip") ?? "";
  const ip_hash = rawIp
    ? createHash("sha256").update(rawIp + "|" + env.IP_HASH_SALT).digest("hex")
    : null;
  const user_agent = h.get("user-agent")?.slice(0, 400) ?? null;

  const admin = createSupabaseAdmin();
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
