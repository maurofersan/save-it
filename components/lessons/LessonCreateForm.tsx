"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createLessonAction } from "@/actions/lessons";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ActionResult } from "@/types/actions";
import type { Specialty } from "@/types/models";

type State = ActionResult<{ lessonId: number }> | null;

export function LessonCreateForm({ specialties }: { specialties: Specialty[] }) {
  const router = useRouter();
  const [state, action, pending] = useActionState<State, FormData>(
    createLessonAction,
    null,
  );

  useEffect(() => {
    if (state?.ok) {
      router.push("/dashboard");
      router.refresh();
    }
  }, [state, router]);

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-blue-200">Registrar</div>
        <div className="mt-1 text-xl font-semibold text-slate-50">
          Nueva lección aprendida
        </div>
        <div className="mt-1 text-sm text-slate-300">
          Completa los campos obligatorios y adjunta evidencia (imagen) si la tienes.
        </div>
      </CardHeader>
      <CardBody>
        <form action={action} className="grid gap-4">
          <Input
            name="title"
            label="Título"
            placeholder="Ej. Fisuras por deficiente curado"
            error={fieldErrors?.title}
            required
          />

          <div className="grid gap-4 sm:grid-cols-2">
            <Select
              name="specialtyKey"
              label="Especialidad"
              defaultValue={specialties[0]?.key ?? "QUALITY"}
              error={fieldErrors?.specialtyKey}
            >
              {specialties.map((s) => (
                <option key={s.id} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>

            <Select name="impactType" label="Impacto" defaultValue="TIME" error={fieldErrors?.impactType}>
              <option value="TIME">Tiempo</option>
              <option value="COST">Costo</option>
            </Select>
          </div>

          <Input
            name="impactValue"
            label="Valor del impacto"
            type="number"
            step="0.01"
            placeholder="0"
            error={fieldErrors?.impactValue}
            required
          />

          <Textarea
            name="description"
            label="¿Qué ocurrió?"
            placeholder="Describe el hecho o evento relevante."
            error={fieldErrors?.description}
            required
          />
          <Textarea
            name="rootCause"
            label="¿Por qué ocurrió? (Causa raíz)"
            placeholder="Identifica la causa raíz del evento."
            error={fieldErrors?.rootCause}
            required
          />
          <Textarea
            name="solution"
            label="¿Qué solución se aplicó?"
            placeholder="Acción correctiva o medida implementada."
            error={fieldErrors?.solution}
            required
          />

          <label className="flex flex-col gap-1.5">
            <span className="text-sm text-slate-200">Evidencia (imagen)</span>
            <input
              name="evidence"
              type="file"
              accept="image/*"
              className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-100 file:mr-3 file:rounded-lg file:border-0 file:bg-blue-600 file:px-3 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-blue-700"
            />
            <span className="text-xs text-slate-400">Máx. 5MB · PNG/JPG/WEBP</span>
          </label>

          {state && !state.ok ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {state.error.message}
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => router.push("/dashboard")}
            >
              Cancelar
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

