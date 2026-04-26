"use client";

import { useState } from "react";
import { NumericFormat } from "react-number-format";
import { Input, formInputClassName } from "@/components/ui/Input";

export function LessonImpactInputs() {
  const [cost, setCost] = useState("");

  return (
    <div className="grid gap-3 sm:grid-cols-2" role="group" aria-label="Impacto">
      <Input
        name="impactTime"
        label="Tiempo"
        placeholder=""
        autoComplete="off"
      />
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
