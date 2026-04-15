"use client";

export function DateInput({
  name,
  label,
  defaultValue,
  error,
  required,
}: {
  name: string;
  label: string;
  defaultValue?: string;
  error?: string;
  required?: boolean;
}) {
  return (
    <label className="flex flex-col gap-1.5">
      <span className="text-sm text-slate-200">{label}</span>
      <input
        name={name}
        type="date"
        defaultValue={defaultValue}
        required={required}
        className={[
          "h-11 rounded-xl border bg-white/5 px-3 text-sm text-slate-100 outline-none",
          "border-white/10 focus:ring-2 focus:ring-blue-500/60",
          "accent-blue-600",
          error ? "ring-2 ring-red-500/40" : "",
        ].join(" ")}
      />
      {error ? <span className="text-xs text-red-200">{error}</span> : null}
    </label>
  );
}

