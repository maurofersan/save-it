"use client";

import * as React from "react";

type Variant = "primary" | "secondary" | "ghost" | "danger";
type Size = "sm" | "md";

export function Button(props: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  const { className = "", variant = "primary", size = "md", ...rest } = props;
  const base =
    "c-button inline-flex items-center justify-center gap-2 rounded-xl font-medium outline-none focus-visible:ring-2 focus-visible:ring-blue-500/70 disabled:opacity-60 disabled:cursor-not-allowed";
  const sizes = size === "sm" ? "h-9 px-3 text-sm" : "h-11 px-4 text-sm";
  const variants =
    variant === "primary"
      ? "bg-blue-600 text-white hover:bg-blue-700 shadow-sm shadow-blue-600/20"
      : variant === "secondary"
        ? "bg-white/5 text-slate-100 hover:bg-white/10 border border-white/10"
        : variant === "danger"
          ? "bg-red-500 text-white hover:bg-red-600 shadow-sm shadow-red-500/20"
          : "bg-transparent text-slate-100 hover:bg-white/5";
  return <button className={`${base} ${sizes} ${variants} ${className}`} {...rest} />;
}

