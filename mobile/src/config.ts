import Constants from "expo-constants";

/**
 * URL base del API de Obrix. En desarrollo apuntamos al server local de Next.
 *
 * - Emulador Android: 10.0.2.2 apunta al host.
 * - Dispositivo físico: usar la IP LAN de la máquina (configurar EXPO_PUBLIC_API_URL).
 * - Producción: la URL de Vercel.
 */
function resolveApiUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_API_URL;
  if (fromEnv) return fromEnv.replace(/\/$/, "");

  const hostUri = Constants.expoConfig?.hostUri;
  const host = hostUri?.split(":")[0];
  if (host) return `http://${host}:3000`;

  return "http://localhost:3000";
}

export const API_URL = resolveApiUrl();
