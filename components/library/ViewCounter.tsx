"use client";

import { useEffect, useState, useTransition } from "react";
import { incrementViewsAction } from "@/actions/lessons";

export function ViewCounter({ lessonId, initialViews }: { lessonId: number; initialViews: number }) {
  const [views, setViews] = useState(initialViews);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    startTransition(async () => {
      const res = await incrementViewsAction(lessonId);
      if (res.ok) setViews(res.data.views);
    });
  }, [lessonId]);

  return (
    <div className="text-xs text-slate-400">
      {pending ? "Actualizando..." : `${views} vistas`}
    </div>
  );
}

