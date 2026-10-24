import { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import { pedidoApi } from "@shared/api/pedidoClient";
import type { EstadoPedido } from "@shared/validators/pedido";
import type { Pedido } from "@shared/api/pedidoClient";
import { colors, radius } from "@/theme";

const money = new Intl.NumberFormat("es-AR", {
  style: "currency",
  currency: "ARS",
  maximumFractionDigits: 0,
});

const fecha = new Intl.DateTimeFormat("es-AR", {
  dateStyle: "short",
  timeStyle: "short",
});

const ESTADO_COLOR: Record<EstadoPedido, string> = {
  PENDIENTE: "#b45309",
  CONFIRMADO: "#1d4ed8",
  PREPARADO: "#4338ca",
  ENTREGADO: colors.success,
  CANCELADO: colors.danger,
};

export default function PedidosScreen() {
  const router = useRouter();
  const [pedidos, setPedidos] = useState<Pedido[]>([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [accionando, setAccionando] = useState<string | null>(null);

  const cargar = useCallback(async () => {
    setError(null);
    const res = await pedidoApi.listar();
    if (res.ok) setPedidos(res.data);
    else setError(res.error);
  }, []);

  useEffect(() => {
    cargar().finally(() => setCargando(false));
  }, [cargar]);

  const refrescar = useCallback(async () => {
    setRefrescando(true);
    await cargar();
    setRefrescando(false);
  }, [cargar]);

  async function cancelar(id: string) {
    setError(null);
    setAccionando(id);
    const res = await pedidoApi.cancelar(id);
    setAccionando(null);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    await cargar();
  }

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refrescando} onRefresh={refrescar} />
        }
      >
        <Pressable onPress={() => router.push("/")} style={styles.volver}>
          <Text style={styles.volverText}>‹ Volver al asistente</Text>
        </Pressable>

        <Text style={styles.title}>Mis pedidos</Text>

        {cargando ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : pedidos.length === 0 ? (
          <Text style={styles.empty}>Todavía no hiciste pedidos.</Text>
        ) : (
          pedidos.map((p) => (
            <View key={p.id} style={styles.card}>
              <View style={styles.cardHeader}>
                <View style={styles.flex}>
                  <Text style={styles.nombre}>{p.comercio.nombre}</Text>
                  <Text style={styles.meta}>
                    {fecha.format(new Date(p.createdAt))}
                  </Text>
                </View>
                <Text style={[styles.estado, { color: ESTADO_COLOR[p.estado] }]}>
                  {p.estado}
                </Text>
              </View>

              <Text style={styles.total}>{money.format(p.total)}</Text>

              {p.items.map((it) => (
                <View key={it.id} style={styles.row}>
                  <Text style={styles.item}>
                    {it.cantidad} {it.producto.unidad} · {it.producto.nombre}
                  </Text>
                  <Text style={styles.itemPrecio}>
                    {money.format(it.cantidad * it.precioUnitario)}
                  </Text>
                </View>
              ))}

              {p.estado === "PENDIENTE" ? (
                <Pressable
                  style={[styles.cancelar, accionando === p.id && styles.disabled]}
                  onPress={() => cancelar(p.id)}
                  disabled={accionando === p.id}
                >
                  <Text style={styles.cancelarText}>
                    {accionando === p.id ? "Cancelando…" : "Cancelar pedido"}
                  </Text>
                </Pressable>
              ) : null}
            </View>
          ))
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  volver: { paddingVertical: 4, alignSelf: "flex-start" },
  volverText: { color: colors.accent, fontWeight: "600", fontSize: 15 },
  title: {
    fontSize: 22,
    fontWeight: "800",
    color: colors.text,
    marginTop: 8,
    marginBottom: 16,
  },
  center: { paddingVertical: 60, alignItems: "center" },
  empty: { color: colors.muted, fontSize: 15, paddingVertical: 20 },
  error: { color: colors.danger, paddingVertical: 20 },
  flex: { flex: 1 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  nombre: { fontSize: 16, fontWeight: "700", color: colors.text },
  meta: { color: colors.muted, fontSize: 12, marginTop: 2 },
  estado: { fontSize: 12, fontWeight: "700" },
  total: {
    fontSize: 17,
    fontWeight: "800",
    color: colors.text,
    marginTop: 8,
    marginBottom: 6,
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 12,
  },
  item: { fontSize: 14, color: colors.text, flex: 1 },
  itemPrecio: { fontSize: 14, color: colors.muted },
  cancelar: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: colors.danger,
    borderRadius: radius,
    paddingVertical: 10,
    alignItems: "center",
  },
  cancelarText: { color: colors.danger, fontWeight: "700", fontSize: 14 },
  disabled: { opacity: 0.6 },
});
