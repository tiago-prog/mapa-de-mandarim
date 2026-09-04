import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { Modal, Platform, Pressable, StyleSheet, Text, View } from "react-native";

import type { User } from "@/lib/_core/auth";
import { useColors } from "@/hooks/use-colors";
import { AppButton } from "./app-button";

export function AvatarMenu({ user, onLogout }: { user: User | null; onLogout: () => Promise<void> | void }) {
  const colors = useColors();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);
  const displayName = user?.name?.trim() || user?.email?.split("@")[0] || "Sua conta";
  const avatar = displayName === "Sua conta" ? "?" : displayName.slice(0, 1).toUpperCase();

  useEffect(() => {
    if (Platform.OS !== "web" || !open) return;
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        setConfirming(false);
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const close = () => {
    if (loggingOut) return;
    setOpen(false);
    setConfirming(false);
  };

  const confirmLogout = async () => {
    if (loggingOut) return;
    setLoggingOut(true);
    try {
      await onLogout();
      setOpen(false);
      setConfirming(false);
    } finally {
      setLoggingOut(false);
    }
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen((value) => !value)}
        accessibilityRole="button"
        accessibilityLabel={`Abrir menu da conta de ${displayName}`}
        accessibilityHint="Mostra configurações, ajuda, administração e sair"
        accessibilityState={{ expanded: open }}
        style={({ pressed }) => [styles.avatar, { backgroundColor: colors.foreground, opacity: pressed ? 0.8 : 1 }]}
      >
        <Text style={[styles.avatarText, { color: colors.background }]}>{avatar}</Text>
      </Pressable>

      <Modal transparent visible={open} animationType="fade" onRequestClose={close} accessibilityViewIsModal>
        <Pressable style={styles.backdrop} onPress={close} accessibilityLabel="Fechar menu da conta">
          <Pressable
            onPress={(event) => event.stopPropagation()}
            accessibilityRole="menu"
            style={[styles.menu, { backgroundColor: colors.surface, borderColor: colors.border }]}
          >
            {confirming ? (
              <View accessible accessibilityLabel="Confirmar saída da conta" style={styles.confirmContent}>
                <Text style={[styles.menuTitle, { color: colors.foreground }]}>Sair da conta?</Text>
                <Text style={[styles.menuDescription, { color: colors.muted }]}>Sua sessão será encerrada neste dispositivo. Você poderá entrar novamente quando quiser.</Text>
                <View style={styles.confirmActions}>
                  <AppButton label="Cancelar" variant="secondary" onPress={() => setConfirming(false)} disabled={loggingOut} style={styles.flexButton} />
                  <AppButton label={loggingOut ? "Saindo…" : "Sair"} onPress={() => void confirmLogout()} loading={loggingOut} style={styles.flexButton} accessibilityLabel="Confirmar saída da conta" />
                </View>
              </View>
            ) : (
              <>
                <View style={styles.identity}>
                  <View style={[styles.smallAvatar, { backgroundColor: colors.foreground }]}><Text style={[styles.smallAvatarText, { color: colors.background }]}>{avatar}</Text></View>
                  <View style={styles.identityCopy}>
                    <Text style={[styles.menuTitle, { color: colors.foreground }]}>{displayName}</Text>
                    {user?.email ? <Text style={[styles.menuDescription, { color: colors.muted }]}>{user.email}</Text> : null}
                    {user?.role === "admin" ? <Text style={[styles.roleBadge, { color: colors.success, backgroundColor: `${colors.success}18` }]}>Administrador</Text> : null}
                  </View>
                </View>
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <MenuItem icon="settings-outline" label="Configurações da conta" onPress={close} />
                {user?.role === "admin" ? <MenuItem icon="diamond-outline" label="Área de administração" onPress={() => { close(); router.push("/admin"); }} /> : null}
                <MenuItem icon="help-circle-outline" label="Ajuda e acessibilidade" onPress={close} />
                <View style={[styles.divider, { backgroundColor: colors.border }]} />
                <MenuItem icon="log-out-outline" label="Sair da conta" destructive onPress={() => setConfirming(true)} />
              </>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}

function MenuItem({ icon, label, destructive, onPress }: { icon: keyof typeof Ionicons.glyphMap; label: string; destructive?: boolean; onPress: () => void }) {
  const colors = useColors();
  return (
    <Pressable
      onPress={onPress}
      accessibilityRole="menuitem"
      accessibilityLabel={label}
      style={({ pressed }) => [styles.menuItem, { opacity: pressed ? 0.65 : 1 }]}
    >
      <Ionicons name={icon} size={20} color={destructive ? colors.primary : colors.muted} />
      <Text style={[styles.menuItemLabel, { color: destructive ? colors.primary : colors.foreground }]}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  avatar: { width: 44, height: 44, borderRadius: 22, alignItems: "center", justifyContent: "center" },
  avatarText: { fontSize: 16, fontWeight: "800" },
  backdrop: { flex: 1, alignItems: "flex-end", paddingTop: 74, paddingHorizontal: 16, backgroundColor: "rgba(23,42,53,0.18)" },
  menu: { width: "100%", maxWidth: 360, borderWidth: 1, borderRadius: 20, padding: 16, gap: 4, shadowColor: "#000", shadowOpacity: 0.12, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  identity: { flexDirection: "row", alignItems: "center", gap: 12, paddingBottom: 8 },
  smallAvatar: { width: 40, height: 40, borderRadius: 20, alignItems: "center", justifyContent: "center" },
  smallAvatarText: { fontSize: 15, fontWeight: "800" },
  identityCopy: { flex: 1, gap: 2 },
  menuTitle: { fontSize: 16, fontWeight: "800" },
  menuDescription: { fontSize: 13, lineHeight: 19 },
  roleBadge: { alignSelf: "flex-start", marginTop: 3, paddingHorizontal: 8, paddingVertical: 3, borderRadius: 999, fontSize: 11, fontWeight: "700" },
  divider: { height: StyleSheet.hairlineWidth, marginVertical: 8 },
  menuItem: { minHeight: 48, flexDirection: "row", alignItems: "center", gap: 12, paddingHorizontal: 4 },
  menuItemLabel: { flex: 1, fontSize: 15, fontWeight: "700" },
  confirmContent: { gap: 10, paddingVertical: 4 },
  confirmActions: { flexDirection: "row", gap: 8, marginTop: 8 },
  flexButton: { flex: 1, minWidth: 0 },
});
