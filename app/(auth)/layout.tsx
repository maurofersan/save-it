import { BrandMark } from "@/components/brand/BrandMark";

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="c-card c-auth-hero rounded-3xl border border-white/10 p-10">
              <div className="c-auth-hero__brand flex flex-col gap-4 sm:flex-row sm:items-center sm:gap-5">
                <BrandMark size="lg" decorative />
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-blue-200">
                    SAVE IT
                  </div>
                  <p className="mt-1 text-xs text-slate-400">
                    Lecciones Aprendidas
                  </p>
                </div>
              </div>
              <h1 className="mt-6 text-3xl font-semibold tracking-tight text-slate-50 sm:mt-8">
                Gestión de Lecciones Aprendidas
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Captura, valida y reutiliza conocimiento de obra con un flujo
                simple: registrar → revisar → publicar.
              </p>
              <div className="mt-8 grid grid-cols-1 gap-3 text-sm text-slate-300">
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  - Roles: Ingeniero (registrador) y Residente (revisor).
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  - Evidencia: mínimo 1 imagen para validar.
                </div>
                <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                  - Biblioteca: búsqueda + métricas (vistas y puntuación).
                </div>
              </div>
            </div>
          </div>

          <div className="c-auth-panel mx-auto w-full max-w-md">
            <header className="c-auth-panel__brand mb-8 flex flex-col items-center text-center lg:hidden">
              <BrandMark size="md" priority decorative />
              <div className="mt-4 space-y-1">
                <p className="text-sm font-semibold text-blue-200">SAVE IT</p>
                <p className="text-xs text-slate-400">Lecciones Aprendidas</p>
              </div>
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
