"use client";

import { clientAction } from "@/lib/clientAction";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import { toast } from "sonner";
import { ArrowLeft, ArrowRight, Crop, ExternalLink, ImagePlus, Save, Star, Trash2, X } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { IconButton } from "@/components/ui/IconButton";
import { PageHeader } from "@/components/ui/PageHeader";
import { ConfirmDialog } from "@/components/ui/ConfirmDialog";
import { resizeImage } from "@/components/ui/ImageUpload";
import { ImageEditor } from "@/components/ui/ImageEditor";
import { cn } from "@/lib/utils";
import { saveEvent as saveEventAction, deleteEvent as deleteEventAction, uploadEventImage as uploadEventImageAction } from "../actions";

// Server actions return { ok, error }; these wrappers throw the real message (see lib/clientAction.ts).
const saveEvent = clientAction(saveEventAction);
const deleteEvent = clientAction(deleteEventAction);
const uploadEventImage = clientAction(uploadEventImageAction);

type Photo = { photo_url: string; caption: string | null };
type EventForm = {
  id: string | null;
  slug: string | null;
  title: string;
  event_date: string | null;
  description: string;
  cover_photo_url: string | null;
  is_published: boolean;
  photos: Photo[];
};

export default function EventEditor({ initial }: { initial: EventForm | null }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [f, setF] = useState<EventForm>(initial ?? {
    id: null, slug: null, title: "", event_date: null, description: "",
    cover_photo_url: null, is_published: true, photos: [],
  });
  const [uploading, setUploading] = useState<{ done: number; total: number } | null>(null);
  const [pending, startTransition] = useTransition();
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [cropping, setCropping] = useState<string | null>(null);  // photo URL being edited

  // Swap an edited photo in place (and keep it as the cover if it was).
  async function replaceEdited(oldUrl: string, blob: Blob) {
    const fd = new FormData();
    fd.set("file", blob, "photo.jpg");
    try {
      const { url } = await uploadEventImage(fd);
      setF((s) => ({
        ...s,
        photos: s.photos.map((p) => (p.photo_url === oldUrl ? { ...p, photo_url: url } : p)),
        cover_photo_url: s.cover_photo_url === oldUrl ? url : s.cover_photo_url,
      }));
      setCropping(null);
      toast.success("Photo updated — press Save");
    } catch (err) {
      toast.error((err as Error).message);
    }
  }

  async function addPhotos(files: File[]) {
    const images = files.filter((x) => x.type.startsWith("image/"));
    if (images.length === 0) return;
    setUploading({ done: 0, total: images.length });
    const added: Photo[] = [];
    // One at a time: phones on school Wi-Fi choke on parallel uploads.
    for (const file of images) {
      try {
        const blob = await resizeImage(file, 2000);
        const fd = new FormData();
        fd.set("file", blob, file.name.replace(/\.[^.]+$/, ".jpg"));
        const { url } = await uploadEventImage(fd);
        added.push({ photo_url: url, caption: null });
        setF((s) => ({ ...s, photos: [...s.photos, { photo_url: url, caption: null }] }));
      } catch (err) {
        toast.error(`${file.name}: ${(err as Error).message}`);
      }
      setUploading((u) => u && { ...u, done: u.done + 1 });
    }
    setUploading(null);
    if (added.length) toast.success(`${added.length} photo${added.length === 1 ? "" : "s"} added — press Save`);
  }

  function move(i: number, dir: -1 | 1) {
    setF((s) => {
      const photos = [...s.photos];
      [photos[i], photos[i + dir]] = [photos[i + dir], photos[i]];
      return { ...s, photos };
    });
  }

  function submit(e: React.FormEvent) {
    e.preventDefault();
    startTransition(async () => {
      try {
        const res = await saveEvent({
          id: f.id, title: f.title, event_date: f.event_date || null, description: f.description,
          cover_photo_url: f.cover_photo_url, is_published: f.is_published, photos: f.photos,
        });
        toast.success("Event saved");
        if (!f.id) router.replace(`/admin/website/events/${res.id}`);
        else router.refresh();
      } catch (err) {
        toast.error((err as Error).message);
      }
    });
  }

  const cover = f.cover_photo_url ?? f.photos[0]?.photo_url ?? null;

  return (
    <div className="mx-auto max-w-5xl">
      <PageHeader
        breadcrumbs={[
          { label: "Website", href: "/admin/website" },
          { label: "Events", href: "/admin/website/events" },
          { label: f.id ? "Edit" : "New" },
        ]}
        title={f.id ? f.title || "Edit event" : "New event"}
        actions={f.slug && (
          <Link href={`/life/${f.slug}`} target="_blank"
            className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink-200 bg-white px-3.5 text-sm text-ink-700 shadow-sm hover:bg-ink-50">
            <ExternalLink className="h-4 w-4" /> View live
          </Link>
        )}
      />

      <form onSubmit={submit} className="space-y-6">
        <section className="grid grid-cols-1 gap-4 rounded-xl border border-ink-200 bg-white p-6 shadow-sm sm:grid-cols-3">
          <Input containerClassName="sm:col-span-2" label="Title" required value={f.title}
            placeholder="e.g. Annual Day 2026" onChange={(e) => setF({ ...f, title: e.target.value })} />
          <Input label="Date" type="date" value={f.event_date ?? ""}
            onChange={(e) => setF({ ...f, event_date: e.target.value || null })} />
          <label className="flex flex-col gap-1.5 text-sm sm:col-span-3">
            <span className="font-medium text-ink-700">About the event</span>
            <textarea rows={4} value={f.description} onChange={(e) => setF({ ...f, description: e.target.value })}
              placeholder="A few lines on what happened, who took part, and what made it special."
              className="block w-full rounded-lg border border-ink-200 bg-white px-3.5 py-2.5 text-sm shadow-xs outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-100" />
          </label>
        </section>

        <section className="rounded-xl border border-ink-200 bg-white p-6 shadow-sm">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-semibold text-ink-900">Photos</h2>
              <p className="mt-0.5 text-xs text-ink-500">
                Select many at once. The starred photo is the cover; the order here is the order on the website.
              </p>
            </div>
            <Button type="button" size="sm" variant="secondary" loading={!!uploading}
              leftIcon={<ImagePlus className="h-4 w-4" />} onClick={() => inputRef.current?.click()}>
              {uploading ? `Uploading ${uploading.done}/${uploading.total}` : "Add photos"}
            </Button>
            <input ref={inputRef} type="file" accept="image/*" multiple className="hidden"
              onChange={(e) => { const files = Array.from(e.target.files ?? []); e.target.value = ""; void addPhotos(files); }} />
          </div>

          {f.photos.length === 0 ? (
            <button type="button" onClick={() => inputRef.current?.click()}
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void addPhotos(Array.from(e.dataTransfer.files)); }}
              className="mt-5 flex w-full flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-ink-200 py-14 text-ink-500 hover:border-brand-300 hover:bg-brand-50/40">
              <ImagePlus className="h-8 w-8" />
              <span className="text-sm font-medium">Drop photos here or click to choose</span>
            </button>
          ) : (
            <ul className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4"
              onDragOver={(e) => e.preventDefault()}
              onDrop={(e) => { e.preventDefault(); void addPhotos(Array.from(e.dataTransfer.files)); }}>
              {f.photos.map((p, i) => {
                const isCover = p.photo_url === cover;
                return (
                  <li key={p.photo_url} className={cn("group relative aspect-4/3 overflow-hidden rounded-lg bg-ink-100 ring-2",
                    isCover ? "ring-accent-400" : "ring-transparent")}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={p.photo_url} alt="" className="h-full w-full object-cover" />
                    {isCover && (
                      <span className="absolute left-2 top-2 rounded-full bg-accent-400 px-2 py-0.5 text-[10px] font-bold uppercase text-accent-950">Cover</span>
                    )}
                    <div className="absolute inset-x-0 bottom-0 flex justify-between gap-1 bg-linear-to-t from-black/60 to-transparent p-1.5 opacity-100 transition-opacity sm:opacity-0 sm:group-hover:opacity-100">
                      <div className="flex gap-1">
                        <IconButton label="Move left" size="sm" className="bg-white/90! hover:bg-white!" disabled={i === 0} onClick={() => move(i, -1)}>
                          <ArrowLeft className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton label="Move right" size="sm" className="bg-white/90! hover:bg-white!" disabled={i === f.photos.length - 1} onClick={() => move(i, 1)}>
                          <ArrowRight className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                      <div className="flex gap-1">
                        <IconButton label="Crop & adjust" size="sm" className="bg-white/90! hover:bg-white!"
                          onClick={() => setCropping(p.photo_url)}>
                          <Crop className="h-3.5 w-3.5" />
                        </IconButton>
                        <IconButton label="Make cover" size="sm" tone="brand" className="bg-white/90! hover:bg-white!"
                          onClick={() => setF({ ...f, cover_photo_url: p.photo_url })}>
                          <Star className={cn("h-3.5 w-3.5", isCover && "fill-accent-400 text-accent-500")} />
                        </IconButton>
                        <IconButton label="Remove photo" size="sm" tone="danger" className="bg-white/90! hover:bg-white!"
                          onClick={() => setF({
                            ...f,
                            photos: f.photos.filter((x) => x.photo_url !== p.photo_url),
                            cover_photo_url: f.cover_photo_url === p.photo_url ? null : f.cover_photo_url,
                          })}>
                          <X className="h-3.5 w-3.5" />
                        </IconButton>
                      </div>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 text-sm text-ink-700">
              <input type="checkbox" checked={f.is_published} onChange={(e) => setF({ ...f, is_published: e.target.checked })}
                className="h-4 w-4 rounded border-ink-300 text-brand-700 focus:ring-brand-500" />
              Published on the website
            </label>
            {f.id && (
              <Button type="button" variant="ghost" size="sm" className="text-red-600 hover:bg-red-50"
                leftIcon={<Trash2 className="h-4 w-4" />} onClick={() => setConfirmDelete(true)}>
                Delete event
              </Button>
            )}
          </div>
          <Button type="submit" size="lg" loading={pending} disabled={!!uploading}
            leftIcon={pending ? undefined : <Save className="h-4 w-4" />}>
            Save event
          </Button>
        </div>
      </form>

      {cropping && (
        <ImageEditor
          source={cropping}
          initialAspect="original"
          maxDimension={2000}
          onCancel={() => setCropping(null)}
          onDone={(blob) => replaceEdited(cropping, blob)}
        />
      )}

      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        title="Delete this event and all its photos?"
        description="This cannot be undone."
        confirmLabel="Delete"
        loading={pending}
        onConfirm={() => {
          setConfirmDelete(false);
          startTransition(async () => {
            try {
              await deleteEvent(f.id!);
              toast.success("Event deleted");
              router.replace("/admin/website/events");
            } catch (err) { toast.error((err as Error).message); }
          });
        }}
      />
    </div>
  );
}
