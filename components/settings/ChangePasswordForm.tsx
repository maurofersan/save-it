"use client";

import { useActionState, useEffect, useRef } from "react";
import { changePasswordAction } from "@/actions/auth";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import type { ActionResult } from "@/types/actions";

type State = ActionResult<{ updated: true }> | null;

export function ChangePasswordForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [state, action, pending] = useActionState<State, FormData>(
    changePasswordAction,
    null,
  );

  const fieldErrors = state && !state.ok ? state.error.fieldErrors : undefined;

  useEffect(() => {
    if (state?.ok) formRef.current?.reset();
  }, [state]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
      <div className="text-sm font-semibold text-slate-100">Usuario y contraseña</div>
      <div className="mt-1 text-sm text-slate-300">
        Para cambiar la contraseña, indica la actual y la nueva dos veces.
      </div>

      <form ref={formRef} action={action} className="mt-4 flex flex-col gap-4">
        <Input
          name="currentPassword"
          type="password"
          autoComplete="current-password"
          label="Contraseña actual"
          required
          showPasswordToggle
          error={fieldErrors?.currentPassword}
        />
        <Input
          name="newPassword"
          type="password"
          autoComplete="new-password"
          label="Nueva contraseña"
          hint="Entre 8 y 72 caracteres (igual que al registrarte)."
          required
          showPasswordToggle
          error={fieldErrors?.newPassword}
        />
        <Input
          name="confirmPassword"
          type="password"
          autoComplete="new-password"
          label="Confirmar nueva contraseña"
          required
          showPasswordToggle
          error={fieldErrors?.confirmPassword}
        />

        {state && !state.ok ? (
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-200">
            {state.error.message}
          </div>
        ) : null}
        {state?.ok ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3 text-sm text-green-200">
            Contraseña actualizada correctamente.
          </div>
        ) : null}

        <div>
          <Button type="submit" disabled={pending}>
            {pending ? "Guardando..." : "Cambiar contraseña"}
          </Button>
        </div>
      </form>
    </div>
  );
}
