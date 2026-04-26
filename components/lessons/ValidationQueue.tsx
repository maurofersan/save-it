"use client";

import { useActionState, useEffect, useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { listLessonEvidenceAction } from "@/actions/lessons";
import { setLessonStatusAction } from "@/actions/lessons";
import { Button } from "@/components/ui/Button";
import { Card, CardBody } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import type { ActionResult } from "@/types/actions";
import type { LessonWithSpecialty } from "@/types/models";
import type { Evidence } from "@/types/models";

type State = ActionResult<unknown> | null;

function ReviewActions({
  lessonId,
  onDone,
}: {
  lessonId: string;
  onDone?: () => void;
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    setLessonStatusAction,
    null,
  );
  const router = useRouter();

  useEffect(() => {
    if (!state?.ok) return;
    router.refresh();
    onDone?.();
  }, [state, router, onDone]);

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
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [evidence, setEvidence] = useState<Evidence[] | null>(null);
  const [evidencePending, startEvidence] = useTransition();
  const selected = useMemo(
    () => lessons.find((x) => x.id === selectedId) ?? null,
    [lessons, selectedId],
  );

  useEffect(() => {
    if (!selectedId) return;
    let cancelled = false;
    startEvidence(async () => {
      const res = await listLessonEvidenceAction(selectedId);
      if (cancelled) return;
      setEvidence(res.ok ? res.data : []);
    });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

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
    <>
      <Card>
        <CardBody>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[860px] text-left text-sm">
              <thead className="text-xs text-slate-400">
                <tr>
                  <th className="py-2 pr-3">Nombre de la lección</th>
                  <th className="py-2 pr-3">Área</th>
                  <th className="py-2 pr-3">Fecha de registro</th>
                  <th className="py-2 pr-3">Email</th>
                  <th className="py-2">Estado</th>
                </tr>
              </thead>
              <tbody>
                {lessons.map((l) => (
                  <tr
                    key={l.id}
                    className="cursor-pointer border-t border-white/10 transition hover:bg-white/5"
                    role="button"
                    tabIndex={0}
                    onClick={() => {
                      setEvidence(null);
                      setSelectedId(l.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        setEvidence(null);
                        setSelectedId(l.id);
                      }
                    }}
                    aria-label={`Abrir lección ${l.title}`}
                  >
                    <td className="py-3 pr-3 font-medium text-slate-100">
                      <div className="max-w-[420px] truncate">{l.title}</div>
                    </td>
                    <td className="py-3 pr-3 text-slate-300">
                      {l.area ?? "—"}
                    </td>
                    <td className="py-3 pr-3 text-slate-300">
                      {new Date(l.createdAt).toLocaleDateString("es-PE")}
                    </td>
                    <td className="py-3 pr-3 text-slate-300">
                      <div className="max-w-[280px] truncate">{l.createdByEmail}</div>
                    </td>
                    <td className="py-3">
                      <StatusBadge status={l.status} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 text-xs text-slate-400">
            Tip: haz click en una fila para ver el detalle y validar.
          </div>
        </CardBody>
      </Card>

      <Modal
        open={Boolean(selected)}
        title={selected?.title ?? "Lección"}
        onClose={() => {
          setSelectedId(null);
          setEvidence(null);
        }}
        kind="Validación"
        footer={
          selected ? (
            <div className="grid gap-3 sm:grid-cols-[1fr_320px] sm:items-start">
              <div className="text-sm text-slate-300">
                Estado actual:{" "}
                <span className="ml-2 inline-flex align-middle">
                  <StatusBadge status={selected.status} />
                </span>
              </div>
              <ReviewActions
                lessonId={selected.id}
                onDone={() => {
                  setSelectedId(null);
                  setEvidence(null);
                }}
              />
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="grid gap-4">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-xs text-slate-400">
                {selected.specialtyName} · {selected.createdByName} ({selected.createdByEmail})
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Área</div>
                <div className="mt-1 text-sm text-slate-100">{selected.area ?? "—"}</div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Fecha de registro</div>
                <div className="mt-1 text-sm text-slate-100">
                  {new Date(selected.createdAt).toLocaleString("es-PE")}
                </div>
              </div>
            </div>

            <Section title="¿Qué sucedió?">{selected.description}</Section>
            <Section title="¿Cuáles fueron las causas?">{selected.rootCause}</Section>
            {selected.actionsTaken ? (
              <Section title="¿Qué acciones se tomaron?">{selected.actionsTaken}</Section>
            ) : null}
            {selected.lessonLearned ? (
              <Section title="¿Cuál es la lección aprendida?">{selected.lessonLearned}</Section>
            ) : null}
            {selected.actionPlan ? (
              <Section title="Plan de acción">{selected.actionPlan}</Section>
            ) : null}

            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Impacto</div>
                <div className="mt-1 text-sm text-slate-100">
                  {[
                    selected.impactTime ? selected.impactTime : null,
                    selected.impactCostPen > 0
                      ? `S/ ${selected.impactCostPen.toLocaleString("es-PE", { maximumFractionDigits: 2 })}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ") || "—"}
                </div>
              </div>
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Proyecto</div>
                <div className="mt-1 text-sm text-slate-100">
                  {selected.projectName ?? "—"}
                </div>
              </div>
            </div>

            {selected.reviewerComment ? (
              <div className="rounded-xl border border-white/10 bg-white/5 p-3">
                <div className="text-xs text-slate-400">Comentario anterior</div>
                <div className="mt-1 text-sm text-slate-100">{selected.reviewerComment}</div>
              </div>
            ) : null}

            <div className="rounded-xl border border-white/10 bg-white/5 p-3">
              <div className="text-xs text-slate-400">Evidencias</div>
              <div className="mt-2">
                {evidencePending ? (
                  <div className="text-sm text-slate-300">Cargando evidencias…</div>
                ) : !evidence || evidence.length === 0 ? (
                  <div className="text-sm text-slate-300">Sin evidencias.</div>
                ) : (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {evidence.map((e) =>
                      e.type === "DOCUMENT" ? (
                        <a
                          key={e.id}
                          href={e.url}
                          className="flex flex-col gap-2 rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-blue-200 transition hover:bg-white/10"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <span className="text-2xl" aria-hidden>
                            📎
                          </span>
                          <span className="font-medium">Ver o descargar documento</span>
                          <span className="break-all text-xs text-slate-400">{e.url}</span>
                        </a>
                      ) : (
                        <a
                          key={e.id}
                          href={e.url}
                          className="group overflow-hidden rounded-2xl border border-white/10 bg-white/5"
                          target="_blank"
                          rel="noreferrer"
                        >
                          <div className="relative aspect-video w-full">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={e.url}
                              alt="Evidencia"
                              className="h-full w-full object-cover transition-transform duration-200 group-hover:scale-[1.02]"
                            />
                          </div>
                        </a>
                      ),
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        ) : null}
      </Modal>
    </>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 whitespace-pre-wrap text-sm text-slate-100">{children}</div>
    </div>
  );
}

