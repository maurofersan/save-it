"use client";

import { useActionState } from "react";
import { setLessonStatusAction } from "@/actions/lessons";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { StatusBadge } from "@/components/ui/Badge";
import type { ActionResult } from "@/types/actions";
import type { LessonWithSpecialty } from "@/types/models";

type State = ActionResult<unknown> | null;

function ReviewActions({ lessonId }: { lessonId: string }) {
  const [state, action, pending] = useActionState<State, FormData>(
    setLessonStatusAction,
    null,
  );

  return (
    <form action={action} className="flex flex-col gap-2">
      <input type="hidden" name="lessonId" value={lessonId} />
      <input
        name="reviewerComment"
        placeholder="Comentario (opcional)"
        className="h-10 rounded-xl border border-white/10 bg-white/5 px-3 text-sm text-slate-100 placeholder:text-slate-400 outline-none focus:ring-2 focus:ring-blue-500/60"
      />
      {state && !state.ok ? (
        <div className="text-xs text-red-200">{state.error.message}</div>
      ) : null}
      <div className="flex flex-wrap gap-2">
        <Button
          type="submit"
          name="status"
          value="IN_PROGRESS"
          variant="secondary"
          size="sm"
          disabled={pending}
        >
          En proceso
        </Button>
        <Button
          type="submit"
          name="status"
          value="VALIDATED"
          size="sm"
          disabled={pending}
        >
          Validar
        </Button>
        <Button
          type="submit"
          name="status"
          value="DISCARDED"
          variant="danger"
          size="sm"
          disabled={pending}
        >
          Descartar
        </Button>
      </div>
    </form>
  );
}

export function ValidationQueue({ lessons }: { lessons: LessonWithSpecialty[] }) {
  if (lessons.length === 0) {
    return (
      <Card>
        <CardBody>
          <div className="text-sm text-slate-300">No hay lecciones en cola.</div>
        </CardBody>
      </Card>
    );
  }

  return (
    <div className="grid gap-4">
      {lessons.map((l) => (
        <Card key={l.id}>
          <CardBody className="grid gap-3 sm:grid-cols-[1fr_260px] sm:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <div className="text-base font-semibold text-slate-50">{l.title}</div>
                <StatusBadge status={l.status} />
              </div>
              <div className="mt-1 text-xs text-slate-400">
                {l.specialtyName} · {l.createdByName} ({l.createdByEmail})
              </div>
              <div className="mt-3 line-clamp-3 text-sm text-slate-300">
                {l.description}
              </div>
              {l.reviewerComment ? (
                <div className="mt-3 rounded-xl border border-white/10 bg-white/5 p-3 text-sm text-slate-200">
                  <div className="text-xs text-slate-400">Comentario anterior</div>
                  <div className="mt-1">{l.reviewerComment}</div>
                </div>
              ) : null}
            </div>
            <ReviewActions lessonId={l.id} />
          </CardBody>
        </Card>
      ))}
    </div>
  );
}

