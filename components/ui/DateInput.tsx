"use client";

import { useMemo, useState } from "react";
import { createTheme, ThemeProvider } from "@mui/material/styles";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import {
  DatePicker,
  type DatePickerProps,
} from "@mui/x-date-pickers/DatePicker";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import dayjs, { type Dayjs } from "dayjs";
import "dayjs/locale/es";
import styles from "./DateInput.module.css";

type DatePickerTextFieldSlotProps = NonNullable<
  DatePickerProps["slotProps"]
>["textField"];

function parseYmd(value: string): Dayjs | null {
  const v = value.trim();
  if (!/^\d{4}-\d{2}-\d{2}$/.test(v)) return null;
  const d = dayjs(v, "YYYY-MM-DD", true);
  return d.isValid() ? d : null;
}

function toYmd(value: Dayjs): string {
  return value.format("YYYY-MM-DD");
}

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
  const initialValue = useMemo(() => {
    const v = (defaultValue ?? "").trim();
    return v.length ? v : toYmd(dayjs());
  }, [defaultValue]);
  const initialDate = useMemo(
    () => (initialValue ? parseYmd(initialValue) : null),
    [initialValue],
  );
  const [selected, setSelected] = useState<Dayjs | null>(initialDate);
  const [value, setValue] = useState<string>(initialValue);

  const theme = useMemo(
    () =>
      createTheme({
        palette: {
          mode: "light",
          primary: { main: "#1d4ed8" },
          background: { default: "#b4cdff", paper: "#f0f6ff" },
          text: { primary: "#0f172a", secondary: "#475569" },
        },
        shape: { borderRadius: 14 },
        components: {
          MuiTextField: {
            defaultProps: { fullWidth: true, size: "small" },
          },
          MuiOutlinedInput: {
            styleOverrides: {
              root: {
                background: "color-mix(in srgb, #ffffff 72%, #8fb0f5)",
                borderRadius: 14,
              },
              notchedOutline: {
                borderColor: "color-mix(in srgb, #1e3a5f 18%, #b4cdff)",
              },
            },
          },
        },
      }),
    [],
  );

  const textFieldSlotProps = {
    label: undefined,
    error: Boolean(error),
    helperText: undefined,
    sx: {
      "& .MuiInputBase-root": {
        height: 44, // match h-11
        borderRadius: "0.75rem",
      },
      "& .MuiOutlinedInput-input": {
        padding: "0 0.75rem",
      },
      "& .MuiInputBase-input": { color: "#F1F5F9" },
    },
  } satisfies DatePickerTextFieldSlotProps;

  return (
    <div className={styles.dateInput}>
      <label className="text-sm text-slate-200">{label}</label>

      {/* Hidden input keeps FormData contract (YYYY-MM-DD) */}
      <input name={name} value={value} readOnly required={required} hidden />

      <ThemeProvider theme={theme}>
        <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
          <DatePicker
            value={selected}
            onChange={(next) => {
              setSelected(next);
              setValue(next ? toYmd(next) : "");
            }}
            format="DD/MM/YYYY"
            disableFuture={false}
            slotProps={{
              textField: textFieldSlotProps,
            }}
          />
        </LocalizationProvider>
      </ThemeProvider>
      {error ? <span className={styles.dateInput__error}>{error}</span> : null}
    </div>
  );
}
