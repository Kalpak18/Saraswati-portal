// Notice board vocabulary shared by the admin editor and the public site.

export const NOTICE_CATEGORIES = [
  { key: "admission", mr: "प्रवेश",     en: "Admission", tone: "bg-emerald-50 text-emerald-800 ring-emerald-200" },
  { key: "result",    mr: "निकाल",      en: "Result",    tone: "bg-brand-50 text-brand-800 ring-brand-200" },
  { key: "exam",      mr: "परीक्षा",     en: "Exam",      tone: "bg-accent-50 text-accent-800 ring-accent-200" },
  { key: "event",     mr: "कार्यक्रम",    en: "Event",     tone: "bg-purple-50 text-purple-800 ring-purple-200" },
  { key: "holiday",   mr: "सुट्टी",       en: "Holiday",   tone: "bg-rose-50 text-rose-800 ring-rose-200" },
  { key: "general",   mr: "सर्वसाधारण",  en: "General",   tone: "bg-ink-100 text-ink-700 ring-ink-200" },
] as const;

export type NoticeCategory = (typeof NOTICE_CATEGORIES)[number]["key"];

export function noticeCategory(key: string) {
  return NOTICE_CATEGORIES.find((c) => c.key === key) ?? NOTICE_CATEGORIES[NOTICE_CATEGORIES.length - 1];
}

export type PublicNotice = {
  id: string;
  title: string;
  body: string;
  category: string;
  link_href: string | null;
  attachment_url: string | null;
  attachment_name: string | null;
  is_pinned: boolean;
  publish_on: string;
};

export const NOTICE_COLUMNS =
  "id, title, body, category, link_href, attachment_url, attachment_name, is_pinned, publish_on";

// "New" badge for the first week after a notice goes up.
export function isNew(publishOn: string, days = 7): boolean {
  const d = new Date(`${publishOn}T00:00:00`);
  return Date.now() - d.getTime() < days * 86_400_000;
}
