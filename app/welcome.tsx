import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Welcome() {
  const router = useRouter();
  const { user, logout } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        <Text style={styles.title}>Hello</Text>
        <Text style={styles.subtitle}>Many adventures await...</Text>

        <Pressable style={styles.button} onPress={() => router.push("/login")}>
          <Text style={styles.buttonText}>I already have an account</Text>
        </Pressable>

        <Pressable
          style={[styles.button, styles.buttonOutline]}
          onPress={() => router.push("/register")}
        >
          <Text style={[styles.buttonText, styles.buttonOutlineText]}>
            Sign me up for a new account
          </Text>
        </Pressable>
        
        {user && (
          <Pressable
            style={[styles.button, styles.logoutButton]}
            onPress={async () => {
              await logout();
            }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        )}
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  content: {
    width: "85%",
    maxWidth: 400,
  },
  title: {
    fontSize: 48,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 16,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginBottom: 48,
    textAlign: "center",
    lineHeight: 24,
  },
  button: {
    backgroundColor: "#fff",
    borderRadius: 8,
    padding: 16,
    alignItems: "center",
    marginBottom: 16,
  },
  buttonOutline: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#fff",
  },
  buttonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonOutlineText: {
    color: "#fff",
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    marginTop: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});
