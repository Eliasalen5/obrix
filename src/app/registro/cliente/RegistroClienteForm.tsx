"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import { registroClienteSchema } from "@/lib/validators/auth";
import { request } from "@/lib/api/httpClient";
import { agregarCallbackUrl, resolverCallbackUrl } from "@/lib/auth/callback";
import FormField from "@/components/forms/FormField";
import { fieldErrors, focusFirstError } from "@/lib/forms/fieldErrors";

type Campo =
  | "nombre"
  | "email"
  | "telefono"
  | "password"
  | "confirmPassword";

export default function RegistroClienteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = resolverCallbackUrl(
    searchParams.get("callbackUrl"),
    "/cliente",
  );

  const [form, setForm] = useState({
    nombre: "",
    email: "",
    telefono: "",
    password: "",
    confirmPassword: "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  function setField(campo: Campo, value: string) {
    setForm((prev) => ({ ...prev, [campo]: value }));
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }

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
      const nextErrors = fieldErrors(parsed.error);
      setErrores(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    setErrores({});

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
      router.push(callbackUrl);
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
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
        <FormField
          id="nombre"
          label="Nombre completo"
          autoComplete="name"
          value={form.nombre}
          onChange={(value) => setField("nombre", value)}
          error={errores.nombre}
          required
        />
        <FormField
          id="email"
          label="Email"
          type="email"
          autoComplete="email"
          autoCapitalize="none"
          spellCheck={false}
          value={form.email}
          onChange={(value) => setField("email", value)}
          error={errores.email}
          required
        />
        <FormField
          id="telefono"
          label="Teléfono"
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          hint="Opcional. Lo usamos para contactarte por tu pedido."
          value={form.telefono}
          onChange={(value) => setField("telefono", value)}
          error={errores.telefono}
        />
        <FormField
          id="password"
          label="Contraseña"
          type="password"
          autoComplete="new-password"
          hint="Mínimo 8 caracteres."
          value={form.password}
          onChange={(value) => setField("password", value)}
          error={errores.password}
          required
        />
        <FormField
          id="confirmPassword"
          label="Confirmar contraseña"
          type="password"
          autoComplete="new-password"
          value={form.confirmPassword}
          onChange={(value) => setField("confirmPassword", value)}
          error={errores.confirmPassword}
          required
        />
        {error && (
          <p role="alert" aria-live="polite" className="text-sm text-red-600">
            {error}
          </p>
        )}
        <button
          type="submit"
          disabled={loading}
          className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
        >
          {loading ? "Creando cuenta..." : "Crear cuenta"}
        </button>
      </form>
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        ¿Ya tenés cuenta?{" "}
        <a
          className="text-blue-600 hover:underline"
          href={agregarCallbackUrl("/ingresar", callbackUrl)}
        >
          Ingresar
        </a>
      </p>
    </div>
  );
}
