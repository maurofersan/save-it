import { NextResponse } from "next/server";
import Ably from "ably";
import { getCurrentUser } from "@/lib/auth";
import { organizationChannelName } from "@/lib/ably/channelName";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

/**
 * Ably token auth: el cliente no usa la API key; solo suscripción al canal de su organización.
 */
export async function GET() {
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
  const key = process.env.ABLY_API_KEY;
  if (!key) {
    return NextResponse.json(
      { error: "ABLY_API_KEY no configurada en el servidor" },
      { status: 503 },
    );
  }

  const orgId = user.organizationId;
  const ch = organizationChannelName(orgId);
  const rest = new Ably.Rest({ key });

  const tokenRequest = await rest.auth.createTokenRequest({
    clientId: user.id,
    capability: { [ch]: ["subscribe"] },
  });

  return NextResponse.json(tokenRequest);
}
