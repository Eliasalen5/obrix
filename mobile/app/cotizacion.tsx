import { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useLocalSearchParams } from "expo-router";
import { cotizacionApi } from "@shared/api/cotizacionClient";
import type {
  CotizacionResponse,
  MaterialInput,
} from "@shared/validators/cotizacion";
import { colors, radius } from "@/theme";

function parseMateriales(raw: string | string[] | undefined): MaterialInput[] {
  if (typeof raw !== "string") return [];
  try {
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as MaterialInput[]) : [];
  } catch {
    return [];
  }
}

export default function CotizacionScreen() {
  const params = useLocalSearchParams<{ materiales?: string; prompt?: string }>();
  const [materiales] = useState(() => parseMateriales(params.materiales));
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<CotizacionResponse | null>(null);

  useEffect(() => {
    let activo = true;
    async function cargar() {
      if (materiales.length === 0) {
        setError("No hay materiales para cotizar.");
        setLoading(false);
        return;
      }
      const res = await cotizacionApi.crear({
        prompt: typeof params.prompt === "string" ? params.prompt : undefined,
        materiales,
      });
      if (!activo) return;
      if (!res.ok) {
        setError(res.error);
      } else {
        setData(res.data);
      }
      setLoading(false);
    }
    cargar();
    return () => {
      activo = false;
    };
  }, [materiales, params.prompt]);

  return (
    <SafeAreaView style={styles.safe} edges={["bottom"]}>
      <ScrollView contentContainerStyle={styles.content}>
        {loading ? (
          <View style={styles.center}>
            <ActivityIndicator color={colors.accent} size="large" />
            <Text style={styles.loadingText}>Comparando precios...</Text>
          </View>
        ) : error ? (
          <Text style={styles.error}>{error}</Text>
        ) : data ? (
          <>
            <Text style={styles.section}>
              {data.comparacion.comercios.length} ferreterías comparadas
            </Text>

            {data.comparacion.comercios.map((c) => (
              <View key={c.comercioId} style={styles.card}>
                <View style={styles.cardHeader}>
                  <Text style={styles.nombre}>{c.nombre}</Text>
                  <Text style={styles.total}>${c.total.toLocaleString("es-AR")}</Text>
                </View>
                <Text style={styles.meta}>
                  {c.itemsCubiertos}/{c.itemsTotales} ítems
                  {c.distanciaKm != null ? ` · ${c.distanciaKm.toFixed(1)} km` : ""}
                </Text>
                {c.detalle.map((d) => (
                  <View key={d.materialId} style={styles.row}>
                    <Text style={styles.item}>
                      {d.cantidad} {d.unidad} · {d.nombre}
                    </Text>
                    <Text style={styles.itemPrecio}>${d.subtotal.toLocaleString("es-AR")}</Text>
                  </View>
                ))}
                {c.faltantes.length > 0 ? (
                  <Text style={styles.faltante}>
                    No tiene: {c.faltantes.map((f) => f.nombre).join(", ")}
                  </Text>
                ) : null}
              </View>
            ))}

            {data.comparacion.advertencias.map((a, i) => (
              <Text key={i} style={styles.aviso}>
                {a}
              </Text>
            ))}
          </>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  center: { alignItems: "center", paddingVertical: 60 },
  loadingText: { color: colors.muted, marginTop: 12 },
  section: { fontSize: 15, fontWeight: "700", color: colors.text, marginBottom: 12 },
  error: { color: colors.danger, textAlign: "center", paddingVertical: 40 },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  nombre: { fontSize: 16, fontWeight: "700", color: colors.text, flex: 1 },
  total: { fontSize: 16, fontWeight: "800", color: colors.accent },
  meta: { color: colors.muted, fontSize: 13, marginTop: 4, marginBottom: 8 },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 5,
    borderTopWidth: 1,
    borderTopColor: colors.border,
  },
  item: { fontSize: 14, color: colors.text, flex: 1 },
  itemPrecio: { fontSize: 14, color: colors.muted },
  faltante: { color: colors.danger, fontSize: 12, marginTop: 8 },
  aviso: { color: colors.muted, fontSize: 12, marginTop: 6, fontStyle: "italic" },
});
