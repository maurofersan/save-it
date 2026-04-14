import * as React from "react";
import type { LessonStatus } from "@/types/domain";

export function StatusBadge({ status }: { status: LessonStatus }) {
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border";
  const cls =
    status === "VALIDATED"
      ? "bg-green-500/10 text-green-200 border-green-500/25"
      : status === "DISCARDED"
        ? "bg-red-500/10 text-red-200 border-red-500/25"
        : status === "IN_PROGRESS"
          ? "bg-amber-500/10 text-amber-200 border-amber-500/25"
          : "bg-blue-500/10 text-blue-200 border-blue-500/25";
  const label =
    status === "VALIDATED"
      ? "VALIDADO"
      : status === "DISCARDED"
        ? "DESCARTADO"
        : status === "IN_PROGRESS"
          ? "EN PROCESO"
          : "RECIBIDO";
  return <span className={`${base} ${cls}`}>{label}</span>;
}

export function Pill(props: React.HTMLAttributes<HTMLSpanElement> & { tone?: "slate" | "blue" }) {
  const { tone = "slate", className = "", ...rest } = props;
  const base = "inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium border";
  const cls =
    tone === "blue"
      ? "bg-blue-500/10 text-blue-200 border-blue-500/25"
      : "bg-white/5 text-slate-200 border-white/10";
  return <span className={`${base} ${cls} ${className}`} {...rest} />;
}

