import type { Id } from "@/types/domain";

/** Nombre de canal Ably: una organización, todos los miembros suscritos. */
export function organizationChannelName(organizationId: Id): string {
  return `org:${organizationId}`;
}
