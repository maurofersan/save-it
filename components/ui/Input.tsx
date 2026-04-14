"use client";

import * as React from "react";

function EyeIcon({ open }: { open: boolean }) {
  if (open) {
    return (
      <svg
        aria-hidden="true"
        viewBox="0 0 24 24"
        className="h-5 w-5"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <path d="M3 3l18 18" />
        <path d="M10.58 10.58A2 2 0 0 0 12 15a2 2 0 0 0 1.42-3.42" />
        <path d="M9.88 5.09A10.94 10.94 0 0 1 12 5c6 0 10 7 10 7a18.27 18.27 0 0 1-2.16 3.12" />
        <path d="M6.61 6.61A13.89 13.89 0 0 0 2 12s4 7 10 7a9.74 9.74 0 0 0 4.39-1" />
      </svg>
    );
  }
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7-10-7-10-7Z" />
      <circle cx="12" cy="12" r="3" />
    </svg>
  );
}

export function Input(
  props: React.InputHTMLAttributes<HTMLInputElement> & {
    label?: string;
    hint?: string;
    error?: string;
    /** Muestra botón para ver/ocultar cuando `type="password"`. */
    showPasswordToggle?: boolean;
  },
) {
  const {
    label,
    hint,
    error,
    className = "",
    showPasswordToggle,
    type,
    ...rest
  } = props;
  const [passwordVisible, setPasswordVisible] = React.useState(false);
  const isPasswordField = type === "password";
  const useToggle = Boolean(showPasswordToggle && isPasswordField);
  const inputType =
    useToggle && passwordVisible ? "text" : type;

  const inputClass = `h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/60 ${useToggle ? "pr-11" : ""} ${className}`;

  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-sm text-slate-200">{label}</span> : null}
      {useToggle ? (
        <div className="relative">
          <input
            className={inputClass}
            type={inputType}
            {...rest}
          />
          <button
            type="button"
            className="absolute right-1.5 top-1/2 -translate-y-1/2 rounded-lg p-1.5 text-slate-400 outline-none transition hover:bg-white/10 hover:text-slate-200 focus-visible:ring-2 focus-visible:ring-blue-500/60"
            aria-label={passwordVisible ? "Ocultar contraseña" : "Mostrar contraseña"}
            aria-pressed={passwordVisible}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => setPasswordVisible((v) => !v)}
          >
            <EyeIcon open={passwordVisible} />
          </button>
        </div>
      ) : (
        <input
          className={inputClass}
          type={type}
          {...rest}
        />
      )}
      {error ? (
        <span className="text-xs text-red-300">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

