"use client";

import { useActionState } from "react";
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
        <div className="mt-1 text-xl font-semibold text-slate-50">
          Iniciar sesión
        </div>
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

          <p className="text-center text-xs leading-relaxed text-slate-400">
            Si aún no tienes acceso, pide a tu revisor (residente) que cree tu cuenta.
          </p>
        </form>
      </CardBody>
    </Card>
  );
}
