"use client";

import { useState, type FormEvent } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import {
  actualizacionSolicitudAltaComercioPaso1Schema,
  actualizacionSolicitudAltaComercioSchema,
  solicitudAltaComercioPaso1Schema,
  solicitudAltaComercioSchema,
} from "@/lib/validators/auth";
import { PROVINCIAS } from "@/lib/catalogo/categorias";
import { request } from "@/lib/api/httpClient";
import { agregarCallbackUrl } from "@/lib/auth/callback";
import FormField from "@/components/forms/FormField";
import { fieldErrors, focusFirstError } from "@/lib/forms/fieldErrors";

type Step = 1 | 2;
type UbicacionEstado = "idle" | "cargando" | "lista" | "error";

export type DatosSolicitudComercio = {
  nombreTitular: string;
  email: string;
  telefonoTitular: string;
  nombreFantasia: string;
  razonSocial: string;
  cuit: string;
  direccion: string;
  provincia: string;
  localidad: string;
  lat: number;
  lng: number;
  telefonoComercial: string;
  rubro: string;
  categorias: string[];
};

type Props = {
  reintento?: boolean;
  datosIniciales?: DatosSolicitudComercio;
};

type Campo =
  | "nombreTitular"
  | "email"
  | "telefonoTitular"
  | "password"
  | "confirmPassword"
  | "nombreFantasia"
  | "razonSocial"
  | "cuit"
  | "direccion"
  | "provincia"
  | "localidad"
  | "telefonoComercial"
  | "rubro";

export default function SolicitudComercioForm({
  reintento = false,
  datosIniciales,
}: Props) {
  const router = useRouter();
  const [step, setStep] = useState<Step>(1);
  const [form, setForm] = useState({
    nombreTitular: datosIniciales?.nombreTitular ?? "",
    email: datosIniciales?.email ?? "",
    telefonoTitular: datosIniciales?.telefonoTitular ?? "",
    password: "",
    confirmPassword: "",
    nombreFantasia: datosIniciales?.nombreFantasia ?? "",
    razonSocial: datosIniciales?.razonSocial ?? "",
    cuit: datosIniciales?.cuit ?? "",
    direccion: datosIniciales?.direccion ?? "",
    provincia: datosIniciales?.provincia ?? "",
    localidad: datosIniciales?.localidad ?? "",
    lat: datosIniciales?.lat.toFixed(6) ?? "",
    lng: datosIniciales?.lng.toFixed(6) ?? "",
    telefonoComercial: datosIniciales?.telefonoComercial ?? "",
    rubro: datosIniciales?.rubro ?? "",
  });
  const [errores, setErrores] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [ubicacionEstado, setUbicacionEstado] = useState<UbicacionEstado>(
    datosIniciales ? "lista" : "idle",
  );
  const [precision, setPrecision] = useState<number | null>(null);
  const [enviada, setEnviada] = useState(false);

  function setField(campo: Campo, value: string) {
    setForm((prev) => ({ ...prev, [campo]: value }));
    setErrores((prev) => {
      if (!prev[campo]) return prev;
      const next = { ...prev };
      delete next[campo];
      return next;
    });
  }

  function nextStep(e: FormEvent) {
    e.preventDefault();
    setError(null);
    const partial = reintento
      ? actualizacionSolicitudAltaComercioPaso1Schema.safeParse({
          nombreTitular: form.nombreTitular,
          telefonoTitular: form.telefonoTitular,
        })
      : solicitudAltaComercioPaso1Schema.safeParse({
          nombreTitular: form.nombreTitular,
          email: form.email,
          telefonoTitular: form.telefonoTitular,
          password: form.password,
          confirmPassword: form.confirmPassword,
        });
    if (!partial.success) {
      const nextErrors = fieldErrors(partial.error);
      setErrores(nextErrors);
      focusFirstError(nextErrors);
      return;
    }
    setErrores({});
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

  function datosComercio() {
    return {
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
      categorias: datosIniciales?.categorias ?? [],
    };
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

    if (reintento) {
      const parsed = actualizacionSolicitudAltaComercioSchema.safeParse({
        nombreTitular: form.nombreTitular,
        telefonoTitular: form.telefonoTitular,
        ...datosComercio(),
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
        const res = await request("/api/v1/auth/solicitud-comercio", {
          method: "PUT",
          body: JSON.stringify(parsed.data),
        });
        if (!res.ok) {
          setError(res.error);
          setLoading(false);
          return;
        }
        router.push("/comercio/solicitud");
        router.refresh();
      } catch {
        setError("Error inesperado");
        setLoading(false);
      }
      return;
    }

    const parsed = solicitudAltaComercioSchema.safeParse({
      nombreTitular: form.nombreTitular,
      email: form.email,
      telefonoTitular: form.telefonoTitular,
      password: form.password,
      confirmPassword: form.confirmPassword,
      ...datosComercio(),
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
        <h1 className="text-2xl font-semibold">
          {reintento ? "Corregir solicitud de alta" : "Solicitar alta de comercio"}
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          {reintento
            ? "Actualizá los datos y reenviá la solicitud para una nueva revisión."
            : "Tu solicitud será revisada por un administrador antes de habilitar el panel de comercio."}
        </p>
        <p className="mt-1 text-xs text-zinc-500">Paso {step} de 2</p>
      </div>

      {step === 1 ? (
        <form onSubmit={nextStep} noValidate className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Datos del titular</h2>
          <FormField
            id="nombreTitular"
            label="Nombre y apellido del titular"
            autoComplete="name"
            value={form.nombreTitular}
            onChange={(value) => setField("nombreTitular", value)}
            error={errores.nombreTitular}
            required
          />
          {reintento ? (
            <div>
              <p className="text-sm font-medium">Email</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                {form.email}
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                El email y la contraseña de tu cuenta no se modifican.
              </p>
            </div>
          ) : (
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
          )}
          <FormField
            id="telefonoTitular"
            label="Teléfono del titular"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.telefonoTitular}
            onChange={(value) => setField("telefonoTitular", value)}
            error={errores.telefonoTitular}
            required
          />
          {!reintento && (
            <>
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
            </>
          )}
          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <button
            type="submit"
            className="rounded bg-zinc-900 px-4 py-2 text-sm text-white dark:bg-zinc-100 dark:text-zinc-900"
          >
            Siguiente
          </button>
        </form>
      ) : (
        <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Datos del comercio</h2>
          <FormField
            id="nombreFantasia"
            label="Nombre del comercio"
            autoComplete="organization"
            value={form.nombreFantasia}
            onChange={(value) => setField("nombreFantasia", value)}
            error={errores.nombreFantasia}
            required
          />
          <FormField
            id="razonSocial"
            label="Razón social"
            hint="Opcional."
            autoComplete="organization"
            value={form.razonSocial}
            onChange={(value) => setField("razonSocial", value)}
            error={errores.razonSocial}
          />
          <FormField
            id="cuit"
            label="CUIT"
            hint="Opcional. Formato 00-00000000-0 o 00000000000."
            inputMode="numeric"
            autoComplete="off"
            value={form.cuit}
            onChange={(value) => setField("cuit", value)}
            error={errores.cuit}
          />
          <FormField
            id="direccion"
            label="Dirección"
            autoComplete="street-address"
            value={form.direccion}
            onChange={(value) => setField("direccion", value)}
            error={errores.direccion}
            required
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              id="provincia"
              label="Provincia"
              hint="Opcional."
              autoComplete="address-level1"
              value={form.provincia}
              onChange={(value) => setField("provincia", value)}
              error={errores.provincia}
              options={PROVINCIAS}
            />
            <FormField
              id="localidad"
              label="Localidad"
              hint="Opcional."
              autoComplete="address-level2"
              value={form.localidad}
              onChange={(value) => setField("localidad", value)}
              error={errores.localidad}
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

          <FormField
            id="telefonoComercial"
            label="Teléfono comercial"
            type="tel"
            inputMode="tel"
            autoComplete="tel"
            value={form.telefonoComercial}
            onChange={(value) => setField("telefonoComercial", value)}
            error={errores.telefonoComercial}
            required
          />
          <FormField
            id="rubro"
            label="Rubro"
            hint="Opcional."
            autoComplete="off"
            value={form.rubro}
            onChange={(value) => setField("rubro", value)}
            error={errores.rubro}
          />
          {error && (
            <p role="alert" aria-live="polite" className="text-sm text-red-600">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => {
                setErrores({});
                setError(null);
                setStep(1);
              }}
              className="rounded border border-zinc-300 px-4 py-2 text-sm dark:border-zinc-700"
            >
              Volver
            </button>
            <button
              type="submit"
              disabled={loading}
              className="rounded bg-zinc-900 px-4 py-2 text-sm text-white disabled:opacity-60 dark:bg-zinc-100 dark:text-zinc-900"
            >
              {loading
                ? reintento
                  ? "Reenviando..."
                  : "Enviando..."
                : reintento
                  ? "Reenviar solicitud"
                  : "Enviar solicitud"}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
