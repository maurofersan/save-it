"use client";

import { useEffect } from "react";

export function Modal({
  open,
  title,
  onClose,
  children,
  footer,
  maxWidthClassName = "max-w-3xl",
}: {
  open: boolean;
  title: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Cerrar"
        onClick={onClose}
      />
      <div className="absolute inset-0 grid place-items-center p-4">
        <div
          role="dialog"
          aria-modal="true"
          className={`w-full ${maxWidthClassName} overflow-hidden rounded-2xl border border-white/10 bg-slate-950/95 shadow-2xl backdrop-blur`}
        >
          <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-blue-200">
                Validación
              </div>
              <div className="mt-1 truncate text-lg font-semibold text-slate-50">
                {title}
              </div>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="shrink-0 rounded-xl border border-white/10 bg-white/5 p-2 text-slate-100 transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500/60 cursor-pointer"
              aria-label="Cerrar modal"
            >
              <svg
                aria-hidden
                className="h-5 w-5"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          </div>

          <div className="max-h-[70vh] overflow-y-auto px-5 py-4">
            {children}
          </div>

          {footer ? (
            <div className="border-t border-white/10 px-5 py-4">{footer}</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
