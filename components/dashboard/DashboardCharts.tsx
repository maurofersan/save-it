"use client";

import type { LessonStatus, SpecialtyKey } from "@/types/domain";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

const BAR_COLOR = "#2563eb";
const PIE_COLORS = ["#2563eb", "#7c3aed", "#0d9488", "#ea580c"];

const STATUS_LABEL: Record<LessonStatus, string> = {
  RECEIVED: "Recibido",
  IN_PROGRESS: "En proceso",
  VALIDATED: "Validadas",
  DISCARDED: "Descartadas",
};

export function DashboardCharts({
  specialtyBars,
  statusCounts,
}: {
  specialtyBars: Array<{
    specialtyKey: SpecialtyKey;
    label: string;
    count: number;
  }>;
  statusCounts: Record<LessonStatus, number>;
}) {
  const barData = specialtyBars.map((s) => ({
    nombre: s.label,
    cantidad: s.count,
  }));

  const pieData = (Object.entries(statusCounts) as [LessonStatus, number][])
    .map(([status, value]) => ({
      name: STATUS_LABEL[status],
      value,
    }))
    .filter((d) => d.value > 0);

  return (
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="c-card rounded-2xl border border-white/10 p-4 sm:p-5">
        <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
          Lecciones aprendidas registradas por área
        </h2>
        <div className="mt-4 h-[280px] w-full min-w-0">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={barData}
              margin={{ top: 8, right: 8, left: 0, bottom: 40 }}
            >
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="rgba(15,23,42,0.08)"
                vertical={false}
              />
              <XAxis
                dataKey="nombre"
                tick={{ fill: "#475569", fontSize: 11 }}
                interval={0}
                angle={-18}
                textAnchor="end"
                height={48}
              />
              <YAxis
                allowDecimals={false}
                tick={{ fill: "#64748b", fontSize: 11 }}
                width={36}
              />
              <Tooltip
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid rgba(15,23,42,0.1)",
                  background: "rgba(255,255,255,0.96)",
                }}
                labelStyle={{ color: "#0f172a" }}
              />
              <Bar dataKey="cantidad" radius={[6, 6, 0, 0]} name="Lecciones">
                {barData.map((_, i) => (
                  <Cell
                    key={i}
                    fill={BAR_COLOR}
                    fillOpacity={0.85 - (i % 3) * 0.08}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="c-card rounded-2xl border border-white/10 p-4 sm:p-5">
        <h2 className="text-center text-xs font-semibold uppercase tracking-wide text-slate-500 sm:text-sm">
          Estado de lecciones aprendidas registradas
        </h2>
        <div className="mt-4 h-[280px] w-full min-w-0">
          {pieData.length === 0 ? (
            <div className="flex h-full items-center justify-center text-sm text-slate-400">
              Aún no hay lecciones para mostrar el reparto por estado.
            </div>
          ) : (
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={88}
                  paddingAngle={pieData.length > 1 ? 2 : 0}
                  label={({ name, percent }) =>
                    `${name ?? ""} ${((percent ?? 0) * 100).toFixed(0)}%`
                  }
                >
                  {pieData.map((_, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid rgba(15,23,42,0.1)",
                    background: "rgba(255,255,255,0.96)",
                  }}
                />
                <Legend wrapperStyle={{ fontSize: 12 }} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>
    </div>
  );
}
