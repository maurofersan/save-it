"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { Modal } from "@/components/ui/Modal";
import { StatusBadge } from "@/components/ui/Badge";
import { RatingStars } from "@/components/library/RatingStars";
import { ViewCounter } from "@/components/library/ViewCounter";
import { listLessonEvidenceAction } from "@/actions/lessons";
import type { LessonWithSpecialty } from "@/types/models";
import type { Evidence } from "@/types/models";

export function LibraryTable({ lessons }: { lessons: LessonWithSpecialty[] }) {
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
      <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-300">
        No se encontraron lecciones validadas con esos filtros.
      </div>
    );
  }

  return (
    <>
      <div className="overflow-x-auto rounded-2xl border border-white/10 bg-white/5">
        <table className="w-full min-w-[980px] text-left text-sm">
          <thead className="text-xs text-slate-400">
            <tr>
              <th className="py-3 pl-4 pr-3">Nombre de la lección</th>
              <th className="py-3 pr-3">Correo</th>
              <th className="py-3 pr-3">Puntuación</th>
              <th className="py-3 pr-3">Tipo de proyecto</th>
              <th className="py-3 pr-4 text-right">Vistas</th>
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
                <td className="py-3 pl-4 pr-3 font-medium text-slate-100">
                  <div className="max-w-[420px] truncate">{l.title}</div>
                  <div className="mt-0.5 text-xs text-slate-400">
                    {l.specialtyName} · {l.area ?? "—"}
                  </div>
                </td>
                <td className="py-3 pr-3 text-slate-300">
                  <div className="max-w-[260px] truncate">{l.createdByEmail}</div>
                </td>
                <td className="py-3 pr-3 text-slate-300">
                  {(l.ratingAvg || 0).toFixed(1)} ({l.ratingCount})
                </td>
                <td className="py-3 pr-3 text-slate-300">
                  <div className="max-w-[220px] truncate">{l.projectType ?? "—"}</div>
                </td>
                <td className="py-3 pr-4 text-right text-slate-300">{l.viewsCount}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={Boolean(selected)}
        title={selected?.title ?? "Lección"}
        kind="Visualización"
        onClose={() => {
          setSelectedId(null);
          setEvidence(null);
        }}
        footer={
          selected ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex flex-wrap items-center gap-2 text-sm text-slate-300">
                <span>Estado:</span> <StatusBadge status={selected.status} />
                <span className="text-slate-500">·</span>
                <ViewCounter lessonId={selected.id} initialViews={selected.viewsCount} />
              </div>
              <RatingStars
                lessonId={selected.id}
                initialAvg={selected.ratingAvg}
                initialCount={selected.ratingCount}
              />
            </div>
          ) : null
        }
      >
        {selected ? (
          <div className="grid gap-4">
            <div className="text-xs text-slate-400">
              {selected.specialtyName} · {selected.createdByName} ({selected.createdByEmail})
            </div>

            <div className="grid gap-3 sm:grid-cols-2">
              <Info title="Tipo de proyecto">{selected.projectType ?? "—"}</Info>
              <Info title="Proyecto / obra">{selected.projectName ?? "—"}</Info>
              <Info title="Área">{selected.area ?? "—"}</Info>
              <Info title="Fecha de registro">
                {new Date(selected.createdAt).toLocaleString("es-PE")}
              </Info>
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

            <Info title="Impacto">
              {[
                selected.impactTimeHours > 0
                  ? `${selected.impactTimeHours.toLocaleString("es-PE", { maximumFractionDigits: 2 })} h`
                  : null,
                selected.impactCostPen > 0
                  ? `S/ ${selected.impactCostPen.toLocaleString("es-PE", { maximumFractionDigits: 2 })}`
                  : null,
              ]
                .filter(Boolean)
                .join(" · ") || "—"}
            </Info>

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

function Info({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-white/10 bg-white/5 p-3">
      <div className="text-xs text-slate-400">{title}</div>
      <div className="mt-1 text-sm text-slate-100">{children}</div>
    </div>
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

