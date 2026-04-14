"use client";

import { useActionState } from "react";
import Link from "next/link";
import { registerAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";

type State = ActionResult<User> | null;

export function RegisterForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    registerAction,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  return (
    <Card className="border-white/10">
      <CardHeader>
        <div className="text-sm font-semibold text-blue-200">Nuevo usuario</div>
        <div className="mt-1 text-xl font-semibold text-slate-50">Registro</div>
        <div className="mt-1 text-sm text-slate-300">
          Crea tu cuenta y selecciona tu rol.
        </div>
      </CardHeader>
      <CardBody>
        <form action={action} className="flex flex-col gap-4">
          <Input
            name="name"
            label="Nombre"
            placeholder="Tu nombre"
            error={fieldErrors?.name}
            required
          />
          <Input
            name="email"
            type="email"
            autoComplete="email"
            label="Correo"
            placeholder="tu@empresa.com"
            error={fieldErrors?.email}
            required
          />
          <Select name="role" label="Rol" defaultValue="ENGINEER" error={fieldErrors?.role}>
            <option value="ENGINEER">Ingeniero (registrador)</option>
            <option value="RESIDENT">Residente (revisor)</option>
          </Select>
          <Input
            name="password"
            type="password"
            autoComplete="new-password"
            label="Contraseña"
            placeholder="Mínimo 8 caracteres"
            error={fieldErrors?.password}
            required
          />

          {state && !state.ok ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {state.error.message}
            </div>
          ) : null}

          <Button type="submit" disabled={pending}>
            {pending ? "Creando..." : "Crear cuenta"}
          </Button>

          <div className="text-center text-sm text-slate-300">
            ¿Ya tienes cuenta?{" "}
            <Link className="text-blue-200 hover:underline" href="/login">
              Iniciar sesión
            </Link>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

