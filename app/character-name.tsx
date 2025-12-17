import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, serverTimestamp } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { Animated, Image, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

export default function CharacterName() {
  const router = useRouter();
  const { imageUrl, backstory, gender } = useLocalSearchParams();
  const { user } = useAuth();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [imageError, setImageError] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  console.log("CharacterName - imageUrl:", imageUrl);

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
      setError("Please sign up or login to save your character");
      console.log("No user - redirecting to register in 2 seconds");
      setTimeout(() => {
        router.replace("/register");
      }, 2000);
      return;
    }

    setError("");
    setIsSaving(true);
    console.log("Starting save to Firestore...");

    try {
      // Save character to Firestore with auto-generated ID (characters are just display profiles)
      const characterData = {
        name: name.trim(),
        imageUrl: imageUrl,
        backstory: backstory || "",
        gender: gender || "male",
        createdAt: serverTimestamp(),
        userId: user.uid,
      };
      console.log("Character data:", characterData);
      
      const docRef = await addDoc(collection(db, "characters"), characterData);
      console.log("Character saved successfully to Firestore!");
      console.log("Document ID:", docRef.id);
      
      // Set this as the active character
      const AsyncStorage = await import('@react-native-async-storage/async-storage');
      await AsyncStorage.default.setItem('activeCharacterId', docRef.id);
      console.log("Set as active character");

      // Navigate to crop page for this character
      router.replace({
        pathname: "/settings/avatar/crop",
        params: { imageUrl: imageUrl as string, characterId: docRef.id, fromNewCharacter: '1' },
      });
      console.log("Navigation to crop page initiated");
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
        {imageUrl ? (
          <Animated.View style={[styles.imageWrapper, { opacity: fadeAnim }]}>
            {imageError ? (
              <View style={styles.errorImageContainer}>
                <Text style={styles.errorImageText}>Failed to load image</Text>
                <Text style={styles.errorImageSubtext}>URL: {String(imageUrl).substring(0, 50)}...</Text>
              </View>
            ) : (
              <Image 
                source={{ uri: imageUrl as string }} 
                style={styles.characterImage}
                resizeMode="cover"
                onError={(error) => {
                  console.error("Image load error details:", error.nativeEvent);
                  console.error("Attempted to load URL:", imageUrl);
                  setImageError(true);
                }}
                onLoad={() => console.log("Image loaded successfully:", imageUrl)}
              />
            )}
          </Animated.View>
        ) : (
          <View style={styles.imageWrapper}>
            <Text style={styles.noImageText}>No image available</Text>
          </View>
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
    aspectRatio: 0.57, // Match Stability AI portrait ratio (768/1344)
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
  noImageText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
  },
  errorImageContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  errorImageText: {
    color: "#ff3333",
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 10,
    textAlign: "center",
  },
  errorImageSubtext: {
    color: "#666",
    fontSize: 12,
    textAlign: "center",
  },
});
