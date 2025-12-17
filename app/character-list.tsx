import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { collection, getDocs, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

interface Character {
  id: string;
  name: string;
  imageUrl: string;
  gender: string;
  createdAt: any;
}

export default function CharacterList() {
  const router = useRouter();
  const { user } = useAuth();
  const [characters, setCharacters] = useState<Character[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentCharacterId, setCurrentCharacterId] = useState<string | null>(null);

  useEffect(() => {
    loadCharacters();
    loadActiveCharacter();
  }, [user]);

  const loadActiveCharacter = async () => {
    try {
      const activeId = await AsyncStorage.getItem('activeCharacterId');
      setCurrentCharacterId(activeId);
    } catch (error) {
      console.error('Error loading active character:', error);
    }
  };

  const loadCharacters = async () => {
    if (!user) {
      router.replace("/login");
      return;
    }

    try {
      // Query all characters for this user
      const q = query(collection(db, "characters"), where("userId", "==", user.uid));
      const querySnapshot = await getDocs(q);
      
      const charactersData: Character[] = [];
      querySnapshot.forEach((doc) => {
        charactersData.push({
          id: doc.id,
          ...doc.data()
        } as Character);
      });

      // Sort by creation date (newest first)
      charactersData.sort((a, b) => {
        const aTime = a.createdAt?.seconds || 0;
        const bTime = b.createdAt?.seconds || 0;
        return bTime - aTime;
      });

      setCharacters(charactersData);
    } catch (error) {
      console.error("Error loading characters:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleCharacterSelect = async (characterId: string) => {
    try {
      // Store the selected character as active
      await AsyncStorage.setItem('activeCharacterId', characterId);
      console.log('Switched to character:', characterId);
      // Go back to profile page which will reload with the new character
      router.back();
    } catch (error) {
      console.error('Error switching character:', error);
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>Loading characters...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable 
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <Text style={styles.backArrow}>←</Text>
        </Pressable>
        <Text style={styles.title}>Your Characters</Text>
        <Pressable

          style={styles.settingsButton}
          onPress={() => router.push('/settings')}
        >
          <Text style={styles.settingsIcon}>⚙️</Text>
        </Pressable>
      </View>

      {/* Characters List */}
      {characters.length > 0 ? (
        <FlatList
          data={characters}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <Pressable
              style={({ pressed }) => [
                styles.characterCard,
                item.id === currentCharacterId && styles.activeCharacterCard,
                pressed && styles.characterCardPressed
              ]}
              onPress={() => handleCharacterSelect(item.id)}
            >
              <Image source={{ uri: item.imageUrl }} style={styles.characterImage} />
              <View style={styles.characterInfo}>
                <Text style={styles.characterName}>{item.name}</Text>
                <Text style={styles.characterGender}>{item.gender}</Text>
                {item.id === currentCharacterId && (
                  <Text style={styles.activeLabel}>Active</Text>
                )}
              </View>
              <Text style={styles.arrow}>→</Text>
            </Pressable>
          )}
        />
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No characters yet</Text>
          <Text style={styles.emptySubtext}>Create your first character to get started!</Text>
          <Pressable
            style={({ pressed }) => [styles.createButton, pressed && styles.buttonPressed]}
            onPress={() => router.push("/purchase-campaign")}
          >
            <Text style={styles.createButtonText}>Create Character</Text>
          </Pressable>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#333",
  },
  backButton: {
    padding: 10,
  },
  backArrow: {
    fontSize: 28,
    color: "#fff",
  },
  title: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
  },
  placeholder: {
    width: 48,
  },
  loadingContainer: {
    flex: 1,
    backgroundColor: "#000",
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
  },
  listContent: {
    padding: 20,
  },
  characterCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 15,
    marginBottom: 15,
    borderWidth: 1,
    borderColor: "#333",
  },
  activeCharacterCard: {
    borderColor: "#fff",
    borderWidth: 2,
  },
  characterCardPressed: {
    opacity: 0.7,
  },
  activeLabel: {
    fontSize: 12,
    color: "#0095f6",
    fontWeight: "600",
    marginTop: 3,
  },
  characterImage: {
    width: 60,
    height: 105,
    borderRadius: 8,
    backgroundColor: "#333",
  },
  characterInfo: {
    flex: 1,
    marginLeft: 15,
  },
  characterName: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 5,
  },
  characterGender: {
    fontSize: 14,
    color: "#999",
    textTransform: "capitalize",
  },
  arrow: {
    fontSize: 24,
    color: "#999",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginBottom: 30,
    textAlign: "center",
  },
  createButton: {
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 40,
    borderRadius: 8,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  createButtonText: {
    color: "#000",
    fontSize: 16,
    fontWeight: "600",
  },
  settingsButton: {
    padding: 10,
  },
  settingsIcon: {
    color: '#fff',
    fontSize: 24,
  },
});
