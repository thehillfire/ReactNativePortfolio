import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, setDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

export default function CharacterName() {
  const router = useRouter();
  const { imageUrl } = useLocalSearchParams();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleSaveCharacter = async () => {
    console.log("handleSaveCharacter called");
    console.log("Name:", name);
    console.log("User:", user?.uid);
    console.log("ImageUrl:", imageUrl);
    
    if (!name.trim()) {
      setError("What is their name");
      return;
    }

    if (!user) {
      setError("You must be logged in");
      return;
    }

    setError("");
    setIsSaving(true);
    console.log("Starting save to Firestore...");

    try {
      // Save character to Firestore
      const characterData = {
        name: name.trim(),
        imageUrl: imageUrl,
        createdAt: new Date().toISOString(),
        userId: user.uid,
      };
      console.log("Character data:", characterData);
      
      await setDoc(doc(db, "characters", user.uid), characterData);
      console.log("Character saved successfully!");
      
      // Navigate to projects page
      console.log("Navigating to /projects...");
      router.replace("/projects");
      console.log("Navigation initiated");
    } catch (error: any) {
      console.error("Save character error:", error);
      console.error("Error details:", error.code, error.message);
      setError(error.message || "Failed to save character");
    } finally {
      setIsSaving(false);
      console.log("Save process completed, isSaving set to false");
    }
  };

  return (
    <View style={styles.container}>
      {/* Back Button */}
      <Pressable 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backButtonText}>←</Text>
      </Pressable>

      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Character Image */}
        {imageUrl && (
          <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
            <Image 
              source={{ uri: imageUrl as string }} 
              style={styles.characterImage}
              resizeMode="contain"
            />
          </Animated.View>
        )}
        
        {/* Title */}
        <Animated.Text style={[styles.title, { opacity: fadeAnim }]}>
          What Is Their Name?
        </Animated.Text>

        {/* Error Message */}
        {error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
          </View>
        ) : null}

        {/* Name Input */}
        <Animated.View style={[styles.inputContainer, { opacity: fadeAnim }]}>
          <TextInput
            style={styles.input}
            placeholder="Enter their name..."
            placeholderTextColor="#666"
            value={name}
            onChangeText={setName}
            autoCapitalize="words"
          />
        </Animated.View>

        {/* Continue Button */}
        <Animated.View style={{ opacity: fadeAnim }}>
          <Pressable
            style={({ pressed }) => [
              styles.button,
              pressed && styles.buttonPressed,
              isSaving && styles.buttonDisabled
            ]}
            onPress={handleSaveCharacter}
            disabled={isSaving}
          >
            <Text style={styles.buttonText}>
              {isSaving ? "Saving..." : "Begin Your Journey"}
            </Text>
          </Pressable>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    width: 40,
    height: 40,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "rgba(255, 255, 255, 0.1)",
    borderRadius: 20,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 1,
    maxWidth: 500,
    marginBottom: 30,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  characterImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  errorContainer: {
    backgroundColor: "#ff3333",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
    width: "100%",
    maxWidth: 500,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 14,
    textAlign: "center",
    fontWeight: "600",
  },
  inputContainer: {
    width: "100%",
    maxWidth: 500,
    marginBottom: 30,
  },
  input: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    borderRadius: 12,
    padding: 20,
    fontSize: 18,
    color: "#ffffff",
    width: "100%",
    textAlign: "center",
  },
  button: {
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  buttonDisabled: {
    opacity: 0.5,
  },
  buttonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "600",
  },
});
