"use client";

import * as React from "react";

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    hint?: string;
    error?: string;
  },
) {
  const { label, hint, error, className = "", children, ...rest } = props;
  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-sm text-slate-200">{label}</span> : null}
      <select
        className={`h-11 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/60 ${className}`}
        {...rest}
      >
        {children}
      </select>
      {error ? (
        <span className="text-xs text-red-300">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

