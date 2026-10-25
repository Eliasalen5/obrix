"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { registroClienteSchema } from "@/lib/validators/auth";
import { request } from "@/lib/api/httpClient";

export default function RegistroClientePage() {
  const router = useRouter();
  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    const parsed = registroClienteSchema.safeParse({
      nombre: form.nombre,
      email: form.email,
      telefono: form.telefono || undefined,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setLoading(true);
    try {
      const res = await request("/api/v1/auth/registro-cliente", {
        method: "POST",
        body: JSON.stringify(parsed.data),
      });
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }

      const login = await signIn("credentials", {
        email: parsed.data.email,
        password: parsed.data.password,
        redirect: false,
      });
      if (login?.error) {
        setError("Cuenta creada, pero no se pudo iniciar sesión. Probá desde ingresar.");
        setLoading(false);
        return;
      }
      router.push("/cliente");
      router.refresh();
    } catch {
      setError("Error inesperado");
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex max-w-md flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Crear cuenta cliente</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Registrate para armar tu proyecto y comparar cotizaciones.
        </p>
      </div>
      <form onSubmit={onSubmit} className="flex flex-col gap-3">
        <input
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Nombre completo"
          value={form.nombre}
          onChange={(e) => setForm({ ...form, nombre: e.target.value })}
          required
        />
        <input
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
          required
        />
        <input
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          placeholder="Teléfono (opcional)"
          value={form.telefono}
          onChange={(e) => setForm({ ...form, telefono: e.target.value })}
        />
        <input
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          type="password"
          placeholder="Contraseña (mínimo 8 caracteres)"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
          required
        />
        <input
          className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
          type="password"
          placeholder="Confirmar contraseña"
          value={form.confirmPassword}
          onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          required
        />
        {error && <p className="text-sm text-red-600">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tenés cuenta? <a className="text-blue-600 hover:underline" href="/ingresar">Ingresar</a>
      </p>
    </div>
  );
}
