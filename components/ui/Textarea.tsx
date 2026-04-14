"use client";

import * as React from "react";

export function Textarea(
  props: React.TextareaHTMLAttributes<HTMLTextAreaElement> & {
    label?: string;
    hint?: string;
    error?: string;
  },
) {
  const { label, hint, error, className = "", ...rest } = props;
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-sm text-slate-200">{label}</span> : null}
      <textarea
        className={`min-h-28 rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/60 ${className}`}
        {...rest}
      />
      {error ? (
        <span className="text-xs text-red-300">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

