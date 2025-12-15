import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

export default function Projects() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const [characterName, setCharacterName] = useState("");
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [loadingCharacter, setLoadingCharacter] = useState(false);
  const [hasCheckedCharacter, setHasCheckedCharacter] = useState(false);

  useEffect(() => {
    console.log("Projects useEffect - loading:", loading, "user:", user?.uid, "hasChecked:", hasCheckedCharacter);
    
    // Redirect to login if not authenticated
    if (!loading && !user) {
      console.log("No user, redirecting to login");
      router.replace("/login");
      return;
    }
    
    // Load character only once when user is available
    if (!loading && user && !hasCheckedCharacter) {
      console.log("Loading character for user:", user.uid);
      loadCharacter();
    }
  }, [user, loading, hasCheckedCharacter]);

  const loadCharacter = async () => {
    if (!user) {
      console.log("loadCharacter: No user");
      return;
    }
    
    setLoadingCharacter(true);
    console.log("loadCharacter: Starting for user", user.uid);
    
    try {
      const characterDoc = await getDoc(doc(db, "characters", user.uid));
      console.log("Character doc exists:", characterDoc.exists());
      
      if (characterDoc.exists()) {
        const data = characterDoc.data();
        setCharacterName(data.name);
        setCharacterImageUrl(data.imageUrl);
        console.log("Character loaded:", data.name);
        setHasCheckedCharacter(true);
      } else {
        console.log("No character found, redirecting to questionnaire");
        setHasCheckedCharacter(true);
        router.replace("/questionnaire");
      }
    } catch (error: any) {
      console.error("Error loading character:", error);
      // If offline error or any error, redirect to questionnaire to create character
      if (error.code === 'failed-precondition' || error.message?.includes('offline')) {
        console.log("Firestore offline error, redirecting to questionnaire");
        setHasCheckedCharacter(true);
        router.replace("/questionnaire");
      } else {
        setHasCheckedCharacter(true);
        router.replace("/questionnaire");
      }
    } finally {
      console.log("loadCharacter: Setting loadingCharacter to false");
      setLoadingCharacter(false);
    }
  };

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 1000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleLogout = async () => {
    await logout();
    router.replace("/");
  };

  if (loading || loadingCharacter) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>
          {loading ? "Checking authentication..." : "Loading character..."}
        </Text>
        {loadingCharacter && (
          <Text style={styles.debugText}>
            User ID: {user?.uid || "N/A"}
          </Text>
        )}
      </View>
    );
  }

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      {/* Left side - Character Image */}
      <View style={styles.imageContainer}>
        {characterImageUrl ? (
          <>
            <Image 
              source={{ uri: characterImageUrl }} 
              style={styles.generatedImage}
              resizeMode="contain"
            />
            <Text style={styles.characterName}>{characterName}</Text>
          </>
        ) : (
          <Text style={styles.placeholderText}>No character found</Text>
        )}
      </View>

      {/* Right side - Content */}
      <View style={styles.contentContainer}>
        <Text style={styles.title}>Welcome, {characterName}!</Text>

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
    flexDirection: "row",
    padding: 20,
  },
  loadingScreen: {
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
  debugText: {
    color: "#666",
    fontSize: 12,
    marginTop: 10,
  },
  imageContainer: {
    width: "33%",
    height: "100%",
    borderRadius: 16,
    overflow: "hidden",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    marginRight: 40,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  placeholderText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  generatedImage: {
    width: "100%",
    height: "85%",
  },
  characterName: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
    marginTop: 20,
  },
  contentContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 30,
  },
  logoutButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ffffff",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 20,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
});
