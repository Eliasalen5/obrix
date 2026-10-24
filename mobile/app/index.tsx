import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  StyleSheet,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { useRouter } from "expo-router";
import * as Location from "expo-location";
import { asistenteApi } from "@shared/api/asistenteClient";
import { DESCRIPCION_MIN, type AsistenteResponse } from "@shared/validators/asistente";
import type { Ubicacion } from "@shared/validators/cotizacion";
import { useAuth } from "@/auth/AuthProvider";
import { colors, radius } from "@/theme";

export default function AsistenteScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<AsistenteResponse | null>(null);
  const [ubicacion, setUbicacion] = useState<Ubicacion | null>(null);
  const [ubicacionError, setUbicacionError] = useState<string | null>(null);
  const [obteniendoUbicacion, setObteniendoUbicacion] = useState(false);

  const puedeEnviar = descripcion.trim().length >= DESCRIPCION_MIN && !loading;

  async function onEstimar() {
    setError(null);
    setLoading(true);
    const res = await asistenteApi.estimar(descripcion.trim());
    setLoading(false);
    if (!res.ok) {
      setError(res.error);
      return;
    }
    setResultado(res.data);
  }

  async function usarUbicacion() {
    setUbicacionError(null);
    setObteniendoUbicacion(true);
    try {
      const permiso = await Location.requestForegroundPermissionsAsync();
      if (!permiso.granted) {
        setUbicacionError("Permiso de ubicación denegado.");
        return;
      }
      const pos = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      setUbicacion({
        lat: pos.coords.latitude,
        lng: pos.coords.longitude,
      });
    } catch {
      setUbicacionError("No pudimos obtener tu ubicación. Podés cotizar igual.");
    } finally {
      setObteniendoUbicacion(false);
    }
  }

  function irACotizar() {
    if (!resultado) return;
    const materiales = resultado.materiales.map((m) => ({
      nombre: m.nombre,
      cantidad: m.cantidad,
      unidad: m.unidad,
    }));
    router.push({
      pathname: "/cotizacion",
      params: {
        materiales: JSON.stringify(materiales),
        prompt: resultado.titulo,
        ...(ubicacion ? { ubicacion: JSON.stringify(ubicacion) } : {}),
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View style={styles.flex}>
            <Text style={styles.hi}>Hola, {user?.name ?? "cliente"}</Text>
            <Text style={styles.title}>¿Qué querés construir?</Text>
          </View>
          <View style={styles.headerActions}>
            <Pressable onPress={() => router.push("/pedidos")}>
              <Text style={styles.link}>Pedidos</Text>
            </Pressable>
            <Pressable onPress={logout}>
              <Text style={styles.link}>Salir</Text>
            </Pressable>
          </View>
        </View>

        <TextInput
          style={styles.textarea}
          placeholder="Ej: una parrilla de 1,5 m con ladrillo común y hierro ángulo..."
          placeholderTextColor={colors.muted}
          multiline
          value={descripcion}
          onChangeText={setDescripcion}
        />
        <Text style={styles.hint}>Mínimo {DESCRIPCION_MIN} caracteres</Text>

        <Pressable style={styles.ubicacion} onPress={usarUbicacion} disabled={obteniendoUbicacion}>
          {obteniendoUbicacion ? (
            <ActivityIndicator color={colors.accent} size="small" />
          ) : (
            <Text style={styles.ubicacionText}>
              {ubicacion
                ? `Ubicación lista: ${ubicacion.lat.toFixed(3)}, ${ubicacion.lng.toFixed(3)}`
                : "Usar mi ubicación (opcional, ordena por cercanía)"}
            </Text>
          )}
        </Pressable>
        {ubicacionError ? <Text style={styles.error}>{ubicacionError}</Text> : null}

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <Pressable
          style={[styles.button, !puedeEnviar && styles.buttonDisabled]}
          onPress={onEstimar}
          disabled={!puedeEnviar}
        >
          {loading ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.buttonText}>Estimar materiales</Text>
          )}
        </Pressable>

        {resultado ? (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{resultado.titulo}</Text>
            {resultado.materiales.map((m, i) => (
              <View key={i} style={styles.row}>
                <Text style={styles.material}>
                  {m.cantidad} {m.unidad} · {m.nombre}
                </Text>
              </View>
            ))}
            {resultado.aclaraciones.length > 0 ? (
              <Text style={styles.aviso}>{resultado.aclaraciones.join(" · ")}</Text>
            ) : null}

            <Pressable style={[styles.button, styles.buttonAlt]} onPress={irACotizar}>
              <Text style={styles.buttonText}>Cotizar precios</Text>
            </Pressable>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
    marginBottom: 20,
    gap: 12,
  },
  flex: { flex: 1 },
  hi: { color: colors.muted, fontSize: 14 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 2 },
  headerActions: { flexDirection: "row", gap: 14, paddingTop: 2 },
  link: { color: colors.accent, fontWeight: "600", padding: 4 },
  ubicacion: {
    paddingVertical: 6,
    marginBottom: 8,
  },
  ubicacionText: { color: colors.accent, fontSize: 13, fontWeight: "600" },
  textarea: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    minHeight: 120,
    fontSize: 16,
    textAlignVertical: "top",
    color: colors.text,
    borderWidth: 1,
    borderColor: colors.border,
  },
  hint: { color: colors.muted, fontSize: 12, marginTop: 6, marginBottom: 12 },
  error: { color: colors.danger, marginBottom: 8 },
  button: {
    backgroundColor: colors.accent,
    borderRadius: radius,
    paddingVertical: 15,
    alignItems: "center",
  },
  buttonAlt: { marginTop: 16, backgroundColor: colors.primary },
  buttonDisabled: { opacity: 0.5 },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius,
    padding: 16,
    marginTop: 20,
    borderWidth: 1,
    borderColor: colors.border,
  },
  cardTitle: { fontSize: 17, fontWeight: "700", color: colors.text, marginBottom: 10 },
  row: { paddingVertical: 6, borderBottomWidth: 1, borderBottomColor: colors.border },
  material: { fontSize: 15, color: colors.text },
  aviso: { color: colors.muted, fontSize: 12, marginTop: 12, fontStyle: "italic" },
});
