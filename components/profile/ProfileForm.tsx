"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/users";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";

type State = ActionResult<User> | null;

export function ProfileForm({ user }: { user: User }) {
  const [state, action, pending] = useActionState<State, FormData>(
    updateProfileAction,
    null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const effectiveUser = state?.ok ? state.data : user;

  return (
    <Card>
      <CardHeader>
        <div className="text-sm font-semibold text-blue-200">Perfil</div>
        <div className="mt-1 text-xl font-semibold text-slate-50">Tu información</div>
        <div className="mt-1 text-sm text-slate-300">
          Edita nombre, correo (solo lectura) y datos de contacto.
        </div>
      </CardHeader>
      <CardBody>
        <form action={action} className="grid gap-4">
          <Input
            name="name"
            label="Nombre"
            defaultValue={effectiveUser.name}
            error={fieldErrors?.name}
            required
          />
          <Input name="email" label="Correo" defaultValue={effectiveUser.email} disabled />
          <div className="grid gap-4 sm:grid-cols-2">
            <Input
              name="phone"
              label="Celular"
              defaultValue={effectiveUser.phone ?? ""}
              error={fieldErrors?.phone}
            />
            <Input
              name="company"
              label="Empresa"
              defaultValue={effectiveUser.company ?? ""}
              error={fieldErrors?.company}
            />
          </div>
          <Input
            name="title"
            label="Cargo"
            defaultValue={effectiveUser.title ?? ""}
            error={fieldErrors?.title}
          />

          {state && !state.ok ? (
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
              {state.error.message}
            </div>
          ) : null}
          {state && state.ok ? (
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-200">
              Perfil actualizado.
            </div>
          ) : null}

          <div className="flex items-center gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Guardando..." : "Guardar cambios"}
            </Button>
          </div>
        </form>
      </CardBody>
    </Card>
  );
}

