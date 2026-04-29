"use client";

import { useActionState, useEffect, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { updateLessonAction } from "@/actions/lessons";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DateInput } from "@/components/ui/DateInput";
import { Input } from "@/components/ui/Input";
import { LessonImpactInputs } from "@/components/lessons/LessonImpactInputs";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ActionResult } from "@/types/actions";
import type { Lesson, Specialty } from "@/types/models";
import type { ProjectStageKey } from "@/types/domain";
import styles from "./LessonCreateForm.module.css";

type State = ActionResult<{ lessonId: string }> | null;

const PROJECT_STAGES: { value: ProjectStageKey; label: string }[] = [
  { value: "LICITACION", label: "Licitación" },
  { value: "INICIO", label: "Inicio" },
  { value: "EJECUCION", label: "Ejecución" },
  { value: "FINALIZACION", label: "Finalización" },
];

export function LessonEditForm({
  lesson,
  specialties,
}: {
  lesson: Lesson;
  specialties: Specialty[];
}) {
  const router = useRouter();
  const didNavigate = useRef(false);
  const [state, action, pending] = useActionState<State, FormData>(
    updateLessonAction,
    null,
  );

  useEffect(() => {
    if (!state?.ok || didNavigate.current) return;
    didNavigate.current = true;
    router.push("/dashboard");
    router.refresh();
  }, [state, router]);

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  const selectedKey = useMemo(() => {
    const m = specialties.find((s) => s.id === lesson.specialtyId);
    return m?.key ?? specialties[0]?.key ?? "";
  }, [lesson.specialtyId, specialties]);

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-blue-200">Actualizar</div>
        <div className="mt-1 text-xl font-semibold text-slate-50">
          Lección en proceso
        </div>
        <div className="mt-1 text-sm text-slate-300">
          Edita la información solicitada por el residente y vuelve a enviar a
          validación.
        </div>
        {lesson.reviewerComment ? (
          <div className="mt-3 rounded-xl border border-amber-500/20 bg-amber-500/10 p-3 text-sm text-slate-100">
            <div className="font-semibold">Comentario del revisor</div>
            <div className="mt-1 whitespace-pre-wrap text-slate-100/90">
              {lesson.reviewerComment}
            </div>
          </div>
        ) : null}
      </CardHeader>
      <CardBody>
        <form action={action} className="grid gap-5">
          <input type="hidden" name="lessonId" value={lesson.id} />

          <div className={styles.formGrid4}>
            <Input
              name="projectName"
              label="Proyecto"
              placeholder="Nombre del proyecto u obra"
              error={fieldErrors?.projectName}
              defaultValue={lesson.projectName ?? ""}
              required
            />
            <Input
              name="projectType"
              label="Tipo de proyecto"
              placeholder="Ej. Infraestructura, edificación"
              error={fieldErrors?.projectType}
              defaultValue={lesson.projectType ?? ""}
              required
            />
            <Select
              name="specialtyKey"
              label="Área"
              defaultValue={selectedKey}
              error={fieldErrors?.specialtyKey}
            >
              {specialties.map((s) => (
                <option key={s.id} value={s.key}>
                  {s.name}
                </option>
              ))}
            </Select>
            <Input
              name="area"
              label="Especialidad"
              placeholder="Ingresa la especialidad (ej. Obra, planta, taller)"
              error={fieldErrors?.area}
              defaultValue={lesson.area ?? ""}
              required
            />
          </div>

          <div className={styles.formGrid3}>
            <Input
              name="title"
              label="Nombre de la lección"
              placeholder="Título breve de la lección"
              error={fieldErrors?.title}
              defaultValue={lesson.title ?? ""}
              required
            />
            <Input
              name="cargo"
              label="Cargo"
              placeholder="Tu cargo o rol"
              error={fieldErrors?.cargo}
              defaultValue={lesson.cargo ?? ""}
              required
            />
            <DateInput
              name="eventDate"
              label="Fecha de suceso"
              error={fieldErrors?.eventDate}
              defaultValue={lesson.eventDate ?? ""}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-sm font-medium text-slate-100">
              Etapa del proyecto
            </span>
            <div
              className={styles.formStages}
              role="group"
              aria-label="Etapa del proyecto"
            >
              {PROJECT_STAGES.map((s) => (
                <label key={s.value} className={styles.checkboxLabel}>
                  <input
                    type="checkbox"
                    name="projectStages"
                    value={s.value}
                    defaultChecked={(lesson.projectStages ?? []).includes(
                      s.value,
                    )}
                  />
                  <span className="text-sm text-slate-200">{s.label}</span>
                </label>
              ))}
            </div>
            {fieldErrors?.projectStages ? (
              <p className="mt-1 text-xs text-red-300">
                {fieldErrors.projectStages}
              </p>
            ) : null}
          </div>

          <div className={styles.formGrid3}>
            <Textarea
              name="description"
              label="¿Qué sucedió?"
              placeholder="Describe el hecho o evento relevante."
              error={fieldErrors?.description}
              defaultValue={lesson.description ?? ""}
              required
            />
            <Textarea
              name="rootCause"
              label="¿Cuáles fueron las causas?"
              placeholder="Identifica las causas."
              error={fieldErrors?.rootCause}
              defaultValue={lesson.rootCause ?? ""}
              required
            />
            <Textarea
              name="actionsTaken"
              label="¿Qué acciones se tomaron?"
              placeholder="Acciones correctivas o contención."
              error={fieldErrors?.actionsTaken}
              defaultValue={lesson.actionsTaken ?? ""}
              required
            />
          </div>

          <div className={styles.formSplit}>
            <div className="grid gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-100">
                  ¿Cuál fue el impacto?
                </span>
                <LessonImpactInputs
                  initialTime={lesson.impactTime}
                  initialCostPen={lesson.impactCostPen}
                />
                {fieldErrors?.impactTime ? (
                  <p className="mt-1 text-xs text-red-300">
                    {fieldErrors.impactTime}
                  </p>
                ) : null}
              </div>
              <Textarea
                name="actionPlan"
                label="Plan de acción"
                placeholder="Medidas a seguir para evitar recurrencia."
                error={fieldErrors?.actionPlan}
                defaultValue={lesson.actionPlan ?? ""}
              />
            </div>
            <Textarea
              name="lessonLearned"
              label="¿Cuál es la lección aprendida?"
              placeholder="Síntesis de la lección para el equipo."
              error={fieldErrors?.lessonLearned}
              defaultValue={lesson.lessonLearned ?? ""}
              required
              className="min-h-[220px]"
            />
          </div>

          {state && !state.ok ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {state.error.message}
            </div>
          ) : null}

          <div className="flex flex-wrap items-center justify-end gap-2">
            <Button
              type="button"
              variant="secondary"
              disabled={pending}
              onClick={() => router.push("/dashboard")}
            >
              Cancelar
            </Button>
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando…" : "Guardar y reenviar"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
