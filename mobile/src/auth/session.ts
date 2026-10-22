import * as SecureStore from "expo-secure-store";
import { configureHttp } from "@shared/api/httpClient";
import { authApi, type AuthUser } from "@shared/api/authClient";
import { API_URL } from "@/config";

const TOKEN_KEY = "obrix.token";
const USER_KEY = "obrix.user";

export type Session = {
  token: string;
  user: AuthUser;
};

/**
 * Configura el transporte HTTP global para que TODOS los clientes de
 * `@shared/api/*` (asistente, cotización, etc.) apunten a la URL absoluta del
 * API y envíen el `Authorization: Bearer` cuando haya sesión.
 */
export function configureApi(token: string | null): void {
  configureHttp({
    baseUrl: API_URL,
    headers: token ? { authorization: `Bearer ${token}` } : {},
  });
}

export async function saveSession(session: Session): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, session.token);
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(session.user));
  configureApi(session.token);
}

export async function loadSession(): Promise<Session | null> {
  const token = await SecureStore.getItemAsync(TOKEN_KEY);
  const rawUser = await SecureStore.getItemAsync(USER_KEY);
  if (!token || !rawUser) {
    configureApi(null);
    return null;
  }

  configureApi(token);
  try {
    return { token, user: JSON.parse(rawUser) as AuthUser };
  } catch {
    return null;
  }
}

export async function clearSession(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY);
  await SecureStore.deleteItemAsync(USER_KEY);
  configureApi(null);
}

export async function login(email: string, password: string): Promise<{
  ok: boolean;
  error?: string;
}> {
  configureApi(null);
  const res = await authApi.login(email, password);
  if (!res.ok) return { ok: false, error: res.error };

  await saveSession({ token: res.data.token, user: res.data.user });
  return { ok: true };
}
