import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import React, { useEffect, useState } from "react";
import { Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

interface Character {
  id: string;
  name: string;
  imageUrl: string;
  backstory: string;
  hasCampaign: boolean;
}

export default function Campaign() {
  const router = useRouter();
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCharacters();
  }, []);

  useEffect(() => {
    loadCharacters();
  }, []);

  const loadCharacters = async () => {
    if (!user) return;

    try {
      setLoading(true);
      
      // Get all characters for this user
      const charactersRef = collection(db, "characters");
      const charactersSnapshot = await getDocs(charactersRef);
      
      const userCharacters: Character[] = [];
      
      for (const charDoc of charactersSnapshot.docs) {
        const data = charDoc.data();
        if (data.userId === user.uid) {
          // Check if this character has a campaign
          const campaignsRef = collection(db, "campaigns");
          const q = query(
            campaignsRef,
            where("userId", "==", user.uid),
            where("characterId", "==", charDoc.id)
          );
          const campaignSnap = await getDocs(q);
          
          userCharacters.push({
            id: charDoc.id,
            name: data.name || "Unknown",
            imageUrl: data.imageUrl || "",
            backstory: data.backstory || "No backstory available",
            hasCampaign: !campaignSnap.empty,
          });
        }
      }
      
      setCharacters(userCharacters);
    } catch (error) {
      console.error("Error loading characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const selectCharacter = (characterId: string) => {
    router.push({
      pathname: "/campaign-game",
      params: { characterId }
    });
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Back</Text>
        </Pressable>
        <Text style={styles.title}>Select Character</Text>
        <View style={{ width: 60 }} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading characters...</Text>
        </View>
      ) : characters.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>You haven't created any characters yet!</Text>
          <Pressable
            style={styles.createButton}
            onPress={() => router.push("/questionnaire")}
          >
            <Text style={styles.createButtonText}>Create Character</Text>
          </Pressable>
        </View>
      ) : (
        <ScrollView 
          style={styles.scrollContainer}
          contentContainerStyle={styles.charactersContainer}
        >
          {characters.map((character) => (
            <Pressable
              key={character.id}
              style={({ pressed }) => [styles.characterCard, pressed && styles.cardPressed]}
              onPress={() => selectCharacter(character.id)}
            >
              <Image 
                source={{ uri: character.imageUrl }} 
                style={styles.characterImage}
              />
              <View style={styles.characterInfo}>
                <Text style={styles.characterName}>{character.name}</Text>
                <Text style={styles.backstory} numberOfLines={3}>
                  {character.backstory}
                </Text>
                <View style={styles.buttonContainer}>
                  <Text style={styles.playButton}>
                    {character.hasCampaign ? "Continue Campaign →" : "Begin Campaign →"}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    color: "#999",
    fontSize: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#ffffff",
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    color: "#999",
    fontSize: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    color: "#999",
    fontSize: 18,
    textAlign: "center",
    marginBottom: 24,
  },
  createButton: {
    backgroundColor: "#2a4a7c",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  createButtonText: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
  },
  scrollContainer: {
    flex: 1,
  },
  charactersContainer: {
    padding: 20,
    gap: 20,
  },
  characterCard: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#333",
    overflow: "hidden",
  },
  cardPressed: {
    opacity: 0.7,
  },
  characterImage: {
    width: "100%",
    height: 200,
    backgroundColor: "#0a0a0a",
  },
  characterInfo: {
    padding: 16,
  },
  characterName: {
    fontSize: 24,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 8,
  },
  backstory: {
    fontSize: 14,
    color: "#999",
    lineHeight: 20,
    marginBottom: 16,
  },
  buttonContainer: {
    alignItems: "flex-end",
  },
  playButton: {
    color: "#4a9eff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
