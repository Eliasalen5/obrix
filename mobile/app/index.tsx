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
import { asistenteApi } from "@shared/api/asistenteClient";
import { DESCRIPCION_MIN, type AsistenteResponse } from "@shared/validators/asistente";
import { useAuth } from "@/auth/AuthProvider";
import { colors, radius } from "@/theme";

export default function AsistenteScreen() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const [descripcion, setDescripcion] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resultado, setResultado] = useState<AsistenteResponse | null>(null);

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

  function irACotizar() {
    if (!resultado) return;
    const materiales = resultado.materiales.map((m) => ({
      nombre: m.nombre,
      cantidad: m.cantidad,
      unidad: m.unidad,
    }));
    router.push({
      pathname: "/cotizacion",
      params: { materiales: JSON.stringify(materiales), prompt: resultado.titulo },
    });
  }

  return (
    <SafeAreaView style={styles.safe} edges={["top"]}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <View>
            <Text style={styles.hi}>Hola, {user?.name ?? "cliente"}</Text>
            <Text style={styles.title}>¿Qué querés construir?</Text>
          </View>
          <Pressable onPress={logout}>
            <Text style={styles.logout}>Salir</Text>
          </Pressable>
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
  },
  hi: { color: colors.muted, fontSize: 14 },
  title: { fontSize: 22, fontWeight: "800", color: colors.text, marginTop: 2 },
  logout: { color: colors.accent, fontWeight: "600", padding: 4 },
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
