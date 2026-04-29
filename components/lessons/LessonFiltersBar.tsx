"use client";

import { useMemo, useState, useTransition } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { formInputClassName } from "@/components/ui/Input";
import type { Specialty } from "@/types/models";

type Mode = "validate" | "library";

function buildQuery(params: Record<string, string | undefined>): string {
  const sp = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    const t = (v ?? "").trim();
    if (t) sp.set(k, t);
  }
  const qs = sp.toString();
  return qs ? `?${qs}` : "";
}

export function LessonFiltersBar({
  mode,
  specialties,
  showStatus,
}: {
  mode: Mode;
  specialties: Specialty[];
  showStatus?: boolean;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const sp = useSearchParams();
  const [pending, startTransition] = useTransition();

  const years = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    return Array.from({ length: 8 }).map((_, i) => String(y - i));
  }, []);

  const [q, setQ] = useState(sp.get("q") ?? "");
  const [projectType, setProjectType] = useState(sp.get("projectType") ?? "");
  const [specialty, setSpecialty] = useState(sp.get("specialty") ?? "");
  const [year, setYear] = useState(sp.get("year") ?? "");
  const [ratingMin, setRatingMin] = useState(sp.get("ratingMin") ?? "");
  const [status, setStatus] = useState(sp.get("status") ?? "");

  const submit = () => {
    startTransition(() => {
      router.replace(
        pathname +
          buildQuery({
            q,
            projectType,
            specialty,
            year,
            ratingMin: mode === "library" || mode === "validate" ? ratingMin : undefined,
            status: showStatus ? status : undefined,
          }),
      );
    });
  };

  return (
    <div className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[1.2fr_1fr_220px_220px_auto] lg:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-100">Buscar</span>
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder={
              mode === "validate"
                ? "Título, descripción o autor..."
                : "Palabras clave, causa, solución..."
            }
            className={formInputClassName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-100">Tipo de proyecto</span>
          <input
            value={projectType}
            onChange={(e) => setProjectType(e.target.value)}
            placeholder="Ej. Infraestructura"
            className={formInputClassName}
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                submit();
              }
            }}
          />
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-100">Área</span>
          <select
            value={specialty}
            onChange={(e) => setSpecialty(e.target.value)}
            className={formInputClassName}
          >
            <option value="">Todas</option>
            {specialties.map((s) => (
              <option key={s.id} value={s.key}>
                {s.name}
              </option>
            ))}
          </select>
        </label>

        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-100">Año de publicación</span>
          <select value={year} onChange={(e) => setYear(e.target.value)} className={formInputClassName}>
            <option value="">Todos</option>
            {years.map((y) => (
              <option key={y} value={y}>
                {y}
              </option>
            ))}
          </select>
        </label>

        <button
          type="button"
          onClick={submit}
          disabled={pending}
          className="h-11 rounded-xl bg-blue-600 px-4 text-sm font-medium text-white transition hover:bg-blue-700 disabled:opacity-60"
        >
          {pending ? "Filtrando..." : "Filtrar"}
        </button>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-[220px_220px_1fr] lg:items-end">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm font-medium text-slate-100">Puntuación</span>
          <select
            value={ratingMin}
            onChange={(e) => setRatingMin(e.target.value)}
            className={formInputClassName}
          >
            <option value="">Todas</option>
            <option value="1">≥ 1</option>
            <option value="2">≥ 2</option>
            <option value="3">≥ 3</option>
            <option value="4">≥ 4</option>
            <option value="5">= 5</option>
          </select>
        </label>

        {showStatus ? (
          <label className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-100">Estado</span>
            <select value={status} onChange={(e) => setStatus(e.target.value)} className={formInputClassName}>
              <option value="">Todos</option>
              <option value="RECEIVED">Recibido</option>
              <option value="IN_PROGRESS">En proceso</option>
              <option value="VALIDATED">Validado</option>
              <option value="DISCARDED">Descartado</option>
            </select>
          </label>
        ) : (
          <div />
        )}

        <div className="text-xs text-slate-400">
          Se actualiza sin recargar completamente la página (navegación suave).
        </div>
      </div>
    </div>
  );
}

