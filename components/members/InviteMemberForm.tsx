"use client";

import { useActionState } from "react";
import { createMemberByReviewerAction } from "@/actions/members";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { User } from "@/types/models";
import type { ActionResult } from "@/types/actions";

type State = ActionResult<User> | null;

export function InviteMemberForm() {
  const [state, action, pending] = useActionState<State, FormData>(
    createMemberByReviewerAction,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;
  const ok = state && state.ok;

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-slate-100">Nuevo personal (ingeniero)</div>
      <p className="mt-1 text-sm text-slate-400">
        Crea la cuenta de un registrador de lecciones para tu empresa. El inicio de sesión se hace
        con el correo y la contraseña que definas.
      </p>
      {ok ? (
        <div className="mt-3 rounded-xl border border-emerald-500/25 bg-emerald-500/10 p-3 text-sm text-emerald-200">
          Usuario creado: {state.data.email}
        </div>
      ) : null}
      <form action={action} className="mt-4 flex flex-col gap-3">
        <Input
          name="name"
          label="Nombre completo"
          placeholder="Nombre del colaborador"
          error={fieldErrors?.name}
          required
        />
        <Input
          name="email"
          type="email"
          autoComplete="off"
          label="Correo"
          placeholder="colaborador@empresa.com"
          error={fieldErrors?.email}
          required
        />
        <Input
          name="password"
          type="password"
          autoComplete="new-password"
          label="Contraseña inicial"
          placeholder="Mínimo 8 caracteres"
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
          {pending ? "Creando…" : "Crear cuenta de ingeniero"}
        </Button>
      </form>
    </div>
  );
}
