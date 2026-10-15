"use client";

import { useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { getSession, signIn } from "next-auth/react";
import { ROLES, type Role } from "@/lib/auth/constants";

const PANEL_POR_ROL: Record<Role, string> = {
  [ROLES.CLIENTE]: "/cliente",
  [ROLES.COMERCIO]: "/comercio",
  [ROLES.ADMIN]: "/dashboard",
};

const DEMO = [
  { rol: "Cliente", email: "cliente@obrix.local" },
  { rol: "Comercio", email: "comercio@obrix.local" },
  { rol: "Admin", email: "admin@obrix.local" },
];

export default function IngresarForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl");

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [enviando, setEnviando] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setEnviando(true);

    const res = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    if (!res || res.error) {
      setError("Credenciales inválidas. Revisá el email y la contraseña.");
      setEnviando(false);
      return;
    }

    const session = await getSession();
    const role = (session?.user as { role?: Role } | undefined)?.role;
    const destino = callbackUrl ?? (role ? PANEL_POR_ROL[role] : "/");
    router.push(destino);
    router.refresh();
  }

  return (
    <main className="mx-auto w-full max-w-md flex-1 px-4 py-12">
      <h1 className="text-2xl font-semibold">Ingresar a Obrix</h1>
      <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
        Entrá con tu cuenta para cotizar y gestionar pedidos.
      </p>

      <form onSubmit={onSubmit} className="mt-6 space-y-4">
        <div>
          <label className="block text-sm font-medium" htmlFor="email">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>
        <div>
          <label className="block text-sm font-medium" htmlFor="password">
            Contraseña
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            required
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          />
        </div>

        {error && <p className="text-sm text-red-600">{error}</p>}

        <button
          type="submit"
          disabled={enviando}
          className="w-full rounded bg-zinc-900 px-4 py-2 font-medium text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {enviando ? "Ingresando…" : "Ingresar"}
        </button>
      </form>

      <div className="mt-8 rounded-lg border border-dashed border-zinc-300 p-4 text-sm dark:border-zinc-700">
        <p className="font-medium">Cuentas de demo</p>
        <p className="mt-1 text-zinc-500 dark:text-zinc-400">
          Contraseña para todas: <code className="font-mono">obrix1234</code>
        </p>
        <ul className="mt-2 space-y-1">
          {DEMO.map((cuenta) => (
            <li key={cuenta.email} className="flex items-center justify-between gap-2">
              <span className="text-zinc-600 dark:text-zinc-400">
                {cuenta.rol}: <code className="font-mono">{cuenta.email}</code>
              </span>
              <button
                type="button"
                onClick={() => {
                  setEmail(cuenta.email);
                  setPassword("obrix1234");
                }}
                className="text-blue-600 hover:underline"
              >
                Usar
              </button>
            </li>
          ))}
        </ul>
        <p className="mt-2 text-xs text-amber-600 dark:text-amber-500">
          Solo para demo: no usar estas cuentas en producción.
        </p>
      </div>
    </main>
  );
}
