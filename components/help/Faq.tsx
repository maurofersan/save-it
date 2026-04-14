"use client";

import { useState } from "react";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";

const faqs = [
  {
    q: "¿Cómo registrar una lección?",
    a: "Ve a Registrar, completa los campos obligatorios (qué pasó, causa raíz, solución, impacto) y adjunta evidencia si corresponde. Guarda para notificar al Residente.",
  },
  {
    q: "¿Cómo saber si mi lección fue aprobada?",
    a: "En la biblioteca solo aparecen lecciones validadas. Si el Residente marca EN PROCESO puede dejar un comentario solicitando ajustes.",
  },
  {
    q: "¿Cómo buscar una lección en la biblioteca?",
    a: "Usa palabras clave y filtra por especialidad. La lista prioriza lecciones con mejor puntuación y más vistas.",
  },
];

export function Faq() {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-blue-200">Ayuda</div>
        <div className="mt-1 text-xl font-semibold text-slate-50">Preguntas frecuentes</div>
        <div className="mt-1 text-sm text-slate-300">
          Guía rápida para usar la plataforma.
        </div>
      </CardHeader>
      <CardBody className="grid gap-3">
        {faqs.map((f, idx) => {
          const isOpen = open === idx;
          return (
            <button
              key={f.q}
              type="button"
              onClick={() => setOpen(isOpen ? null : idx)}
              className="text-left rounded-2xl border border-white/10 bg-white/5 p-4 hover:bg-white/10 transition-colors"
            >
              <div className="flex items-center justify-between gap-3">
                <div className="text-sm font-semibold text-slate-100">{f.q}</div>
                <div className="text-slate-300">{isOpen ? "−" : "+"}</div>
              </div>
              {isOpen ? (
                <div className="mt-2 text-sm leading-6 text-slate-300">{f.a}</div>
              ) : null}
            </button>
          );
        })}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
          <div className="text-sm font-semibold text-slate-100">Contáctanos</div>
          <div className="mt-1 text-sm text-slate-300">
            Soporte interno: <span className="font-mono">soporte@saveit.local</span>
          </div>
        </div>
      </CardBody>
    </Card>
  );
}

