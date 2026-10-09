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
  | "banners"
  | "video"
  | "notices"
  | "downloads"
  | "logo";

// 50 MB: the Supabase free-tier ceiling per object. Photos never get near
// it (they are resized in the browser first); it exists for hero videos.
const BUCKET_LIMIT = 50 * 1024 * 1024;

/**
 * Idempotent bucket bootstrap. Safe to call from any server action — the
 * first request creates the bucket, later ones are a cheap listBuckets round
 * trip. Called from every `uploadPublicImage()`.
 */
async function ensureBucket() {
  const admin = createSupabaseAdmin();
  const { data } = await admin.storage.listBuckets();
  const bucket = data?.find((b) => b.name === PUBLIC_BUCKET);
  if (!bucket) {
    await admin.storage.createBucket(PUBLIC_BUCKET, { public: true, fileSizeLimit: BUCKET_LIMIT });
  } else if ((bucket.file_size_limit ?? 0) < BUCKET_LIMIT) {
    // Buckets created before videos existed were capped at 5 MB.
    await admin.storage.updateBucket(PUBLIC_BUCKET, { public: true, fileSizeLimit: BUCKET_LIMIT });
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

/**
 * Large files (videos, PDF notices) are too big to pass through a server
 * action, so the browser uploads them straight to Storage with a one-time
 * signed URL. The caller (an authenticated server action) decides the path;
 * the browser only gets permission to write that one object.
 */
async function createSignedUpload(kind: MediaKind, fileName: string, allowed: string[]) {
  await ensureBucket();
  const ext = (fileName.split(".").pop() || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  if (!allowed.includes(ext)) throw new Error(`Only ${allowed.join(", ")} files are allowed`);
  const path = `${kind}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;

  const admin = createSupabaseAdmin();
  const { data, error } = await admin.storage.from(PUBLIC_BUCKET).createSignedUploadUrl(path);
  if (error || !data) throw new Error(`Could not start upload: ${error?.message}`);
  const { data: pub } = admin.storage.from(PUBLIC_BUCKET).getPublicUrl(path);
  return { bucket: PUBLIC_BUCKET, path, token: data.token, url: pub.publicUrl };
}

export function createSignedVideoUpload(fileName: string) {
  return createSignedUpload("video", fileName, ["mp4", "webm", "mov", "m4v"]);
}

export function createSignedDownloadUpload(fileName: string) {
  return createSignedUpload("downloads", fileName, ["pdf", "doc", "docx", "xls", "xlsx", "ppt", "pptx", "jpg", "jpeg", "png"]);
}

export function createSignedNoticeUpload(fileName: string) {
  return createSignedUpload("notices", fileName, ["pdf", "jpg", "jpeg", "png", "webp"]);
}
