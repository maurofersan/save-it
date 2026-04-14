"use client";

import { useActionState } from "react";
import Link from "next/link";
import { loginAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";

type State = ActionResult<User> | null;

export function LoginForm({ next }: { next?: string }) {
  const [state, action, pending] = useActionState<State, FormData>(
    loginAction,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <Card className="border-white/10">
      <CardHeader>
        <div className="text-sm font-semibold text-blue-200">Bienvenido</div>
        <div className="mt-1 text-xl font-semibold text-slate-50">Iniciar sesión</div>
        <div className="mt-1 text-sm text-slate-300">
          Ingresa con tu correo y contraseña.
        </div>
      </CardHeader>
      <CardBody>
        <form action={action} className="flex flex-col gap-4">
          {next ? <input type="hidden" name="next" value={next} /> : null}
          <Input
            name="email"
            type="email"
            autoComplete="email"
            label="Correo"
            placeholder="tu@empresa.com"
            error={fieldErrors?.email}
            required
          />
          <Input
            name="password"
            type="password"
            autoComplete="current-password"
            label="Contraseña"
            placeholder="••••••••"
            error={fieldErrors?.password}
            showPasswordToggle
            required
          />

          {state && !state.ok ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {state.error.message}
            </div>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Ingresando..." : "Ingresar"}
          </Button>

          <div className="text-center text-sm text-slate-300">
            ¿No tienes cuenta?{" "}
            <Link className="text-blue-200 hover:underline" href="/register">
              Crear cuenta
            </Link>
          </div>

          <div className="rounded-xl border border-white/10 bg-white/5 p-3 text-xs text-slate-300">
            Demo Residente: <span className="font-mono">resident@saveit.local</span>{" "}
            / <span className="font-mono">Resident123!</span>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

