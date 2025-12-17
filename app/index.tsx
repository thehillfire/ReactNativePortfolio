import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useAuth } from "../context/AuthContext";

export default function Index() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const [isLoading, setIsLoading] = useState(true);
  const loadingFadeAnim = useRef(new Animated.Value(0)).current;
  const contentFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in loading screen
    Animated.timing(loadingFadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();

    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    // Auto-redirect based on auth state
    if (!authLoading && !isLoading) {
      if (user) {
        router.replace("/projects");
      } else {
        router.replace("/welcome");
      }
    }
  }, [user, authLoading, isLoading]);

  if (isLoading) {
    return (
      <Animated.View style={[styles.loadingContainer, { opacity: loadingFadeAnim }]}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading...</Text>
      </Animated.View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: contentFadeAnim }]}>
      <View style={styles.header}>
        <Text style={styles.headerText}>LoreForge</Text>
      </View>
    
      <View style={styles.content}>
        <Text style={styles.contentText}>
          {user ? `Welcome back!` : 'Welcome to LoreForge'}
        </Text>
        
        {user && (
          <Text style={styles.emailText}>{user.email}</Text>
        )}

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={() => {
            console.log("Login button pressed, navigating to /login");
            router.push("/login");
          }}
        >
          <Text style={styles.buttonText}>Login</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={() => {
            console.log("Sign Up button pressed, navigating to /register");
            router.push("/register");
          }}
        >
          <Text style={styles.buttonText}>Sign Up</Text>
        </Pressable>

        <Pressable
          style={({ pressed }) => [
            styles.button,
            styles.testButton,
            pressed && styles.buttonPressed
          ]}
          onPress={() => {
            console.log("Test button pressed, navigating to welcome");
            router.push("/welcome");
          }}
        >
          <Text style={styles.testButtonText}>Test (Guest Mode)</Text>
        </Pressable>

        {user && (
          <Pressable
            style={({ pressed }) => [
              styles.logoutButton,
              pressed && styles.buttonPressed
            ]}
            onPress={async () => {
              await logout();
            }}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    marginTop: 20,
  },
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    backgroundColor : "#1a1a1a",
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 45,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentText: {
    color: "#ffffff",
    fontSize: 20,
    marginBottom: 20,
    fontWeight: "bold",
  },
  emailText: {
    color: "#888",
    fontSize: 14,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginBottom: 15,
    width: 200,
  },
  buttonSecondary: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ffffff",
  },
  buttonPressed: {
    opacity: 0.7,
    transform: [{ scale: 0.98 }],
  },
  testButton: {
    backgroundColor: "#666666",
    borderWidth: 1,
    borderColor: "#999999",
  },
  testButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  buttonTextSecondary: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
  logoutButton: {
    marginTop: 30,
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  logoutButtonText: {
    color: "#ff6666",
    fontSize: 14,
    fontWeight: "600",
  },
});