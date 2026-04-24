"use client";

import { useEffect, useRef, useState } from "react";
import { UserAvatar } from "@/components/ui/UserAvatar";
import { Button } from "@/components/ui/Button";

type Props = {
  /** Nombre del campo en el `FormData` (mismo formulario que el resto del perfil). */
  fileInputName: string;
  userName: string;
  defaultUrl: string | null;
};

/**
 * Selector de foto de perfil: vista previa, icono por defecto y un solo `input type="file"`.
 * La subida y Cloudinary ocurren en la server action al enviar el formulario.
 */
export function ProfilePhotoPicker({ fileInputName, userName, defaultUrl }: Props) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<string | null>(null);

  useEffect(
    () => () => {
      if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const displaySrc: string | null = preview ?? defaultUrl;

  return (
    <div className="flex flex-col items-center gap-3 sm:items-end">
      <div className="flex flex-col items-center gap-2 sm:items-end">
        <UserAvatar name={userName} src={displaySrc} size={112} className="ring-1 ring-white/10" />
        <input
          ref={inputRef}
          type="file"
          name={fileInputName}
          accept="image/png,image/jpeg,image/webp"
          className="sr-only"
          tabIndex={-1}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (preview?.startsWith("blob:")) URL.revokeObjectURL(preview);
            if (!f) {
              setPreview(null);
              return;
            }
            setPreview(URL.createObjectURL(f));
          }}
        />
        <div className="text-center sm:text-right">
          <p className="text-sm text-slate-200">Foto de perfil</p>
          <p className="mt-0.5 max-w-[220px] text-xs text-slate-400">
            PNG, JPG o WEBP · máx. 5 MB. Se subirá al guardar.
          </p>
        </div>
        <Button
          type="button"
          variant="secondary"
          className="w-full min-w-40 sm:w-auto"
          onClick={() => inputRef.current?.click()}
        >
          {displaySrc ? "Cambiar foto" : "Subir foto"}
        </Button>
      </div>
    </div>
  );
}
