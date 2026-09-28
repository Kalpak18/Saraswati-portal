"use client";

import { useState, useTransition } from "react";
import { toast } from "sonner";
import { CheckCircle2, Send } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { submitContactMessage } from "./actions";

export default function ContactForm() {
  const [pending, startTransition] = useTransition();
  const [sent, setSent] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        await submitContactMessage(form);
        setSent(true);
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  if (sent) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-green-200 bg-green-50 p-6 text-center">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-green-100 text-green-700">
          <CheckCircle2 className="h-5 w-5" />
        </div>
        <h3 className="text-sm font-semibold text-green-900">Message sent</h3>
        <p className="text-xs text-green-800">
          Thank you for reaching out. We&apos;ll get back to you soon.
        </p>
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setSent(false);
            setForm({ name: "", email: "", phone: "", subject: "", message: "" });
          }}
        >
          Send another
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      <Input
        label="Your name"
        required
        placeholder="Full name"
        value={form.name}
        onChange={(e) => setForm({ ...form, name: e.target.value })}
        containerClassName="sm:col-span-2"
      />
      <Input
        label="Email"
        type="email"
        placeholder="you@example.com"
        value={form.email}
        onChange={(e) => setForm({ ...form, email: e.target.value })}
      />
      <Input
        label="Phone"
        type="tel"
        inputMode="numeric"
        placeholder="Phone number"
        value={form.phone}
        onChange={(e) => setForm({ ...form, phone: e.target.value })}
      />
      <Input
        label="Subject"
        placeholder="What's this about?"
        value={form.subject}
        onChange={(e) => setForm({ ...form, subject: e.target.value })}
        containerClassName="sm:col-span-2"
      />
      <label className="flex flex-col gap-1 text-sm sm:col-span-2">
        <span className="font-medium text-gray-700">Message *</span>
        <textarea
          required
          value={form.message}
          onChange={(e) => setForm({ ...form, message: e.target.value })}
          rows={5}
          placeholder="Type your message here…"
          className="block w-full rounded-md border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900 shadow-sm outline-none placeholder:text-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-100"
        />
      </label>
      <div className="sm:col-span-2">
        <Button
          type="submit"
          size="lg"
          loading={pending}
          leftIcon={pending ? undefined : <Send className="h-4 w-4" />}
          className="w-full sm:w-auto"
        >
          Send message
        </Button>
      </div>
    </form>
  );
}
