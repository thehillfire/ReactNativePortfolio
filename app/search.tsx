import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayRemove, arrayUnion, collection, doc, getDoc, getDocs, query, updateDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

type UserResult = {
  id: string;
  name: string;
  imageUrl: string;
};

export default function Search() {
  const router = useRouter();
  const { user } = useAuth();
  const { messageMode } = useLocalSearchParams();
  const [searchQuery, setSearchQuery] = useState("");
  const [results, setResults] = useState<UserResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [following, setFollowing] = useState<Set<string>>(new Set());

  useEffect(() => {
    loadFollowing();
  }, [user]);

  useEffect(() => {
    handleSearch();
  }, [searchQuery]);

  const loadFollowing = async () => {
    if (!user) return;
    try {
      const userDoc = await getDoc(doc(db, "characters", user.uid));
      if (userDoc.exists()) {
        const data = userDoc.data();
        setFollowing(new Set(data.following || []));
      }
    } catch (error) {
      console.error("Error loading following:", error);
    }
  };

  const handleFollow = async (targetUserId: string) => {
    if (!user) return;
    
    try {
      const isFollowing = following.has(targetUserId);
      
      // Update current user's following list
      await updateDoc(doc(db, "characters", user.uid), {
        following: isFollowing ? arrayRemove(targetUserId) : arrayUnion(targetUserId)
      });
      
      // Update target user's followers list
      await updateDoc(doc(db, "characters", targetUserId), {
        followers: isFollowing ? arrayRemove(user.uid) : arrayUnion(user.uid)
      });
      
      // Update local state
      const newFollowing = new Set(following);
      if (isFollowing) {
        newFollowing.delete(targetUserId);
      } else {
        newFollowing.add(targetUserId);
      }
      setFollowing(newFollowing);
      
      console.log(isFollowing ? "Unfollowed" : "Followed", targetUserId);
    } catch (error) {
      console.error("Follow error:", error);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      setResults([]);
      return;
    }

    setSearching(true);
    try {
      console.log("Searching for:", searchQuery);
      // Search for characters by name (case-insensitive)
      const charactersRef = collection(db, "characters");
      const q = query(charactersRef);
      const querySnapshot = await getDocs(q);
      
      const searchResults: UserResult[] = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        console.log("Checking character:", data.name);
        if (data.name.toLowerCase().includes(searchQuery.toLowerCase())) {
          console.log("Match found:", data.name);
          searchResults.push({
            id: doc.id,
            name: data.name,
            imageUrl: data.imageUrl,
          });
        }
      });
      
      console.log("Search results:", searchResults.length);
      setResults(searchResults);
    } catch (error) {
      console.error("Search error:", error);
    } finally {
      setSearching(false);
    }
  };

  const renderUser = ({ item }: { item: UserResult }) => {
    const isFollowing = following.has(item.id);
    const isOwnProfile = user?.uid === item.id;
    
    return (
      <View style={styles.userItem}>
        <Pressable
          style={styles.userInfo}
          onPress={() => {
            console.log("View profile:", item.name);
            if (isOwnProfile) {
              // Navigate to own profile page
              router.push("/projects");
            } else if (messageMode === "true") {
              // Navigate to chat
              router.push({
                pathname: "/chat",
                params: { 
                  userId: item.id,
                  userName: item.name,
                  userImage: item.imageUrl
                }
              });
            } else {
              // Navigate to user profile page
              router.push({
                pathname: "/user-profile",
                params: { userId: item.id }
              });
            }
          }}
        >
          <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
          <Text style={styles.userName}>{item.name}</Text>
        </Pressable>
        {!isOwnProfile && messageMode !== "true" && (
          <Pressable
            style={[styles.followButton, isFollowing && styles.followingButton]}
            onPress={() => handleFollow(item.id)}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? "Following" : "Follow"}
            </Text>
          </Pressable>
        )}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Search Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <TextInput
          style={styles.searchInput}
          placeholder="Search users..."
          placeholderTextColor="#666"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoFocus
        />
      </View>

      {/* Search Results */}
      {searching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={results}
          renderItem={renderUser}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            searchQuery ? (
              <Text style={styles.emptyText}>No users found</Text>
            ) : (
              <Text style={styles.emptyText}>Search for users by name</Text>
            )
          }
        />
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
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  backButton: {
    paddingRight: 12,
  },
  backText: {
    color: "#ffffff",
    fontSize: 24,
  },
  searchInput: {
    flex: 1,
    backgroundColor: "#262626",
    color: "#ffffff",
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    fontSize: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    padding: 16,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  userInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  pressed: {
    opacity: 0.7,
  },
  followButton: {
    backgroundColor: "#0095f6",
    paddingHorizontal: 20,
    paddingVertical: 6,
    borderRadius: 6,
  },
  followingButton: {
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#333",
  },
  followButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
  },
  followingButtonText: {
    color: "#ffffff",
  },
  avatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    marginRight: 12,
  },
  userName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "500",
  },
  emptyText: {
    color: "#666",
    fontSize: 16,
    textAlign: "center",
    marginTop: 40,
  },
});
