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

async function uploadImageStream(
  buffer: Buffer,
  opts: { folder: string; publicId: string },
): Promise<UploadApiResponse> {
  ensureCloudinaryConfigured();
  return await new Promise<UploadApiResponse>((resolve, reject) => {
    const upload = cloudinary.uploader.upload_stream(
      {
        folder: opts.folder,
        public_id: opts.publicId,
        resource_type: "image",
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

export async function uploadImage(image: File, baseName: string): Promise<string> {
  const imageData = await image.arrayBuffer();
  const publicId = sanitizePublicId(baseName);
  const result = await uploadImageStream(Buffer.from(imageData), {
    folder: "nextjs-save-it",
    publicId,
  });
  return result.secure_url;
}
