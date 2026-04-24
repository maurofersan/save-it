import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { markAllNotificationsAsRead } from "@/services/notificationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function POST() {
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

  const { marked } = await markAllNotificationsAsRead({
    userId: user.id,
    organizationId: user.organizationId,
  });
  return NextResponse.json({ ok: true, marked });
}
