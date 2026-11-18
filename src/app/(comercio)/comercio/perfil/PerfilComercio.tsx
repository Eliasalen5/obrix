"use client";

import { useCallback, useEffect, useState } from "react";
import {
  comercioPerfilApi,
  type PerfilComercio as Perfil,
} from "@/lib/api/comercioClient";
import { updatePerfilComercioSchema } from "@/lib/validators/comercio";
import {
  Alert,
  Badge,
  Button,
  Card,
  CardHeader,
  Field,
  Input,
  SkeletonRows,
} from "@/components/ui";

type Form = {
  nombre: string;
  telefono: string;
  direccion: string;
  localidad: string;
  provincia: string;
  lat: string;
  lng: string;
};

function aForm(p: Perfil): Form {
  return {
    nombre: p.nombre,
    telefono: p.telefono,
    direccion: p.direccion,
    localidad: p.localidad,
    provincia: p.provincia,
    lat: String(p.lat),
    lng: String(p.lng),
  };
}

export default function PerfilComercio() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [form, setForm] = useState<Form | null>(null);
  const [cargando, setCargando] = useState(true);
  const [guardando, setGuardando] = useState(false);
  const [geolocalizando, setGeolocalizando] = useState(false);
  const [mensaje, setMensaje] = useState<
    { tipo: "ok" | "error"; texto: string } | null
  >(null);

  const cargar = useCallback(async () => {
    setCargando(true);
    const res = await comercioPerfilApi.get();
    if (res.ok) {
      setPerfil(res.data);
      setForm(aForm(res.data));
    } else {
      setMensaje({ tipo: "error", texto: res.error });
    }
    setCargando(false);
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  const actualizar = useCallback((campo: keyof Form, valor: string) => {
    setForm((prev) => (prev ? { ...prev, [campo]: valor } : prev));
  }, []);

  const usarUbicacion = useCallback(() => {
    if (typeof navigator === "undefined" || !navigator.geolocation) {
      setMensaje({ tipo: "error", texto: "Geolocalización no disponible" });
      return;
    }
    setGeolocalizando(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setForm((prev) =>
          prev
            ? {
                ...prev,
                lat: pos.coords.latitude.toFixed(6),
                lng: pos.coords.longitude.toFixed(6),
              }
            : prev,
        );
        setGeolocalizando(false);
      },
      () => {
        setMensaje({
          tipo: "error",
          texto: "No pudimos obtener tu ubicación. Revisá los permisos.",
        });
        setGeolocalizando(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  const guardar = useCallback(async () => {
    if (!form) return;
    const parsed = updatePerfilComercioSchema.safeParse({
      nombre: form.nombre,
      telefono: form.telefono,
      direccion: form.direccion,
      localidad: form.localidad,
      provincia: form.provincia,
      lat: form.lat,
      lng: form.lng,
    });
    if (!parsed.success) {
      setMensaje({
        tipo: "error",
        texto: parsed.error.issues
          .map((i) => `${i.path.join(".") || "campo"}: ${i.message}`)
          .join(" | "),
      });
      return;
    }
    setGuardando(true);
    setMensaje(null);
    const res = await comercioPerfilApi.update(parsed.data);
    setGuardando(false);
    if (!res.ok) {
      setMensaje({
        tipo: "error",
        texto: res.details?.length
          ? `${res.error}: ${res.details.map((d) => d.message).join(" | ")}`
          : res.error,
      });
      return;
    }
    setPerfil(res.data);
    setForm(aForm(res.data));
    setMensaje({ tipo: "ok", texto: "Perfil actualizado" });
  }, [form]);

  if (cargando || !form) {
    return (
      <Card>
        <SkeletonRows rows={6} />
      </Card>
    );
  }

  return (
    <div className="space-y-5">
      {mensaje ? (
        <Alert tone={mensaje.tipo === "ok" ? "success" : "error"}>
          {mensaje.texto}
        </Alert>
      ) : null}

      <Card>
        <CardHeader
          title="Datos del comercio"
          description="Esta información es la que ven los clientes al cotizar."
          action={
            perfil ? (
              <Badge tone={perfil.activo ? "success" : "danger"} dot>
                {perfil.activo ? "Activo" : "Inactivo"}
              </Badge>
            ) : null
          }
        />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="Nombre comercial" required className="sm:col-span-2">
            <Input
              value={form.nombre}
              onChange={(e) => actualizar("nombre", e.target.value)}
            />
          </Field>
          <Field label="Teléfono">
            <Input
              value={form.telefono}
              onChange={(e) => actualizar("telefono", e.target.value)}
            />
          </Field>
          <Field label="Provincia">
            <Input
              value={form.provincia}
              onChange={(e) => actualizar("provincia", e.target.value)}
            />
          </Field>
          <Field label="Dirección" required className="sm:col-span-2">
            <Input
              value={form.direccion}
              onChange={(e) => actualizar("direccion", e.target.value)}
            />
          </Field>
          <Field label="Localidad">
            <Input
              value={form.localidad}
              onChange={(e) => actualizar("localidad", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <Card>
        <CardHeader
          title="Ubicación"
          description="Se usa para mostrar tu comercio en el mapa y calcular distancias."
          action={
            <Button
              size="sm"
              variant="outline"
              loading={geolocalizando}
              onClick={usarUbicacion}
            >
              Usar mi ubicación
            </Button>
          }
        />
        <div className="grid grid-cols-1 gap-4 p-5 sm:grid-cols-2">
          <Field label="Latitud" required>
            <Input
              inputMode="decimal"
              value={form.lat}
              onChange={(e) => actualizar("lat", e.target.value)}
            />
          </Field>
          <Field label="Longitud" required>
            <Input
              inputMode="decimal"
              value={form.lng}
              onChange={(e) => actualizar("lng", e.target.value)}
            />
          </Field>
        </div>
      </Card>

      <div className="flex justify-end">
        <Button loading={guardando} onClick={() => void guardar()}>
          Guardar cambios
        </Button>
      </div>
    </div>
  );
}
