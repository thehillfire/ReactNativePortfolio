import { useRouter } from "expo-router";
import React from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";

export default function GameModes() {
  const router = useRouter();

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Choose Your Adventure</Text>
      
      <View style={styles.modesContainer}>
        <Pressable
          style={({ pressed }) => [styles.modeButton, pressed && styles.buttonPressed]}
          onPress={() => router.push("/campaign")}
        >
          <Text style={styles.modeIcon}>📖</Text>
          <Text style={styles.modeTitle}>Campaign</Text>
          <Text style={styles.modeDescription}>Solo adventure with AI narrator</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.modeButton, pressed && styles.buttonPressed]}
          onPress={() => router.push("/co-op")}
        >
          <Text style={styles.modeIcon}>🤝</Text>
          <Text style={styles.modeTitle}>Co-Op</Text>
          <Text style={styles.modeDescription}>Team up with other players</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [styles.modeButton, pressed && styles.buttonPressed]}
          onPress={() => router.push("/versus")}
        >
          <Text style={styles.modeIcon}>⚔️</Text>
          <Text style={styles.modeTitle}>Versus</Text>
          <Text style={styles.modeDescription}>Compete against other players</Text>
        </Pressable>
      </View>

      <Pressable
        style={({ pressed }) => [styles.backButton, pressed && styles.buttonPressed]}
        onPress={() => router.back()}
      >
        <Text style={styles.backText}>← Back to Profile</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    paddingHorizontal: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 40,
  },
  modesContainer: {
    flex: 1,
    justifyContent: "center",
    gap: 20,
    marginBottom: 100,
  },
  modeButton: {
    backgroundColor: "#1a1a1a",
    borderRadius: 16,
    padding: 24,
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  modeIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  modeTitle: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  modeDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  backButton: {
    padding: 16,
    alignItems: "center",
  },
  backText: {
    color: "#999",
    fontSize: 16,
  },
});
