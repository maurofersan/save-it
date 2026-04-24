"use client";

import { useActionState } from "react";
import { updateProfileAction } from "@/actions/users";
import { Button } from "@/components/ui/Button";
import { Card, CardBody, CardHeader } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { ProfilePhotoPicker } from "@/components/profile/ProfilePhotoPicker";
import type { ActionResult } from "@/types/actions";
import type { User } from "@/types/models";

type State = ActionResult<User> | null;

export function ProfileForm({
  user,
  organizationName,
}: {
  user: User;
  /** `organizations.name` vía `organizationId` (solo lectura en el formulario). */
  organizationName: string;
}) {
  const [state, action, pending] = useActionState<State, FormData>(
    updateProfileAction,
    null,
  );
  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const effectiveUser = state?.ok ? state.data : user;

  return (
    <Card>
      <form action={action} className="grid">
        <CardHeader>
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between sm:gap-8">
            <div className="min-w-0">
              <div className="text-sm font-semibold text-blue-200">Perfil</div>
              <div className="mt-1 text-xl font-semibold text-slate-50">Tu información</div>
              <div className="mt-1 text-sm text-slate-300">
                Edita nombre y datos de contacto. Correo y empresa son de solo lectura.
              </div>
            </div>
            <ProfilePhotoPicker
              fileInputName="avatar"
              userName={effectiveUser.name}
              defaultUrl={effectiveUser.avatarUrl}
            />
          </div>
        </CardHeader>
        <CardBody className="grid gap-4">
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
              label="Empresa"
              defaultValue={organizationName}
              disabled
              title="Nombre de tu organización (desde la base de datos)"
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
              {pending ? "Guardando…" : "Guardar cambios"}
            </Button>
          </div>
        </CardBody>
      </form>
    </Card>
  );
}
