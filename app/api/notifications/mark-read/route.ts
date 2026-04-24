import { NextResponse } from "next/server";
import { z } from "zod";
import { getCurrentUser } from "@/lib/auth";
import { isValidObjectIdString } from "@/lib/objectId";
import { markNotificationAsRead } from "@/services/notificationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const bodySchema = z.object({
  notificationId: z
    .string()
    .refine(
      (s) => isValidObjectIdString(s),
      "id inválido",
    ),
});

export async function POST(req: Request) {
  const user = await getCurrentUser();
  if (!user) {
    return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  }
  if (!user.organizationId) {
    return NextResponse.json(
      { error: "Usuario sin organización" },
      { status: 400 },
    );
  }

  const json: unknown = await req.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(json);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Cuerpo inválido" },
      { status: 400 },
    );
  }

  try {
    await markNotificationAsRead({
      userId: user.id,
      organizationId: user.organizationId,
      notificationId: parsed.data.notificationId,
    });
  } catch (e) {
    const m = e instanceof Error ? e.message : "Error";
    if (m.includes("no encontrada")) {
      return NextResponse.json({ error: m }, { status: 404 });
    }
    throw e;
  }

  return NextResponse.json({ ok: true });
}
