"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { solicitudAltaComercioSchema } from "@/lib/validators/auth";
import { request } from "@/lib/api/httpClient";
import { agregarCallbackUrl } from "@/lib/auth/callback";

type Step = 1 | 2;
type UbicacionEstado = "idle" | "cargando" | "lista" | "error";

export default function RegistroComercioPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    nombreTitular: "",
    email: "",
    telefonoTitular: "",
    password: "",
    confirmPassword: "",
    nombreFantasia: "",
    razonSocial: "",
    cuit: "",
    direccion: "",
    provincia: "",
    localidad: "",
    lat: "",
    lng: "",
    telefonoComercial: "",
    rubro: "",
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ubicacionEstado, setUbicacionEstado] =
    useState<UbicacionEstado>("idle");
  const [precision, setPrecision] = useState<number | null>(null);
  const [enviada, setEnviada] = useState(false);

  function nextStep() {
    setError(null);
    const partial = solicitudAltaComercioSchema.partial({
      nombreFantasia: true,
      direccion: true,
      lat: true,
      lng: true,
      telefonoComercial: true,
    }).safeParse({
      nombreTitular: form.nombreTitular,
      email: form.email,
      telefonoTitular: form.telefonoTitular,
      password: form.password,
      confirmPassword: form.confirmPassword,
    });
    if (!partial.success) {
      setError(partial.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }
    setStep(2);
  }

  function usarUbicacion() {
    setError(null);
    setPrecision(null);

    if (!navigator.geolocation) {
      setUbicacionEstado("error");
      setError(
        "Tu navegador no permite obtener la ubicación. Probá con un navegador actualizado.",
      );
      return;
    }

    setUbicacionEstado("cargando");
    navigator.geolocation.getCurrentPosition(
      (posicion) => {
        setForm((prev) => ({
          ...prev,
          lat: posicion.coords.latitude.toFixed(6),
          lng: posicion.coords.longitude.toFixed(6),
        }));
        setPrecision(posicion.coords.accuracy);
        setUbicacionEstado("lista");
      },
      (err) => {
        setUbicacionEstado("error");
        if (err.code === err.PERMISSION_DENIED) {
          setError(
            "No diste permiso para usar tu ubicación. Habilitalo desde el candado del navegador y volvé a intentar.",
          );
          return;
        }
        if (err.code === err.TIMEOUT) {
          setError(
            "Tardamos demasiado en obtener tu ubicación. Probá de nuevo.",
          );
          return;
        }
        setError(
          "No pudimos obtener tu ubicación. Revisá que el GPS esté activo y volvé a intentar.",
        );
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
    );
  }

  async function onSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);

    if (!form.lat.trim() || !form.lng.trim()) {
      setError(
        "Necesitamos la ubicación del comercio. Tocá “Usar mi ubicación” antes de enviar.",
      );
      return;
    }

    const parsed = solicitudAltaComercioSchema.safeParse({
      nombreTitular: form.nombreTitular,
      email: form.email,
      telefonoTitular: form.telefonoTitular,
      password: form.password,
      confirmPassword: form.confirmPassword,
      nombreFantasia: form.nombreFantasia,
      razonSocial: form.razonSocial || undefined,
      cuit: form.cuit || undefined,
      direccion: form.direccion,
      provincia: form.provincia || undefined,
      localidad: form.localidad || undefined,
      lat: form.lat.trim() ? Number(form.lat) : undefined,
      lng: form.lng.trim() ? Number(form.lng) : undefined,
      telefonoComercial: form.telefonoComercial,
      rubro: form.rubro || undefined,
      categorias: [],
    });
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message ?? "Datos inválidos");
      return;
    }

    setLoading(true);
    try {
      const res = await request("/api/v1/auth/solicitud-comercio", {
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
      }).catch(() => null);

      if (!login || login.error) {
        setEnviada(true);
        setLoading(false);
        return;
      }

      router.push("/comercio/solicitud");
      router.refresh();
    } catch {
      setError("Error inesperado");
      setLoading(false);
    }
  }

  if (enviada) {
    return (
      <div className="mx-auto flex max-w-2xl flex-col gap-4 p-6">
        <h1 className="text-2xl font-semibold">Solicitud enviada</h1>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Recibimos tu solicitud para sumar tu comercio. Quedó pendiente de
          revisión por un administrador.
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Ingresá con <strong>{form.email}</strong> para ver el estado.
        </p>
        <a
          className="text-sm text-blue-600 hover:underline"
          href={agregarCallbackUrl("/ingresar", "/comercio/solicitud")}
        >
          Ver estado de mi solicitud
        </a>
      </div>
    );
  }

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Solicitar alta de comercio</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Tu solicitud será revisada por un administrador antes de habilitar el panel de comercio.
        </p>
        <p className="mt-1 text-xs text-zinc-500">Paso {step} de 2</p>
      </div>

      {step === 1 ? (
        <div className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Datos del titular</h2>
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Nombre y apellido del titular"
            value={form.nombreTitular}
            onChange={(e) => setForm({ ...form, nombreTitular: e.target.value })}
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            type="email"
            placeholder="Email"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Teléfono del titular"
            value={form.telefonoTitular}
            onChange={(e) => setForm({ ...form, telefonoTitular: e.target.value })}
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            type="password"
            placeholder="Contraseña (mínimo 8 caracteres)"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            type="password"
            placeholder="Confirmar contraseña"
            value={form.confirmPassword}
            onChange={(e) => setForm({ ...form, confirmPassword: e.target.value })}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <button
            type="button"
            onClick={nextStep}
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Siguiente
          </button>
        </div>
      ) : (
        <form onSubmit={onSubmit} className="flex flex-col gap-3">
          <h2 className="text-lg font-medium">Datos del comercio</h2>
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Nombre de fantasía"
            value={form.nombreFantasia}
            onChange={(e) => setForm({ ...form, nombreFantasia: e.target.value })}
            required
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Razón social (opcional)"
            value={form.razonSocial}
            onChange={(e) => setForm({ ...form, razonSocial: e.target.value })}
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="CUIT (00-00000000-0 o 00000000000, opcional)"
            value={form.cuit}
            onChange={(e) => setForm({ ...form, cuit: e.target.value })}
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Dirección completa"
            value={form.direccion}
            onChange={(e) => setForm({ ...form, direccion: e.target.value })}
            required
          />
          <div className="grid grid-cols-2 gap-2">
            <input
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Provincia (opcional)"
              value={form.provincia}
              onChange={(e) => setForm({ ...form, provincia: e.target.value })}
            />
            <input
              className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
              placeholder="Localidad (opcional)"
              value={form.localidad}
              onChange={(e) => setForm({ ...form, localidad: e.target.value })}
            />
          </div>

          <div className="rounded-lg border border-zinc-200 p-3 text-sm dark:border-zinc-800">
            <p className="font-medium">Ubicación del comercio</p>
            <p className="mt-1 text-xs text-zinc-500">
              La usamos para mostrar tu comercio a clientes cercanos. Parado en
              el local, tocá el botón para detectarla.
            </p>
            <button
              type="button"
              onClick={usarUbicacion}
              disabled={ubicacionEstado === "cargando"}
              className="mt-2 rounded border border-zinc-300 px-3 py-1.5 text-sm hover:bg-zinc-100 disabled:opacity-60 dark:border-zinc-700 dark:hover:bg-zinc-800"
            >
              {ubicacionEstado === "cargando"
                ? "Obteniendo ubicación…"
                : ubicacionEstado === "lista"
                  ? "Volver a detectar"
                  : "Usar mi ubicación"}
            </button>
            {ubicacionEstado === "lista" && form.lat && form.lng && (
              <p className="mt-2 text-xs text-green-700 dark:text-green-400">
                Ubicación lista ({form.lat}, {form.lng})
                {precision !== null
                  ? ` · precisión aproximada ±${Math.round(precision)} m`
                  : ""}
              </p>
            )}
            {ubicacionEstado === "error" && (
              <p className="mt-2 text-xs text-red-600">
                No pudimos detectar la ubicación. Podés reintentar.
              </p>
            )}
          </div>

          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Teléfono comercial"
            value={form.telefonoComercial}
            onChange={(e) => setForm({ ...form, telefonoComercial: e.target.value })}
            required
          />
          <input
            className="rounded border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-700 dark:bg-zinc-900"
            placeholder="Rubro (opcional)"
            value={form.rubro}
            onChange={(e) => setForm({ ...form, rubro: e.target.value })}
          />
          {error && <p className="text-sm text-red-600">{error}</p>}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading ? "Enviando..." : "Enviar solicitud"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
