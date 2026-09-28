import { createSupabaseAdmin } from "@/lib/supabase/admin";

/**
 * One public bucket for all CMS media. Sub-folders separate concerns so a
 * future policy can lock any one of them down individually without moving
 * files. Kept public because every image on this bucket is meant for
 * unauthenticated viewers of the school website anyway.
 */
export const PUBLIC_BUCKET = "public-assets";

/** Where a given image type lives inside the bucket. */
export type MediaKind =
  | "hero"
  | "events"
  | "team"
  | "achievements"
  | "gallery"
  | "toppers"
  | "logo";

/**
 * Idempotent bucket bootstrap. Safe to call from any server action — the
 * first request creates the bucket, later ones are a cheap listBuckets round
 * trip. Called from every `uploadPublicImage()`.
 */
async function ensureBucket() {
  const admin = createSupabaseAdmin();
  const { data } = await admin.storage.listBuckets();
  if (!data?.some((b) => b.name === PUBLIC_BUCKET)) {
    await admin.storage.createBucket(PUBLIC_BUCKET, {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5 MB — enough for a photo, not enough for a raw camera dump
    });
  }
}

/**
 * Upload a File / Blob / raw bytes to the public bucket and return its public
 * URL. Path is auto-generated so callers never have to think about naming.
 */
export async function uploadPublicImage(
  kind: MediaKind,
  file: { name?: string; type?: string; arrayBuffer: () => Promise<ArrayBuffer> },
): Promise<{ url: string; path: string }> {
  await ensureBucket();

  const bytes = new Uint8Array(await file.arrayBuffer());
  const ext = (file.name?.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = ["jpg", "jpeg", "png", "webp", "gif", "avif"].includes(ext) ? ext : "jpg";
  const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${safeExt}`;

  const admin = createSupabaseAdmin();
  const { error } = await admin.storage.from(PUBLIC_BUCKET).upload(path, bytes, {
    contentType: file.type || `image/${safeExt}`,
    upsert: false,
  });
  if (error) throw new Error(`Upload failed: ${error.message}`);

  const { data } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { url: data.publicUrl, path };
}

/**
 * Delete a previously-uploaded image. Callers should invoke this when a row
 * that references an image is deleted or the image is replaced — otherwise
 * the bucket accumulates orphans.
 */
export async function deletePublicImage(publicUrl: string) {
  if (!publicUrl) return;
  // Derive the storage path from the URL. The public URL shape is
  // `<supabase>/storage/v1/object/public/<bucket>/<path>`.
  const marker = `/${PUBLIC_BUCKET}/`;
  const idx = publicUrl.indexOf(marker);
  if (idx < 0) return; // not our bucket — leave it alone
  const path = publicUrl.slice(idx + marker.length).split("?")[0];
  if (!path) return;

  const admin = createSupabaseAdmin();
  await admin.storage.from(PUBLIC_BUCKET).remove([path]);
}
