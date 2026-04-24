"use client";

import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { formInputClassName } from "@/components/ui/Input";

/**
 * Campos de impacto con los mismos estilos que `Input` y formato numérico (react-number-format).
 * Los `name` van en inputs hidden para que el server action reciba strings parseables.
 */
export function LessonImpactInputs() {
  const [time, setTime] = useState("");
  const [cost, setCost] = useState("");

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Impacto">
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-slate-200">Tiempo (horas)</span>
        <NumericFormat
          value={time}
          onValueChange={(v) => setTime(v.value)}
          allowNegative={false}
          decimalScale={4}
          allowLeadingZeros={false}
          valueIsNumericString
          thousandSeparator={false}
          isAllowed={(vals) => {
            const f = vals.floatValue;
            return f === undefined || (f >= 0 && f <= 1e9);
          }}
          className={formInputClassName}
          placeholder="0"
          inputMode="decimal"
          autoComplete="off"
          aria-label="Horas de impacto"
        />
        <input type="hidden" name="impactTimeHours" value={time} readOnly tabIndex={-1} />
      </label>
      <label className="flex flex-col gap-1.5">
        <span className="text-sm text-slate-200">Costo</span>
        <div className="relative">
          <span
            className="pointer-events-none absolute left-3 top-1/2 z-[1] -translate-y-1/2 select-none text-sm font-medium text-slate-400/90"
            aria-hidden
          >
            S/
          </span>
          <NumericFormat
            value={cost}
            onValueChange={(v) => setCost(v.value)}
            allowNegative={false}
            decimalScale={2}
            allowLeadingZeros={false}
            valueIsNumericString
            thousandSeparator={false}
            decimalSeparator="."
            isAllowed={(vals) => {
              const f = vals.floatValue;
              return f === undefined || (f >= 0 && f <= 1e15);
            }}
            className={`${formInputClassName} !pl-10 !pr-3`}
            placeholder="0.00"
            inputMode="decimal"
            autoComplete="off"
            aria-label="Monto en soles"
          />
        </div>
        <input type="hidden" name="impactCostPen" value={cost} readOnly tabIndex={-1} />
      </label>
    </div>
  );
}
