import { request } from "./httpClient";

const BASE = "/api/v1/auth";

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: string;
};

export type TokenResponse = {
  token: string;
  expiresIn: number;
  user: AuthUser;
};

export const authApi = {
  /** Login por credenciales; devuelve el JWT para usar como Bearer (mobile). */
  login: (email: string, password: string) =>
    request<TokenResponse>(`${BASE}/token`, {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }),
};

export type { ApiResult } from "./httpClient";
