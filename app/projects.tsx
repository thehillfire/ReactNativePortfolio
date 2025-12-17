import AsyncStorage from "@react-native-async-storage/async-storage";
import { useFocusEffect } from "@react-navigation/native";
import { useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useCallback, useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, FlatList, Image, Pressable, ScrollView, StyleSheet, Text, TouchableWithoutFeedback, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

interface FollowedUser {
  id: string;
  name: string;
  imageUrl: string;
}

export default function Projects() {
  const router = useRouter();
  const { user, logout, loading } = useAuth();
  const fadeAnim = useRef(new Animated.Value(1)).current; // Start visible
  const [characterName, setCharacterName] = useState("");
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [loadingCharacter, setLoadingCharacter] = useState(false);
  const [hasCheckedCharacter, setHasCheckedCharacter] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [followedUsers, setFollowedUsers] = useState<FollowedUser[]>([]);
  const [activeTab, setActiveTab] = useState<"following" | "posts">("following");
  const [showCharacterDropdown, setShowCharacterDropdown] = useState(false);
  const [allCharacters, setAllCharacters] = useState<Array<{id: string, name: string, imageUrl: string}>>([]);
  const [activeCharacterId, setActiveCharacterId] = useState<string | null>(null);
  const [previewCharacter, setPreviewCharacter] = useState<{name: string, imageUrl: string, backstory: string} | null>(null);
  const dropdownAnim = useRef(new Animated.Value(0)).current;

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

  // Reload data when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      if (user && hasCheckedCharacter) {
        console.log("Screen focused, reloading character data");
        loadCharacter();
      }
    }, [user, hasCheckedCharacter])
  );

  const loadCharacter = async () => {
    if (!user) {
      console.log("loadCharacter: No user");
      return;
    }
    
    setLoadingCharacter(true);
    console.log("loadCharacter: Starting for user", user.uid);
    
    try {
      // Get active character ID from AsyncStorage
      const activeCharacterId = await AsyncStorage.getItem('activeCharacterId');
      
      // If no active character is set, use the most recent one
      let characterId = activeCharacterId;
      if (!characterId) {
        // Query for this user's characters and get the first one
        const { collection, getDocs, query, where, orderBy, limit } = await import('firebase/firestore');
        const q = query(
          collection(db, "characters"),
          where("userId", "==", user.uid),
          orderBy("createdAt", "desc"),
          limit(1)
        );
        const snapshot = await getDocs(q);
        if (!snapshot.empty) {
          characterId = snapshot.docs[0].id;
          await AsyncStorage.setItem('activeCharacterId', characterId);
        }
      }
      
      if (!characterId) {
        console.log("No characters found for user");
        setLoadingCharacter(false);
        setHasCheckedCharacter(true);
        return;
      }
      
      // Store active character ID
      setActiveCharacterId(characterId);
      
      // Load all characters for dropdown
      const { collection, getDocs, query, where } = await import('firebase/firestore');
      const allCharsQuery = query(
        collection(db, "characters"),
        where("userId", "==", user.uid)
      );
      const allCharsSnapshot = await getDocs(allCharsQuery);
      const charsData = allCharsSnapshot.docs.map(doc => ({
        id: doc.id,
        name: doc.data().name,
        imageUrl: doc.data().imageUrl
      }));
      setAllCharacters(charsData);
      
      const characterDoc = await getDoc(doc(db, "characters", characterId));
      console.log("Character doc exists:", characterDoc.exists());
      
      if (characterDoc.exists()) {
        const characterData = characterDoc.data();
        // Only use character data for name and image
        setCharacterName(characterData.name);
        setCharacterImageUrl(characterData.imageUrl);
        
        // Load followers/following from MAIN character document (original system)
        // Main character is always stored at characters/{userId} for backwards compatibility
        const mainCharDoc = await getDoc(doc(db, "characters", user.uid));
        if (mainCharDoc.exists()) {
          const mainData = mainCharDoc.data();
          setFollowersCount((mainData.followers || []).length);
          setFollowingCount((mainData.following || []).length);
          
          // Load followed users' data
          const followingIds = mainData.following || [];
          if (followingIds.length > 0) {
            const followedUsersData: FollowedUser[] = [];
            for (const userId of followingIds) {
              const followedCharDoc = await getDoc(doc(db, "characters", userId));
              if (followedCharDoc.exists()) {
                const followedCharData = followedCharDoc.data();
                followedUsersData.push({
                  id: userId,
                  name: followedCharData.name,
                  imageUrl: followedCharData.imageUrl
                });
              }
            }
            setFollowedUsers(followedUsersData);
          } else {
            setFollowedUsers([]);
          }
        } else {
          // No main character doc yet, initialize with empty arrays
          setFollowersCount(0);
          setFollowingCount(0);
          setFollowedUsers([]);
        }
        
        console.log("Character loaded:", characterData.name, "Image:", characterData.imageUrl);
        setHasCheckedCharacter(true);
      } else {
        console.log("No character found - this shouldn't happen if login redirected correctly");
        setHasCheckedCharacter(true);
      }
    } catch (error: any) {
      console.error("Error loading character:", error);
      setHasCheckedCharacter(true);
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

  const handleCharacterSwitch = async (characterId: string) => {
    if (characterId === activeCharacterId) {
      // Clicking active character closes dropdown
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowCharacterDropdown(false));
    } else {
      // Switch to new character
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(async () => {
        await AsyncStorage.setItem('activeCharacterId', characterId);
        setShowCharacterDropdown(false);
        setHasCheckedCharacter(false); // Force reload
        loadCharacter();
      });
    }
  };

  const toggleCharacterDropdown = () => {
    if (showCharacterDropdown) {
      // Close animation
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowCharacterDropdown(false));
    } else {
      // Open animation
      setShowCharacterDropdown(true);
      Animated.timing(dropdownAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  };

  const closeDropdown = () => {
    if (showCharacterDropdown) {
      Animated.timing(dropdownAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start(() => setShowCharacterDropdown(false));
    }
  };

  const handleCharacterLongPress = async (characterId: string) => {
    try {
      // Fetch full character details
      const charDoc = await getDoc(doc(db, "characters", characterId));
      if (charDoc.exists()) {
        const data = charDoc.data();
        setPreviewCharacter({
          name: data.name,
          imageUrl: data.imageUrl,
          backstory: data.backstory || "No backstory available"
        });
      }
    } catch (error) {
      console.error("Error loading character preview:", error);
    }
  };

  if (loading || loadingCharacter) {
    console.log("Showing loading screen - loading:", loading, "loadingCharacter:", loadingCharacter);
    return (
      <View style={styles.loadingScreen}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style={styles.loadingText}>
          Loading...
        </Text>
        {loadingCharacter && (
          <Text style={styles.debugText}>
            User ID: {user?.uid || "N/A"}
          </Text>
        )}
      </View>
    );
  }

  console.log("Rendering profile - Name:", characterName, "Image URL exists:", !!characterImageUrl);

  return (
    <>
    <TouchableWithoutFeedback onPress={closeDropdown}>
      <View style={styles.container}>
        {/* Instagram-style Profile Header */}
        <View style={styles.profileHeader}>
        <Pressable
          style={({ pressed }) => [styles.plusButton, pressed && styles.plusButtonPressed]}
          onPress={() => router.push("/purchase-campaign")}
        >
          <Text style={styles.plusButtonText}>+</Text>
        </Pressable>
        
        <View style={styles.profilePictureWrapper}>
          <Pressable 
            onPress={toggleCharacterDropdown}
            onLongPress={() => activeCharacterId && handleCharacterLongPress(activeCharacterId)}
          >
            {characterImageUrl ? (
              <Image 
                source={{ uri: characterImageUrl }}
                style={styles.profilePicture}
                resizeMode="cover"
              onError={(error) => {
                console.error("Profile picture failed to load:", error.nativeEvent);
              }}
              onLoad={() => {
                console.log("Profile picture loaded successfully");
              }}
              />
            ) : (
              <View style={[styles.profilePicture, styles.placeholderPicture]}>
                <Text style={styles.placeholderText}>👤</Text>
              </View>
            )}
          </Pressable>
          
          {/* Character Dropdown - Animated */}
          {showCharacterDropdown && allCharacters.length > 0 && (
            <Animated.View
              style={[
                styles.characterDropdownContainer,
                {
                  opacity: dropdownAnim,
                  transform: [{
                    translateY: dropdownAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [-20, 0],
                    })
                  }]
                }
              ]}
            >
              {allCharacters
                .filter(char => char.id !== activeCharacterId)
                .map((char, index) => {
                  const scale = dropdownAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.8, 1],
                  });
                  return (
                    <Animated.View
                      key={char.id}
                      style={[
                        styles.dropdownCharacter,
                        {
                          transform: [{ scale }],
                          opacity: dropdownAnim,
                        },
                      ]}
                    >
                      <Pressable
                        onPress={() => handleCharacterSwitch(char.id)}
                        onLongPress={() => handleCharacterLongPress(char.id)}
                        style={({ pressed }) => [
                          styles.dropdownImageWrapper,
                          pressed && styles.dropdownImagePressed,
                        ]}
                      >
                        <Image source={{ uri: char.imageUrl }} style={styles.dropdownProfilePicture} />
                      </Pressable>
                    </Animated.View>
                  );
                })}
              </Animated.View>

          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{characterName || "Character"}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>0</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <Pressable 
              style={styles.statItem}
              onPress={() => {
                console.log("View followers");
                router.push({
                  pathname: "/followers",
                  params: { userId: user?.uid }
                });
              }}
            >
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </Pressable>
            <Pressable 
              style={styles.statItem}
              onPress={() => {
                console.log("View following");
                router.push({
                  pathname: "/following",
                  params: { userId: user?.uid }
                });
              }}
            >
              <Text style={styles.statNumber}>{followingCount}</Text>
              <Text style={styles.statLabel}>following</Text>
            </Pressable>
          </View>
        </View>
      </View>

      {/* Bio Section */}
      <View style={styles.bioSection}>
        <Text style={styles.displayName}>{characterName}</Text>
        <Text style={styles.bio}>Fantasy character • LoreForge</Text>
      </View>

      {/* Tab Selector */}
      <View style={styles.tabContainer}>
        <Pressable
          style={[styles.tab, activeTab === "following" && styles.activeTab]}
          onPress={() => setActiveTab("following")}
        >
          <Text style={[styles.tabIcon, activeTab === "following" && styles.activeTabIcon]}>👤</Text>
        </Pressable>
        <Pressable
          style={[styles.tab, activeTab === "posts" && styles.activeTab]}
          onPress={() => setActiveTab("posts")}
        >
          <Text style={[styles.tabIcon, activeTab === "posts" && styles.activeTabIcon]}>📖</Text>
        </Pressable>
      </View>

      {/* Following Grid */}
      {activeTab === "following" && (
        <View style={styles.contentContainer}>
        {followedUsers.length > 0 ? (
          <FlatList
            data={followedUsers}
            numColumns={3}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <Pressable
                style={({ pressed }) => [
                  styles.gridItem,
                  pressed && styles.gridItemPressed
                ]}
                onPress={() => {
                  console.log("Viewing profile:", item.name, "userId:", item.id);
                  router.push({
                    pathname: "/character-view",
                    params: { userId: item.id }
                  });
                }}
              >
                <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
              </Pressable>
            )}
            scrollEnabled={true}
            contentContainerStyle={styles.grid}
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Start following other characters to see them here!</Text>
            <Pressable
              style={({ pressed }) => [styles.searchButton, pressed && styles.buttonPressed]}
              onPress={() => router.push("/search")}
            >
              <Text style={styles.searchButtonText}>Search Characters</Text>
            </Pressable>
          </View>
        )}

        <Pressable
          style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
          onPress={handleLogout}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </Pressable>
      </View>
      )}

      {/* Posts/Adventures Tab */}
      {activeTab === "posts" && (
        <View style={styles.contentContainer}>
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Your adventures will appear here</Text>
            <Text style={styles.emptySubtext}>Share your character's stories, quests, and dungeon runs</Text>
          </View>
          
          <Pressable
            style={({ pressed }) => [styles.logoutButton, pressed && styles.buttonPressed]}
            onPress={handleLogout}
          >
            <Text style={styles.logoutButtonText}>Logout</Text>
          </Pressable>
        </View>
      )}

      {/* Bottom Navigation Bar */}
      <View style={styles.bottomNav}>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.buttonPressed]}
          onPress={() => {
            console.log("Search pressed");
            router.push("/search");
          }}
        >
          <Text style={styles.navIcon}>🔍</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.buttonPressed]}
          onPress={() => {
            console.log("Play pressed");
            router.push("/game-modes");
          }}
        >
          <Text style={styles.navIcon}>🎮</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.buttonPressed]}
          onPress={() => {
            console.log("Messages pressed");
            router.push("/messages");
          }}
        >
          <Text style={styles.navIcon}>💬</Text>
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.navButton, pressed && styles.buttonPressed]}
          onPress={() => {
            console.log("Characters pressed");
            router.push("/character-list");
          }}
        >
          <Text style={styles.navIcon}>☰</Text>
        </Pressable>
      </View>
    </View>
    </TouchableWithoutFeedback>

      {/* Character Preview Modal */}
      {previewCharacter && (
        <View style={styles.previewModal}>
          <Pressable 
            style={styles.previewBackButton}
            onPress={() => setPreviewCharacter(null)}
          >
            <Text style={styles.previewBackArrow}>←</Text>
          </Pressable>
          <ScrollView 
            style={styles.previewScrollView}
            contentContainerStyle={styles.previewScrollContent}
            showsVerticalScrollIndicator={true}
            bounces={true}
            alwaysBounceVertical={true}
          >
            <View style={styles.previewContent}>
              <Image 
                source={{ uri: previewCharacter.imageUrl }} 
                style={styles.previewImage}
                resizeMode="cover"
              />
              <Text style={styles.previewName}>{previewCharacter.name}</Text>
              <Text style={styles.previewBackstory}>{previewCharacter.backstory}</Text>
            </View>
          </ScrollView>
        </View>
      )}
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 10,
  },
  profilePictureWrapper: {
    marginRight: 20,
    position: 'relative',
    zIndex: 100, // High zIndex so dropdown can be layered properly
  },
  characterDropdownContainer: {
    position: 'absolute',
    top: 95, // Start just below the main profile picture
    left: '50%',
    transform: [{ translateX: -45 }],
    zIndex: 50, // Above content but below profile picture (which is 100)
    backgroundColor: '#1a1a1a',
    borderRadius: 45,
    paddingTop: 10,
    paddingBottom: 10,
    paddingHorizontal: 5,
    borderWidth: 2,
    borderColor: '#333',
  },
  dropdownCharacter: {
    marginBottom: 10,
  },
  dropdownImageWrapper: {
    width: 90,
    height: 90,
  },
  dropdownImagePressed: {
    opacity: 0.7,
  },
  dropdownProfilePicture: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: '#333',
    backgroundColor: '#1a1a1a',
    alignSelf: 'center',
  },
  profilePicture: {
    width: 90,
    height: 90,
    borderRadius: 45,
  },
  placeholderPicture: {
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 2,
    borderColor: "#333",
  },
  profilePicturePlaceholder: {
    width: 90,
    height: 90,
    borderRadius: 45,
    borderWidth: 2,
    borderColor: "#333",
    backgroundColor: "#1a1a1a",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#666",
    fontSize: 32,
    fontWeight: "bold",
  },
  profileInfo: {
    flex: 1,
  },
  username: {
    color: "#ffffff",
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
  },
  plusButton: {
    position: "absolute",
    top: 20,
    right: 20,
    padding: 8,
    zIndex: 10,
  },
  plusButtonPressed: {
    opacity: 0.7,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  dropdownSettingsButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 10,
    padding: 6,
  },
  dropdownSettingsIcon: {
    color: '#fff',
    fontSize: 22,
  },
  settingsButton: {
    position: 'absolute',
    top: 20,
    right: 60,
    padding: 8,
    zIndex: 10,
  },
  settingsIcon: {
    color: '#fff',
    fontSize: 28,
  },
  plusButtonText: {
    color: "#ffffff",
    fontSize: 28,
    fontWeight: "300",
    lineHeight: 28,
  },
  statsContainer: {
    flexDirection: "row",
    justifyContent: "space-around",
  },
  statItem: {
    alignItems: "center",
  },
  statNumber: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
  },
  statLabel: {
    color: "#999",
    fontSize: 13,
    marginTop: 2,
  },
  bioSection: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  displayName: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 4,
  },
  bio: {
    color: "#ffffff",
    fontSize: 14,
    lineHeight: 18,
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
  contentContainer: {
    flex: 1,
    paddingBottom: 20,
  },
  grid: {
    padding: 2,
  },
  gridItem: {
    flex: 1 / 3,
    aspectRatio: 1,
    padding: 2,
  },
  gridItemPressed: {
    opacity: 0.6,
  },
  gridImage: {
    width: "100%",
    height: "100%",
    borderRadius: 8,
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginBottom: 20,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
    marginTop: 8,
  },
  tabContainer: {
    flexDirection: "row",
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  tab: {
    flex: 1,
    paddingVertical: 12,
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "transparent",
  },
  activeTab: {
    borderBottomColor: "#ffffff",
  },
  tabIcon: {
    fontSize: 24,
    opacity: 0.4,
  },
  activeTabIcon: {
    opacity: 1,
  },
  searchButton: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 6,
    marginBottom: 20,
  },
  searchButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  title: {
    fontSize: 18,
    fontWeight: "400",
    color: "#999",
    marginBottom: 30,
    textAlign: "center",
  },
  logoutButton: {
    backgroundColor: "#ff3b30",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    marginTop: 16,
    alignSelf: "center",
  },
  logoutButtonPressed: {
    opacity: 0.7,
  },
  logoutButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  bottomNav: {
    flexDirection: "row",
    justifyContent: "space-around",
    alignItems: "center",
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#262626",
    backgroundColor: "#000000",
  },
  navButton: {
    padding: 8,
  },
  navIcon: {
    fontSize: 24,
    color: "#ffffff",
  },
  previewModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    zIndex: 1000,
  },
  previewBackButton: {
    position: 'absolute',
    top: 50,
    left: 20,
    zIndex: 1001,
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 25,
  },
  previewBackArrow: {
    fontSize: 28,
    color: '#fff',
    fontWeight: 'bold',
  },
  previewScrollView: {
    flex: 1,
    width: '100%',
  },
  previewScrollContent: {
    paddingVertical: 80,
    paddingHorizontal: 20,
  },
  previewContent: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#1a1a1a',
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    alignSelf: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  previewImage: {
    width: 200,
    height: 350,
    borderRadius: 12,
    marginBottom: 20,
    alignSelf: 'center',
  },
  previewName: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 15,
  },
  previewBackstory: {
    fontSize: 14,
    color: '#ccc',
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 15,
    width: '100%',
  },
});
