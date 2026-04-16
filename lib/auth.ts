import { cookies } from "next/headers";
import { deleteExpiredSessions, getSessionByToken } from "@/services/sessionService";
import { getUserById } from "@/services/userService";
import type { User } from "@/types/models";
import { SESSION_COOKIE_NAME, SESSION_DAYS } from "@/lib/constants";

export { SESSION_COOKIE_NAME, SESSION_DAYS };

export async function getCurrentUser(): Promise<User | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE_NAME)?.value;
  if (!token) return null;

  const nowIso = new Date().toISOString();
  await deleteExpiredSessions(nowIso);

  const session = await getSessionByToken(token);
  if (!session) return null;
  if (session.expiresAt <= nowIso) return null;

  return getUserById(session.userId);
}
