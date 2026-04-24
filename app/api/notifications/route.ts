import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import {
  countUnreadForUser,
  listNotificationsForUser,
} from "@/services/notificationService";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET(req: NextRequest) {
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

  const sp = req.nextUrl.searchParams;
  const limitRaw = sp.get("limit");
  const limit = limitRaw ? Math.min(50, Math.max(1, parseInt(limitRaw, 10) || 20)) : 20;

  const [items, unreadCount] = await Promise.all([
    listNotificationsForUser({
      userId: user.id,
      organizationId: user.organizationId,
      role: user.role,
      limit,
    }),
    countUnreadForUser(user.id, user.organizationId),
  ]);

  return NextResponse.json({ items, unreadCount });
}
