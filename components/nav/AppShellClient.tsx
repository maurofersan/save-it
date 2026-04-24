"use client";

import { logoutAction } from "@/actions/auth";
import { BrandMark } from "@/components/brand/BrandMark";
import { UserAvatar } from "@/components/ui/UserAvatar";
import Link from "next/link";
import { useCallback, useEffect, useId, useState, type ReactNode } from "react";

type NavLinkItem = { href: string; label: string };

function NavLink({
  href,
  label,
  active,
  onNavigate,
}: {
  href: string;
  label: string;
  active?: boolean;
  onNavigate?: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onNavigate}
      className={`flex items-center gap-3 rounded-xl px-3 py-2 text-sm transition-colors ${
        active
          ? "border border-blue-500/25 bg-blue-600/15 text-blue-200"
          : "border border-transparent text-slate-200 hover:bg-white/5"
      }`}
    >
      <span className="h-2 w-2 rounded-full bg-blue-400/60" />
      <span>{label}</span>
    </Link>
  );
}

function AsideContent({
  links,
  activePath,
  safeUser,
  orgBrand,
  roleLabel,
  onNavigate,
}: {
  links: NavLinkItem[];
  activePath: string;
  safeUser: { name: string; email: string; avatarUrl: string | null } | null;
  orgBrand: { name: string; logoUrl: string | null } | null;
  roleLabel: string;
  onNavigate?: () => void;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex shrink-0 items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {orgBrand?.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={orgBrand.logoUrl}
              alt=""
              className="h-10 max-w-[120px] shrink-0 object-contain"
            />
          ) : (
            <BrandMark href="/dashboard" size="md" decorative />
          )}
          <div className="min-w-0 leading-tight">
            <div className="truncate text-sm font-semibold text-slate-100">
              {orgBrand?.name ?? "SAVE IT"}
            </div>
            <div className="text-xs text-slate-400">
              {orgBrand ? "SAVE IT · Lecciones" : "Lecciones Aprendidas"}
            </div>
          </div>
        </div>
        <div className="hidden shrink-0 text-xs text-slate-400 sm:block">
          {roleLabel}
        </div>
      </div>

      <nav className="mt-4 flex flex-1 flex-col gap-1 overflow-y-auto">
        {links.map((l) => (
          <NavLink
            key={l.href}
            href={l.href}
            label={l.label}
            active={activePath === l.href}
            onNavigate={onNavigate}
          />
        ))}
      </nav>

      <div className="mt-4 shrink-0 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-slate-400">Sesión</div>
        <div className="mt-2 flex items-center gap-3">
          {safeUser ? (
            <UserAvatar
              name={safeUser.name}
              src={safeUser.avatarUrl}
              size={40}
            />
          ) : null}
          <div className="min-w-0 flex-1">
            <div className="text-sm font-medium text-slate-100">
              {safeUser?.name ?? "Usuario"}
            </div>
            <div className="truncate text-xs text-slate-400">
              {safeUser?.email ?? ""}
            </div>
          </div>
        </div>
      </div>

      <form
        action={logoutAction}
        className="mt-4 shrink-0 border-t border-white/10 pt-4"
      >
        <button
          type="submit"
          className="flex w-full items-center justify-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-sm font-medium text-slate-100 transition hover:bg-white/10 cursor-pointer"
        >
          <svg
            aria-hidden
            className="h-4 w-4 shrink-0"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
            <polyline points="16 17 21 12 16 7" />
            <line x1="21" y1="12" x2="9" y2="12" />
          </svg>
          Salir
        </button>
      </form>
    </div>
  );
}

function HamburgerIcon({ open }: { open: boolean }) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 24 24"
      className="h-6 w-6 text-slate-100"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
    >
      {open ? (
        <>
          <path d="M6 6l12 12M18 6L6 18" />
        </>
      ) : (
        <>
          <path d="M4 7h16M4 12h16M4 17h16" />
        </>
      )}
    </svg>
  );
}

function BellIcon() {
  return (
    <svg
      aria-hidden
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
  );
}

function MainTopBar({
  safeUser,
  notificationCount,
  open,
  setOpen,
  drawerId,
}: {
  safeUser: { name: string; email: string; avatarUrl: string | null } | null;
  notificationCount: number;
  open: boolean;
  setOpen: (v: boolean | ((b: boolean) => boolean)) => void;
  drawerId: string;
}) {
  return (
    <div className="relative mb-6 flex min-h-[44px] items-center justify-end gap-2 sm:mb-8">
      <button
        type="button"
        className="absolute left-0 top-1/2 z-10 inline-flex -translate-y-1/2 items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-100 outline-none transition hover:bg-white/10 focus:ring-2 focus:ring-blue-500/60 lg:hidden"
        aria-expanded={open}
        aria-controls={drawerId}
        aria-label={open ? "Cerrar menú" : "Abrir menú"}
        onClick={() => setOpen((v) => !v)}
      >
        <HamburgerIcon open={open} />
      </button>

      <Link
        href="/dashboard"
        className="absolute left-1/2 top-1/2 z-0 flex -translate-x-1/2 -translate-y-1/2 items-center gap-0 rounded-xl px-2 py-1 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60"
        aria-label="SAVE IT — inicio"
      >
        <BrandMark
          size="lg"
          variant="bare"
          decorative
          className="-my-1 -mr-3 sm:-mr-4"
        />
        <span className="text-xl font-bold leading-none tracking-tight text-blue-600 sm:text-2xl">
          SAVE IT
        </span>
      </Link>

      <div className="relative z-10 ml-auto flex items-center gap-2">
        <Link
          href="/profile"
          className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-blue-500/60 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950 rounded-full"
          title="Perfil"
          aria-label="Ir a perfil"
        >
          {safeUser ? (
            <UserAvatar
              name={safeUser.name}
              src={safeUser.avatarUrl}
              size={40}
            />
          ) : null}
        </Link>
        <button
          type="button"
          className="relative flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/5 text-slate-600 outline-none transition hover:bg-white/10 focus-visible:ring-2 focus-visible:ring-blue-500/60"
          title="Notificaciones"
          aria-label="Notificaciones"
        >
          <BellIcon />
          {notificationCount > 0 ? (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-500 px-1 text-[10px] font-bold text-white">
              {notificationCount > 9 ? "9+" : notificationCount}
            </span>
          ) : null}
        </button>
      </div>
    </div>
  );
}

export function AppShellClient({
  children,
  activePath,
  links,
  safeUser,
  orgBrand,
  roleLabel,
  notificationCount = 0,
}: {
  children: ReactNode;
  activePath: string;
  links: NavLinkItem[];
  safeUser: { name: string; email: string; avatarUrl: string | null } | null;
  orgBrand: { name: string; logoUrl: string | null } | null;
  roleLabel: string;
  /** Contador para badge de campana (0 = oculto). */
  notificationCount?: number;
}) {
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const drawerId = useId();

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = prev;
    };
  }, [open, close]);

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = () => {
      if (mq.matches) setOpen(false);
    };
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);

  return (
    <div className="min-h-screen">
      <div className="mx-auto w-full max-w-7xl px-4 py-4 sm:px-6 sm:py-6">
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr] lg:gap-6">
          <aside className="c-card hidden max-h-[calc(100vh-3rem)] min-h-0 flex-col rounded-2xl border border-white/10 p-4 lg:flex lg:flex-col">
            <AsideContent
              links={links}
              activePath={activePath}
              safeUser={safeUser}
              orgBrand={orgBrand}
              roleLabel={roleLabel}
            />
          </aside>

          <div className="min-w-0">
            <MainTopBar
              safeUser={safeUser}
              notificationCount={notificationCount}
              open={open}
              setOpen={setOpen}
              drawerId={drawerId}
            />
            <main>{children}</main>
          </div>
        </div>
      </div>

      <div
        className={`fixed inset-0 z-40 lg:hidden ${open ? "pointer-events-auto" : "pointer-events-none"}`}
        aria-hidden={!open}
      >
        <button
          type="button"
          className={`absolute inset-0 bg-black/60 transition-opacity duration-300 ${
            open ? "opacity-100" : "opacity-0"
          }`}
          tabIndex={open ? 0 : -1}
          aria-label="Cerrar menú"
          onClick={close}
        />
        <aside
          id={drawerId}
          role="dialog"
          aria-modal="true"
          aria-hidden={!open}
          aria-label="Navegación"
          className={`absolute left-0 top-0 flex h-full w-[min(280px,92vw)] flex-col overflow-hidden border-r border-white/10 bg-slate-950/98 p-4 shadow-2xl backdrop-blur transition-transform duration-300 ease-out ${
            open ? "translate-x-0" : "-translate-x-full"
          }`}
        >
          <AsideContent
            links={links}
            activePath={activePath}
            safeUser={safeUser}
            orgBrand={orgBrand}
            roleLabel={roleLabel}
            onNavigate={close}
          />
        </aside>
      </div>
    </div>
  );
}
