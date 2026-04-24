"use client";

import Ably from "ably";
import type { TokenRequest } from "ably";
import dayjs from "dayjs";
import "dayjs/locale/es";
import relativeTime from "dayjs/plugin/relativeTime";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { FiBook, FiEdit2 } from "react-icons/fi";
import { organizationChannelName } from "@/lib/ably/channelName";
import { isValidObjectIdString } from "@/lib/objectIdString";
import { resolveLessonNotificationHref } from "@/lib/notificationLinks";
import type { UserRole } from "@/types/domain";
import type {
  AblyNotificationPayloadV1,
  NotificationListItem,
} from "@/types/notifications";

dayjs.extend(relativeTime);
dayjs.locale("es");

const STATUSES = new Set<string>([
  "RECEIVED",
  "IN_PROGRESS",
  "VALIDATED",
  "DISCARDED",
]);

function isAblyPayloadV1(m: unknown): m is AblyNotificationPayloadV1 {
  if (!m || typeof m !== "object") return false;
  const o = m as Record<string, unknown>;
  const lessonStatus = o.lessonStatus;
  if (typeof lessonStatus !== "string" || !STATUSES.has(lessonStatus))
    return false;
  return (
    o.v === 1 &&
    typeof o.id === "string" &&
    isValidObjectIdString(o.id) &&
    typeof o.organizationId === "string" &&
    (o.kind === "LESSON_CREATED" || o.kind === "LESSON_UPDATED") &&
    typeof o.lessonId === "string" &&
    isValidObjectIdString(o.lessonId) &&
    typeof o.title === "string" &&
    typeof o.createdAt === "string" &&
    typeof o.actorUserId === "string" &&
    isValidObjectIdString(o.actorUserId) &&
    (o.summary === null || typeof o.summary === "string")
  );
}

function fromAblyPayload(
  p: AblyNotificationPayloadV1,
  role: UserRole,
  currentUserId: string,
): NotificationListItem {
  return {
    id: p.id,
    kind: p.kind,
    lessonId: p.lessonId,
    title: p.title,
    summary: p.summary,
    lessonStatus: p.lessonStatus,
    createdAt: p.createdAt,
    read: p.actorUserId === currentUserId,
    href: resolveLessonNotificationHref(p.lessonId, p.lessonStatus, role),
  };
}

function relTime(iso: string): string {
  return dayjs(iso).fromNow();
}

/** Contador en badge estilo apps sociales: 1–99 literal, a partir de 100 → 99+ */
function formatBadgeCount(n: number): string {
  if (n > 99) return "99+";
  return String(n);
}

export function NotificationBell({
  userId,
  organizationId,
  userRole,
  initialUnread = 0,
}: {
  userId: string;
  organizationId: string;
  userRole: UserRole;
  initialUnread: number;
}) {
  const router = useRouter();
  const menuId = useId();
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotificationListItem[]>([]);
  const [unread, setUnread] = useState(initialUnread);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const seenAblyIds = useRef<Set<string>>(new Set());
  const ablyClientRef = useRef<Ably.Realtime | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setFetchError(false);
    try {
      const r = await fetch("/api/notifications?limit=25", {
        credentials: "include",
      });
      if (!r.ok) throw new Error(String(r.status));
      const data: unknown = await r.json();
      const o = data as {
        items?: NotificationListItem[];
        unreadCount?: number;
      };
      setItems(o.items ?? []);
      if (typeof o.unreadCount === "number") setUnread(o.unreadCount);
    } catch {
      setFetchError(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const authProbe = await fetch("/api/ably/auth", {
        credentials: "include",
      });
      if (!authProbe.ok || cancelled) return;

      const c = new Ably.Realtime({
        authCallback: (tokenParams, callback) => {
          void (async () => {
            try {
              const r = await fetch("/api/ably/auth", {
                credentials: "include",
              });
              if (!r.ok) {
                callback(`auth ${r.status}`, null);
                return;
              }
              const tr: unknown = await r.json();
              callback(null, tr as TokenRequest);
            } catch (e) {
              callback(e instanceof Error ? e.message : String(e), null);
            }
          })();
        },
        clientId: userId,
      });
      if (cancelled) {
        c.close();
        return;
      }
      ablyClientRef.current = c;

      const ch = c.channels.get(organizationChannelName(organizationId));
      ch.subscribe("notification", (message) => {
        const m = message.data;
        if (!isAblyPayloadV1(m)) return;
        if (m.organizationId !== organizationId) return;
        if (seenAblyIds.current.has(m.id)) return;
        seenAblyIds.current.add(m.id);

        const next = fromAblyPayload(m, userRole, userId);
        setItems((prev) => {
          if (prev.some((p) => p.id === next.id)) return prev;
          return [next, ...prev].slice(0, 50);
        });
        if (m.actorUserId !== userId && !next.read) {
          setUnread((c0) => c0 + 1);
        }
      });
    })();

    return () => {
      cancelled = true;
      ablyClientRef.current?.close();
      ablyClientRef.current = null;
    };
  }, [userId, organizationId, userRole]);

  const markOneRead = useCallback(async (n: NotificationListItem) => {
    if (n.read) return;
    setItems((p) => p.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    setUnread((u) => Math.max(0, u - 1));
    try {
      const r = await fetch("/api/notifications/mark-read", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notificationId: n.id }),
        credentials: "include",
      });
      if (!r.ok) throw new Error();
    } catch {
      setItems((p) =>
        p.map((x) => (x.id === n.id ? { ...x, read: false } : x)),
      );
      setUnread((u) => u + 1);
    }
  }, []);

  const onItemNavigate = useCallback(
    async (n: NotificationListItem) => {
      if (!n.read) await markOneRead(n);
      router.push(n.href);
      setOpen(false);
    },
    [markOneRead, router],
  );

  const markAll = useCallback(async () => {
    setItems((p) => p.map((x) => ({ ...x, read: true })));
    setUnread(0);
    try {
      const r = await fetch("/api/notifications/mark-all-read", {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) throw new Error();
    } catch {
      void load();
    }
  }, [load]);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        className="relative flex h-10 w-10 shrink-0 items-center justify-center overflow-visible rounded-full border border-white/10 bg-white/5 text-slate-200 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500/60 cursor-pointer"
        title={
          unread > 0
            ? `Notificaciones (${unread} sin leer)`
            : "Notificaciones"
        }
        aria-label={
          unread > 0
            ? `Notificaciones, ${unread} sin leer`
            : "Notificaciones"
        }
        aria-expanded={open}
        aria-haspopup="true"
        aria-controls={open ? menuId : undefined}
        onClick={() => setOpen((o) => !o)}
      >
        <span aria-hidden className="relative">
          <svg
            className="h-5 w-5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
            <path d="M13.73 21a2 2 0 0 1-3.46 0" />
          </svg>
        </span>
        {unread > 0 ? (
          <span
            className="pointer-events-none absolute -right-1 -top-1 z-10 flex min-h-5 min-w-5 items-center justify-center rounded-full border-2 border-slate-900 bg-[#f02849] px-1 text-[11px] font-bold leading-none text-white shadow-[0_1px_3px_rgba(0,0,0,0.45)] tabular-nums ring-1 ring-white/25 transition-transform duration-200 ease-out"
            aria-hidden
          >
            {formatBadgeCount(unread)}
          </span>
        ) : null}
      </button>

      {open ? (
        <div
          id={menuId}
          role="menu"
          className="absolute right-0 z-50 mt-2 w-[min(calc(100vw-1.5rem),22rem)] overflow-hidden rounded-2xl border border-white/10 bg-slate-950/98 shadow-2xl shadow-black/50 backdrop-blur"
        >
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <h2 className="text-sm font-semibold text-slate-100">
              Notificaciones
            </h2>
            {items.length > 0 && unread > 0 ? (
              <button
                type="button"
                role="menuitem"
                onClick={() => void markAll()}
                className="text-xs font-medium text-blue-400 transition hover:text-blue-300"
              >
                Marcar todo leído
              </button>
            ) : null}
          </div>

          <div className="max-h-[min(70vh,24rem)] overflow-y-auto">
            {loading ? (
              <ul className="divide-y divide-white/5 p-2">
                {[0, 1, 2].map((i) => (
                  <li key={i} className="animate-pulse rounded-xl px-3 py-3">
                    <div className="h-3 w-2/3 rounded bg-white/10" />
                    <div className="mt-2 h-2 w-1/2 rounded bg-white/5" />
                  </li>
                ))}
              </ul>
            ) : fetchError ? (
              <div className="px-4 py-8 text-center text-sm text-rose-300">
                No se pudieron cargar las notificaciones.
                <button
                  type="button"
                  onClick={() => void load()}
                  className="mt-2 block w-full text-blue-400 hover:underline"
                >
                  Reintentar
                </button>
              </div>
            ) : items.length === 0 ? (
              <div className="px-4 py-10 text-center text-sm text-slate-400">
                No hay notificaciones.
              </div>
            ) : (
              <ul className="divide-y divide-white/5" role="list">
                {items.map((n) => (
                  <li key={n.id}>
                    <div
                      role="menuitem"
                      className={`flex gap-3 px-3 py-3 transition hover:bg-white/5 ${
                        !n.read ? "bg-blue-500/5" : ""
                      }`}
                    >
                      <div
                        className={`mt-0.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-lg ${
                          n.kind === "LESSON_CREATED"
                            ? "bg-emerald-500/20 text-emerald-300"
                            : "bg-amber-500/20 text-amber-200"
                        }`}
                        aria-hidden
                      >
                        {n.kind === "LESSON_CREATED" ? (
                          <FiBook className="h-4 w-4" />
                        ) : (
                          <FiEdit2 className="h-4 w-4" />
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-start justify-between gap-2">
                          <p
                            className={`text-sm leading-snug ${
                              !n.read
                                ? "font-semibold text-slate-50"
                                : "font-medium text-slate-200"
                            }`}
                          >
                            {n.kind === "LESSON_CREATED"
                              ? "Nueva lección"
                              : "Lección actualizada"}
                          </p>
                          <span
                            className="shrink-0 text-[10px] text-slate-500"
                            title={n.createdAt}
                          >
                            {relTime(n.createdAt)}
                          </span>
                        </div>
                        <p className="mt-0.5 line-clamp-2 text-xs text-slate-300">
                          {n.title}
                        </p>
                        {n.summary ? (
                          <p className="mt-0.5 text-xs text-slate-500">
                            {n.summary}
                          </p>
                        ) : null}
                        <div className="mt-2 flex flex-wrap items-center gap-2">
                          <Link
                            href={n.href}
                            onClick={async (e) => {
                              e.preventDefault();
                              await onItemNavigate(n);
                            }}
                            className="text-xs font-medium text-blue-400 hover:underline"
                          >
                            Abrir
                          </Link>
                          {!n.read ? (
                            <button
                              type="button"
                              onClick={() => void markOneRead(n)}
                              className="text-xs text-slate-500 hover:text-slate-300"
                            >
                              Marcar leída
                            </button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      ) : null}
    </div>
  );
}
