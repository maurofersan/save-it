"use client";

import { useActionState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { createLessonAction } from "@/actions/lessons";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { DateInput } from "@/components/ui/DateInput";
import { ImagePicker } from "@/components/ui/ImagePicker";
import { Input } from "@/components/ui/Input";
import { LessonImpactInputs } from "@/components/lessons/LessonImpactInputs";
import { Select } from "@/components/ui/Select";
import { Textarea } from "@/components/ui/Textarea";
import type { ActionResult } from "@/types/actions";
import type { Specialty } from "@/types/models";
import styles from "./LessonCreateForm.module.css";

type State = ActionResult<{ lessonId: string }> | null;

const PROJECT_STAGES: { value: string; label: string }[] = [
  { value: "LICITACION", label: "Licitación" },
  { value: "INICIO", label: "Inicio" },
  { value: "EJECUCION", label: "Ejecución" },
  { value: "FINALIZACION", label: "Finalización" },
];

export function LessonCreateForm({
  specialties,
  organizationLogoUrl,
  organizationName,
  canCreateLesson,
}: {
  specialties: Specialty[];
  organizationLogoUrl: string | null;
  organizationName: string;
  canCreateLesson: boolean;
}) {
  const router = useRouter();
  const didNavigate = useRef(false);
  const [state, action, pending] = useActionState<State, FormData>(
    createLessonAction,
    null,
  );

  useEffect(() => {
    if (!state?.ok || didNavigate.current) return;
    didNavigate.current = true;
    router.push("/dashboard");
  }, [state, router]);

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  if (!canCreateLesson) {
    return (
      <Card>
        <CardHeader>
          <div className="text-sm font-semibold text-blue-200">Registrar</div>
          <div className="mt-1 text-xl font-semibold text-slate-50">
            Formato de lecciones aprendidas
          </div>
          <div className="mt-1 text-sm text-slate-300">
            Esta sección está disponible en el menú, pero solo los ingenieros
            pueden enviar nuevas lecciones.
          </div>
        </CardHeader>
        <CardBody className="flex flex-col gap-4">
          <p className="text-sm leading-6 text-slate-300">
            Tu usuario tiene rol de residente. Puedes revisar y validar
            lecciones en <span className="text-slate-100">Validar</span> cuando
            corresponda.
          </p>
          <div className="flex flex-wrap gap-2">
            <Button type="button" onClick={() => router.push("/dashboard")}>
              Volver al inicio
            </Button>
            <Button
              type="button"
              variant="secondary"
              onClick={() => router.push("/validate")}
            >
              Ir a validar
            </Button>
          </div>
        </CardBody>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-blue-200">Registrar</div>
        <div className="mt-1 text-xl font-semibold text-slate-50">
          Formato de lecciones aprendidas
        </div>
        <div className="mt-1 text-sm text-slate-300">
          Completa los campos y adjunta evidencia (imagen o documento) si
          aplica.
        </div>
      </CardHeader>
      <CardBody>
        <form action={action} className="grid gap-5">
          <div className={styles.orgLogoRow}>
            {organizationLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={organizationLogoUrl}
                alt={`Logo de ${organizationName}`}
                className={styles.orgLogo}
              />
            ) : (
              <div className={styles.orgLogoPlaceholder}>
                <span className={styles.orgLogoPlaceholderTitle}>
                  Logo empresa
                </span>
                <span className={styles.orgLogoPlaceholderHint}>
                  Configura el logo en ajustes de la organización para mostrarlo
                  aquí.
                </span>
              </div>
            )}
          </div>

          <div className={styles.formGrid4}>
            <Input
              name="projectName"
              label="Proyecto"
              placeholder="Nombre del proyecto u obra"
              error={fieldErrors?.projectName}
              required
            />
            <Input
              name="projectType"
              label="Tipo de proyecto"
              placeholder="Ej. Infraestructura, edificación"
              error={fieldErrors?.projectType}
              required
            />
            <Select
              name="specialtyKey"
              label="Área"
              defaultValue={specialties[0]?.key ?? "QUALITY"}
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
              required
            />
          </div>

          <div className={styles.formGrid3}>
            <Input
              name="title"
              label="Nombre de la lección"
              placeholder="Título breve de la lección"
              error={fieldErrors?.title}
              required
            />
            <Input
              name="cargo"
              label="Cargo"
              placeholder="Tu cargo o rol"
              error={fieldErrors?.cargo}
              required
            />
            <DateInput
              name="eventDate"
              label="Fecha de suceso"
              error={fieldErrors?.eventDate}
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
                  <input type="checkbox" name="projectStages" value={s.value} />
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
              required
            />
            <Textarea
              name="rootCause"
              label="¿Cuáles fueron las causas?"
              placeholder="Identifica las causas."
              error={fieldErrors?.rootCause}
              required
            />
            <Textarea
              name="actionsTaken"
              label="¿Qué acciones se tomaron?"
              placeholder="Acciones correctivas o contención."
              error={fieldErrors?.actionsTaken}
              required
            />
          </div>

          <div className={styles.formSplit}>
            <div className="grid gap-4">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-slate-100">
                  ¿Cuál fue el impacto?
                </span>
                <LessonImpactInputs />
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
              />
            </div>
            <Textarea
              name="lessonLearned"
              label="¿Cuál es la lección aprendida?"
              placeholder="Síntesis de la lección para el equipo."
              error={fieldErrors?.lessonLearned}
              required
              className="min-h-[220px]"
            />
          </div>

          <ImagePicker
            name="evidence"
            label="Adjuntar archivo (evidencia)"
            mode="attachment"
          />

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
              {pending ? "Subiendo…" : "Subir"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}
