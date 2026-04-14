export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen">
      <div className="mx-auto flex min-h-screen w-full max-w-7xl items-center justify-center px-4 py-10 sm:px-6">
        <div className="grid w-full grid-cols-1 gap-8 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="c-card rounded-3xl border border-white/10 p-10">
              <div className="text-sm font-semibold text-blue-200">SAVE IT</div>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-50">
                Gestión de Lecciones Aprendidas
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Captura, valida y reutiliza conocimiento de obra con un flujo simple:
                registrar → revisar → publicar.
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

          <div className="mx-auto w-full max-w-md">{children}</div>
        </div>
      </div>
    </div>
  );
}

