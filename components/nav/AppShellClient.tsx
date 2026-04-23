"use client";

import { BrandMark } from "@/components/brand/BrandMark";
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
  safeUser: { name: string; email: string } | null;
  orgBrand: { name: string; logoUrl: string | null } | null;
  roleLabel: string;
  onNavigate?: () => void;
}) {
  return (
    <>
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          {orgBrand?.logoUrl ? (
            // External tenant branding URLs are not known at build time.
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

      <nav className="mt-4 flex flex-col gap-1">
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

      <div className="mt-4 rounded-xl border border-white/10 bg-white/5 p-3">
        <div className="text-xs text-slate-400">Sesión</div>
        <div className="mt-1 text-sm font-medium text-slate-100">
          {safeUser?.name ?? "Usuario"}
        </div>
        <div className="text-xs text-slate-400">{safeUser?.email ?? ""}</div>
      </div>
    </>
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

export function AppShellClient({
  children,
  activePath,
  links,
  safeUser,
  orgBrand,
  roleLabel,
}: {
  children: ReactNode;
  activePath: string;
  links: NavLinkItem[];
  safeUser: { name: string; email: string } | null;
  orgBrand: { name: string; logoUrl: string | null } | null;
  roleLabel: string;
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
          <aside className="c-card hidden rounded-2xl border border-white/10 p-4 lg:block">
            <AsideContent
              links={links}
              activePath={activePath}
              safeUser={safeUser}
              orgBrand={orgBrand}
              roleLabel={roleLabel}
            />
          </aside>

          <div className="min-w-0">
            <div className="mb-4 flex items-center justify-start lg:hidden">
              <button
                type="button"
                className="inline-flex items-center justify-center rounded-xl border border-white/10 bg-white/5 p-2.5 text-slate-100 outline-none transition hover:bg-white/10 focus:ring-2 focus:ring-blue-500/60"
                aria-expanded={open}
                aria-controls={drawerId}
                aria-label={open ? "Cerrar menú" : "Abrir menú"}
                onClick={() => setOpen((v) => !v)}
              >
                <HamburgerIcon open={open} />
              </button>
            </div>
            <main>{children}</main>
          </div>
        </div>
      </div>

      {/* Mobile drawer + backdrop (lg:hidden via fixed layer; desktop uses aside above) */}
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
          className={`absolute left-0 top-0 flex h-full w-[min(280px,92vw)] flex-col overflow-y-auto border-r border-white/10 bg-slate-950/98 p-4 shadow-2xl backdrop-blur transition-transform duration-300 ease-out ${
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
