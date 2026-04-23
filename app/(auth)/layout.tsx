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
              <div className="c-auth-hero__brand flex flex-col gap-5 sm:flex-row sm:items-center sm:gap-6">
                <BrandMark size="lg" variant="bare" decorative />
                <div className="min-w-0">
                  <div className="text-2xl font-bold tracking-tight text-blue-600 sm:text-3xl">
                    SAVE IT
                  </div>
                  <p className="mt-0.5 text-sm font-medium tracking-wide text-rose-500">
                    PLATAFORMA DIGITAL
                  </p>
                </div>
              </div>
              <h1 className="mt-8 text-3xl font-semibold tracking-tight text-slate-50 sm:mt-10">
                Gestión de Lecciones Aprendidas
              </h1>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                Captura, valida y reutiliza conocimiento de obra con un flujo
                simple: registrar → revisar → publicar.
              </p>
            </div>
          </div>

          <div className="c-auth-panel mx-auto w-full max-w-md">
            <header className="c-auth-panel__brand mb-8 flex flex-col items-center text-center lg:hidden">
              <div className="flex flex-col items-center gap-3 sm:flex-row sm:gap-4">
                <BrandMark size="md" variant="bare" priority decorative />
                <div className="min-w-0 text-center sm:text-left">
                  <p className="text-xl font-bold text-blue-600">SAVE IT</p>
                  <p className="text-sm font-medium text-rose-500">
                    PLATAFORMA DIGITAL
                  </p>
                </div>
              </div>
            </header>
            {children}
          </div>
        </div>
      </div>
    </div>
  );
}
