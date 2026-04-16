"use client";

import { useState, useTransition } from "react";
import { rateLesson } from "@/actions/lessons";

export function RatingStars({
  lessonId,
  initialAvg,
  initialCount,
}: {
  lessonId: string;
  initialAvg: number;
  initialCount: number;
}) {
  const [avg, setAvg] = useState(initialAvg);
  const [count, setCount] = useState(initialCount);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex items-center gap-2">
      <div className="flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => {
          const n = i + 1;
          const filled = n <= Math.round(avg || 0);
          return (
            <button
              key={n}
              type="button"
              disabled={pending}
              onClick={() => {
                startTransition(async () => {
                  const fd = new FormData();
                  fd.set("lessonId", String(lessonId));
                  fd.set("rating", String(n));
                  const res = await rateLesson(fd);
                  if (res.ok) {
                    setAvg(res.data.ratingAvg);
                    setCount(res.data.ratingCount);
                  }
                });
              }}
              className={`h-6 w-6 rounded-md border border-white/10 ${
                filled ? "bg-amber-400/20 text-amber-200" : "bg-white/5 text-slate-300"
              } hover:bg-white/10`}
              aria-label={`Calificar ${n} estrellas`}
            >
              ★
            </button>
          );
        })}
      </div>
      <div className="text-xs text-slate-400">
        {(avg || 0).toFixed(1)} ({count})
      </div>
    </div>
  );
}

