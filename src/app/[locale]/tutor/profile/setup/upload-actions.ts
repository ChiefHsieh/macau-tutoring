"use server";

import { randomUUID } from "node:crypto";
import { requireProfile } from "@/lib/auth";
import { createClient } from "@/lib/supabase/server";

const MAX_BYTES = 5 * 1024 * 1024;
const ALLOWED_TYPES = new Set(["application/pdf"]);
const ALLOWED_IMAGE_TYPES = new Set(["image/png", "image/jpeg", "image/jpg"]);

function bucketName() {
  return process.env.NEXT_PUBLIC_TUTOR_VERIFICATION_BUCKET?.trim() || "tutor-verification";
}

function avatarBucketName() {
  return process.env.NEXT_PUBLIC_TUTOR_AVATAR_BUCKET?.trim() || "tutor-avatars";
}

export type VerificationDocType = "transcript" | "offer" | "proof";

export async function uploadTutorVerificationPdfAction(formData: FormData): Promise<
  | { ok: true; publicUrl: string }
  | { ok: false; error: string }
> {
  const locale = String(formData.get("locale") ?? "");
  const docType = String(formData.get("documentType") ?? "") as VerificationDocType;
  const file = formData.get("file");

  if (!locale) return { ok: false, error: "Missing locale." };
  if (!["transcript", "offer", "proof"].includes(docType)) {
    return { ok: false, error: "Select document type (transcript, offer, or proof of study)." };
  }
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose a PDF file." };
  }
  if (!ALLOWED_TYPES.has(file.type)) {
    return { ok: false, error: "Only PDF files are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 5MB or smaller." };
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    return { ok: false, error: "Only tutors can upload verification documents." };
  }

  const supabase = await createClient();
  const bucket = bucketName();
  const safeName = file.name.replace(/[^\w.\-]+/g, "_").slice(0, 80);
  const path = `${user.id}/${docType}/${randomUUID()}-${safeName}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: "application/pdf",
    upsert: false,
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message +
        " If this persists, create a public or authenticated Storage bucket named \"" +
        bucket +
        "\" and allow authenticated uploads for tutors.",
    };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) {
    return { ok: false, error: "Upload succeeded but public URL was not returned." };
  }

  return { ok: true, publicUrl: data.publicUrl };
}

export async function uploadTutorAvatarImageAction(formData: FormData): Promise<
  | { ok: true; publicUrl: string }
  | { ok: false; error: string }
> {
  const locale = String(formData.get("locale") ?? "");
  const file = formData.get("file");

  if (!locale) return { ok: false, error: "Missing locale." };
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "Choose an image file." };
  }
  if (!ALLOWED_IMAGE_TYPES.has(file.type)) {
    return { ok: false, error: "Only PNG/JPG/JPEG files are allowed." };
  }
  if (file.size > MAX_BYTES) {
    return { ok: false, error: "File must be 5MB or smaller." };
  }

  const { user, profile } = await requireProfile(locale);
  if (profile.role !== "tutor") {
    return { ok: false, error: "Only tutors can upload profile photos." };
  }

  const supabase = await createClient();
  const bucket = avatarBucketName();
  const extension = file.type === "image/png" ? "png" : "jpg";
  const path = `${user.id}/avatar/${randomUUID()}.${extension}`;

  const buffer = Buffer.from(await file.arrayBuffer());
  const { error } = await supabase.storage.from(bucket).upload(path, buffer, {
    contentType: extension === "png" ? "image/png" : "image/jpeg",
    upsert: false,
  });

  if (error) {
    return {
      ok: false,
      error:
        error.message +
        " If this persists, create a Storage bucket named \"" +
        bucket +
        "\" and allow authenticated uploads for tutors.",
    };
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  if (!data.publicUrl) {
    return { ok: false, error: "Upload succeeded but public URL was not returned." };
  }

  return { ok: true, publicUrl: data.publicUrl };
}
