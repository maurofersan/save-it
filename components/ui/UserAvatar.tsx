"use client";

import Image from "next/image";
import { FaUser } from "react-icons/fa";

const sizeToClass: Record<number, string> = {
  32: "h-8 w-8 min-h-8 min-w-8",
  40: "h-10 w-10 min-h-10 min-w-10",
  48: "h-12 w-12 min-h-12 min-w-12",
  56: "h-14 w-14 min-h-14 min-w-14",
  64: "h-16 w-16 min-h-16 min-w-16",
  80: "h-20 w-20 min-h-20 min-w-20",
  96: "h-24 w-24 min-h-24 min-w-24",
  112: "h-28 w-28 min-h-28 min-w-28",
};

type Props = {
  name: string;
  src: string | null;
  size?: 32 | 40 | 48 | 56 | 64 | 80 | 96 | 112;
  className?: string;
};

/**
 * Avatar circular: foto o placeholder con icono de usuario.
 * Acepta URLs `blob:` (vista previa local) o https (p. ej. Cloudinary).
 */
export function UserAvatar({ name, src, size = 40, className = "" }: Props) {
  const dim = sizeToClass[size] ?? "h-10 w-10 min-h-10 min-w-10";
  const isBlob = Boolean(src?.startsWith("blob:"));

  return (
    <div
      className={`relative ${dim} shrink-0 overflow-hidden rounded-full border border-white/10 bg-white/5 text-slate-600 shadow-inner ${className}`}
      aria-label={name}
      title={name}
    >
      {src ? (
        isBlob ? (
          // eslint-disable-next-line @next/next/no-img-element -- preview local antes de subir
          <img src={src} alt="" className="h-full w-full object-cover" />
        ) : (
          <Image
            src={src}
            alt=""
            width={size}
            height={size}
            className="h-full w-full object-cover"
          />
        )
      ) : (
        <div
          className="flex h-full w-full items-center justify-center"
          aria-hidden
        >
          <FaUser className="h-[64%] w-[64%]" aria-hidden />
        </div>
      )}
    </div>
  );
}
