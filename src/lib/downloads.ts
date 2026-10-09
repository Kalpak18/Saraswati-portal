// Downloads vocabulary, shared by the admin page and the public page.

export const DOWNLOAD_CATEGORIES = [
  { key: "calendar", mr: "शैक्षणिक दिनदर्शिका", en: "Calendar" },
  { key: "forms", mr: "अर्ज", en: "Forms" },
  { key: "circulars", mr: "परिपत्रके", en: "Circulars" },
  { key: "syllabus", mr: "अभ्यासक्रम", en: "Syllabus" },
  { key: "results", mr: "निकाल", en: "Results" },
  { key: "other", mr: "इतर", en: "Other" },
] as const;

export type DownloadItem = {
  id: string;
  title: string;
  title_mr: string | null;
  description: string;
  category: string;
  file_url: string;
  file_name: string | null;
  file_size: number | null;
  is_published: boolean;
  display_order: number;
  created_at: string;
};

/** "PDF · 1.2 MB" */
export function fileMeta(name: string | null, size: number | null): string {
  const ext = (name?.split(".").pop() ?? "").toUpperCase();
  const s = size == null ? "" : size >= 1_048_576 ? `${(size / 1_048_576).toFixed(1)} MB` : `${Math.max(1, Math.round(size / 1024))} KB`;
  return [ext, s].filter(Boolean).join(" · ");
}
