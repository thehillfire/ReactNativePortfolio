import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import { ActivityIndicator, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { generateBackstory } from "../config/openai-text";
import { useAuth } from "../context/AuthContext";

export default function UserProfile() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [characterName, setCharacterName] = useState("");
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [backstory, setBackstory] = useState("");
  const [loading, setLoading] = useState(true);
  const [generatingBackstory, setGeneratingBackstory] = useState(false);
  const [characterGender, setCharacterGender] = useState("male");

  console.log("UserProfile mounted with userId:", userId, "currentUser:", user?.uid);

  useFocusEffect(
    useCallback(() => {
      loadProfile();
    }, [userId])
  );

  const loadProfile = async () => {
    if (!userId) return;
    
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "characters", userId as string));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setCharacterName(data.name);
        setCharacterImageUrl(data.imageUrl);
        setFollowersCount((data.followers || []).length);
        setFollowingCount((data.following || []).length);
        setCharacterGender(data.gender || "male");
        
        // Check if backstory exists
        if (data.backstory) {
          setBackstory(data.backstory);
        } else {
          // Generate backstory if it doesn't exist
          console.log("No backstory found, generating one...");
          await generateAndSaveBackstory(data.name, data.gender || "male");
        }
        
        // Check if current user is following this profile
        if (user) {
          setIsFollowing((data.followers || []).includes(user.uid));
        }
      }
    } catch (error) {
      console.error("Error loading profile:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateAndSaveBackstory = async (characterName: string, gender: string) => {
    setGeneratingBackstory(true);
    try {
      // Double-check that backstory doesn't already exist
      const userDoc = await getDoc(doc(db, "characters", userId as string));
      if (userDoc.exists() && userDoc.data().backstory) {
        console.log("Backstory already exists, skipping generation");
        setBackstory(userDoc.data().backstory);
        setGeneratingBackstory(false);
        return;
      }

      // Generate a generic fantasy backstory based on character name and gender
      const pronouns = gender === "male" ? "he/him" : "she/her";
      const prompt = `Create a short, compelling backstory (2-3 sentences) for a ${gender} fantasy RPG character named "${characterName}". Use ${pronouns} pronouns. Include their origin, motivation, and what defines them.`;
      const generatedBackstory = await generateBackstory(prompt);
      
      setBackstory(generatedBackstory);
      
      // Save to Firestore - ONLY if no backstory exists
      await updateDoc(doc(db, "characters", userId as string), {
        backstory: generatedBackstory
      });
      
      console.log("Backstory generated and saved successfully (PERMANENT - will never be overwritten)");
    } catch (error) {
      console.error("Error generating backstory:", error);
      setBackstory("A mysterious wanderer with untold stories...");
    } finally {
      setGeneratingBackstory(false);
    }
  };

  const handleFollow = async () => {
    if (!user || !userId) return;
    
    // Optimistically update UI
    const wasFollowing = isFollowing;
    setIsFollowing(!isFollowing);
    setFollowersCount(prev => wasFollowing ? prev - 1 : prev + 1);
    
    try {
      // Update current user's following list
      await updateDoc(doc(db, "characters", user.uid), {
        following: wasFollowing ? arrayRemove(userId) : arrayUnion(userId)
      });
      
      // Update target user's followers list
      await updateDoc(doc(db, "characters", userId as string), {
        followers: wasFollowing ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      
      console.log(wasFollowing ? "Unfollowed" : "Followed", userId);
      
      // If unfollowing, go back to refresh the grid
      if (wasFollowing) {
        router.back();
      }
    } catch (error) {
      console.error("Follow error:", error);
      // Revert on error
      setIsFollowing(wasFollowing);
      setFollowersCount(prev => wasFollowing ? prev + 1 : prev - 1);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffffff" />
      </View>
    );
  }

  const isOwnProfile = user?.uid === userId;

  console.log("UserProfile - isFollowing:", isFollowing, "isOwnProfile:", isOwnProfile);

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
        {characterImageUrl && (
          <View style={styles.imageWrapper}>
            <Image 
              source={{ uri: characterImageUrl }}
              style={styles.characterImage}
              resizeMode="contain"
            />
          </View>
        )}

        {/* Character Name */}
        <Text style={styles.characterName}>{characterName}</Text>

        {/* Backstory */}
        {generatingBackstory ? (
          <View style={styles.backstoryContainer}>
            <ActivityIndicator size="small" color="#0095f6" />
            <Text style={[styles.backstoryText, { marginTop: 10, textAlign: "center" }]}>
              Weaving their story...
            </Text>
          </View>
        ) : backstory ? (
          <View style={styles.backstoryContainer}>
            <Text style={styles.backstoryText}>{backstory}</Text>
          </View>
        ) : null}

        {/* Follow/Unfollow Button */}
        {!isOwnProfile && (
          <Pressable
            style={({ pressed }) => [
              styles.followButton,
              isFollowing && styles.unfollowButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleFollow}
          >
            <Text style={styles.followButtonText}>
              {isFollowing ? "Unfollow" : "Follow"}
            </Text>
          </Pressable>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  loadingScreen: {
    flex: 1,
    backgroundColor: "#000000",
    justifyContent: "center",
    alignItems: "center",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backButtonText: {
    color: "#ffffff",
    fontSize: 32,
    fontWeight: "300",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingTop: 80,
    paddingBottom: 40,
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: "100%",
    maxWidth: 400,
    aspectRatio: 1,
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  characterImage: {
    width: "100%",
    height: "100%",
  },
  characterName: {
    fontSize: 32,
    fontWeight: "600",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  backstoryContainer: {
    width: "100%",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
    borderWidth: 1,
    borderColor: "#333",
  },
  backstoryText: {
    fontSize: 16,
    lineHeight: 24,
    color: "#e0e0e0",
    textAlign: "center",
    fontStyle: "italic",
  },
  followButton: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 40,
    paddingVertical: 12,
    borderRadius: 8,
    minWidth: 150,
    alignItems: "center",
  },
  unfollowButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#666",
  },
  followButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.7,
  },
});
