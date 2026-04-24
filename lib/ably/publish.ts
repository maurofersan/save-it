import Ably from "ably";
import { organizationChannelName } from "@/lib/ably/channelName";
import type { AblyNotificationPayloadV1 } from "@/types/notifications";

const EVENT = "notification";

function getRest(): Ably.Rest {
  const key = process.env.ABLY_API_KEY;
  if (!key) {
    throw new Error("ABLY_API_KEY is not set");
  }
  return new Ably.Rest({ key });
}

/**
 * Publica un evento a todos los clientes conectados de la misma organización.
 * No debe re-lanzar errores: loguea y sigue.
 */
export async function publishNotificationEvent(
  payload: AblyNotificationPayloadV1,
): Promise<void> {
  if (!process.env.ABLY_API_KEY) {
    if (process.env.NODE_ENV === "development") {
      console.warn("publishNotificationEvent: ABLY_API_KEY missing, skipping.");
    }
    return;
  }
  try {
    const rest = getRest();
    const ch = rest.channels.get(organizationChannelName(payload.organizationId));
    await ch.publish(EVENT, payload);
  } catch (e) {
    console.error("Ably publish failed", e);
  }
}
