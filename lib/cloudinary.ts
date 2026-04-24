import "server-only";
import { v2 as cloudinary } from "cloudinary";
import type { UploadApiResponse } from "cloudinary";
import { Readable } from "stream";

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is not set`);
  return value;
}

let isConfigured = false;
function ensureCloudinaryConfigured(): void {
  if (isConfigured) return;
  cloudinary.config({
    cloud_name: requireEnv("CLOUDINARY_CLOUD_NAME"),
    api_key: requireEnv("CLOUDINARY_API_KEY"),
    api_secret: requireEnv("CLOUDINARY_API_SECRET"),
  });
  isConfigured = true;
}

function sanitizePublicId(input: string): string {
  // Cloudinary public_id must not contain path separators.
  const base = input.replaceAll("\\", "/").split("/").pop() ?? input;
  // If caller includes an extension, remove it for nicer Cloudinary IDs.
  return base.replace(/\.[a-z0-9]+$/i, "");
}

async function uploadStream(
  buffer: Buffer,
  opts: {
    folder: string;
    publicId: string;
    resourceType: "image" | "raw";
  },
): Promise<UploadApiResponse> {
  ensureCloudinaryConfigured();
  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder,
        public_id: opts.publicId,
        resource_type: opts.resourceType,
      },
      (error, result) => {
        if (error) return reject(error);
        if (!result) return reject(new Error("Cloudinary upload returned no result"));
        resolve(result);
      },
    );
    Readable.from(buffer).pipe(upload);
  });
}

/** Carpeta de avatares (Cloudinary: Media Library bajo `nextjs-save-it/profile`). */
export const CLOUDINARY_PROFILE_FOLDER = "nextjs-save-it/profile" as const;

export type UploadImageOptions = {
  /** Carpeta lógica en Cloudinary; por defecto `nextjs-save-it` (misma que antes). */
  folder?: string;
};

export async function uploadImage(
  image: File,
  baseName: string,
  options?: UploadImageOptions,
): Promise<string> {
  const imageData = await image.arrayBuffer();
  const publicId = sanitizePublicId(baseName);
  const folder = options?.folder ?? "nextjs-save-it";
  const result = await uploadStream(Buffer.from(imageData), {
    folder,
    publicId,
    resourceType: "image",
  });
  return result.secure_url;
}

/** Imágenes o documentos (PDF, Office, etc.) vía `resource_type: raw`. */
export async function uploadLessonAttachment(
  file: File,
  baseName: string,
): Promise<{ url: string; isImage: boolean }> {
  const data = await file.arrayBuffer();
  const publicId = sanitizePublicId(baseName);
  const isImage = file.type.startsWith("image/");
  const result = await uploadStream(Buffer.from(data), {
    folder: "nextjs-save-it",
    publicId,
    resourceType: isImage ? "image" : "raw",
  });
  return { url: result.secure_url, isImage };
}
