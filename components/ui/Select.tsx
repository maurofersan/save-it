"use client";

import * as React from "react";

type SelectOption = { value: string; label: string; disabled?: boolean };

function extractOptionsFromChildren(node: React.ReactNode): SelectOption[] {
  const out: SelectOption[] = [];

  React.Children.forEach(node, (child) => {
    if (!React.isValidElement(child)) return;

    if (child.type === React.Fragment) {
      out.push(
        ...extractOptionsFromChildren(
          (child as React.ReactElement<{ children?: React.ReactNode }>).props
            .children,
        ),
      );
      return;
    }

    if (child.type === "option") {
      const optionEl = child as React.ReactElement<
        React.OptionHTMLAttributes<HTMLOptionElement>
      >;
      out.push({
        value: String(optionEl.props.value ?? ""),
        label: String(optionEl.props.children ?? ""),
        disabled: Boolean(optionEl.props.disabled),
      });
      return;
    }

    // Minimal support for <optgroup> by flattening children
    if (child.type === "optgroup") {
      const groupEl = child as React.ReactElement<
        React.OptgroupHTMLAttributes<HTMLOptGroupElement>
      >;
      out.push(...extractOptionsFromChildren(groupEl.props.children));
    }
  });

  return out;
}

function ChevronDownIcon(props: { className?: string }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 20 20"
      className={props.className}
      fill="currentColor"
    >
      <path d="M5.23 7.21a.75.75 0 0 1 1.06.02L10 10.94l3.71-3.71a.75.75 0 1 1 1.06 1.06l-4.24 4.24a.75.75 0 0 1-1.06 0L5.21 8.29a.75.75 0 0 1 .02-1.08Z" />
    </svg>
  );
}

export function Select(
  props: React.SelectHTMLAttributes<HTMLSelectElement> & {
    label?: string;
    hint?: string;
    error?: string;
  },
) {
  const {
    label,
    hint,
    error,
    className = "",
    children,
    value,
    defaultValue,
    onChange,
    disabled,
    name,
    required,
    ...rest
  } = props;

  const options = React.useMemo(
    () => extractOptionsFromChildren(children),
    [children],
  );

  const isControlled = value !== undefined;
  const [uncontrolledValue, setUncontrolledValue] = React.useState<string>(
    () => String(defaultValue ?? options[0]?.value ?? ""),
  );
  const selectedValue = String(
    isControlled ? (value ?? "") : uncontrolledValue,
  );

  React.useEffect(() => {
    // If options load async and we have no value, pick first.
    if (!isControlled && !uncontrolledValue && options[0]?.value) {
      setUncontrolledValue(String(options[0].value));
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [options.length]);

  const selectedOption =
    options.find((o) => o.value === selectedValue) ?? options[0];

  const [open, setOpen] = React.useState(false);
  const rootRef = React.useRef<HTMLDivElement | null>(null);

  React.useEffect(() => {
    if (!open) return;
    const handler = (event: MouseEvent | TouchEvent) => {
      const el = rootRef.current;
      if (!el) return;
      if (!el.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler, true);
    document.addEventListener("touchstart", handler, true);
    return () => {
      document.removeEventListener("mousedown", handler, true);
      document.removeEventListener("touchstart", handler, true);
    };
  }, [open]);

  const commitValue = (nextValue: string) => {
    if (!isControlled) setUncontrolledValue(nextValue);

    if (onChange) {
      // Dispatch a select-like event shape (enough for typical usage)
      const syntheticEvent = {
        target: { value: nextValue, name },
        currentTarget: { value: nextValue, name },
      } as unknown as React.ChangeEvent<HTMLSelectElement>;
      onChange(syntheticEvent);
    }
  };

  const baseButton =
    "h-11 w-full rounded-xl border border-white/10 bg-white/5 px-3 pr-10 text-left text-sm text-slate-100 outline-none focus:ring-2 focus:ring-blue-500/60 disabled:cursor-not-allowed disabled:opacity-60";

  const panel =
    "absolute left-0 right-0 top-full z-50 mt-1 max-h-64 overflow-auto rounded-xl border border-white/10 bg-slate-950/95 p-1 shadow-lg backdrop-blur";

  const optionItem =
    "flex w-full cursor-pointer select-none items-center justify-between rounded-lg px-3 py-2 text-sm text-slate-100 hover:bg-white/10 focus:bg-white/10 focus:outline-none";

  return (
    <label className="flex flex-col gap-1.5">
      {label ? <span className="text-sm text-slate-200">{label}</span> : null}
      <div ref={rootRef} className="relative">
        {/* Keep native <select> for form submit + validity, but hide it. */}
        <select
          className="sr-only"
          name={name}
          required={required}
          disabled={disabled}
          value={selectedValue}
          onChange={(e) => commitValue(String(e.target.value))}
          {...rest}
        >
          {children}
        </select>

        <button
          type="button"
          disabled={disabled}
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={`${baseButton} ${className}`}
        >
          <span className="block truncate">
            {selectedOption?.label ?? "Selecciona..."}
          </span>
          <ChevronDownIcon className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-300" />
        </button>

        {open ? (
          <div role="listbox" className={panel}>
            {options.map((opt) => {
              const active = opt.value === selectedValue;
              return (
                <button
                  key={opt.value}
                  type="button"
                  disabled={opt.disabled}
                  className={`${optionItem} ${
                    active ? "bg-white/10" : ""
                  } disabled:cursor-not-allowed disabled:opacity-50`}
                  onClick={() => {
                    commitValue(opt.value);
                    setOpen(false);
                  }}
                >
                  <span className="min-w-0 flex-1 truncate text-left">
                    {opt.label}
                  </span>
                  {active ? (
                    <span className="ml-2 text-xs text-blue-200">✓</span>
                  ) : null}
                </button>
              );
            })}
          </div>
        ) : null}
      </div>
      {error ? (
        <span className="text-xs text-red-300">{error}</span>
      ) : hint ? (
        <span className="text-xs text-slate-400">{hint}</span>
      ) : null}
    </label>
  );
}

