import React from "react";
import { StyleSheet, Text, View } from "react-native";

export default function Versus() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Versus Mode</Text>
      <Text style={styles.subtitle}>Coming Soon</Text>
      <Text style={styles.description}>
        Compete against other players in epic battles
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 24,
    color: "#999",
    marginBottom: 24,
  },
  description: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
});
