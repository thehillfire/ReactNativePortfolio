import { useFocusEffect } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import { arrayRemove, arrayUnion, doc, getDoc, updateDoc } from "firebase/firestore";
import { useCallback, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

interface Post {
  id: string;
  imageUrl: string;
  name: string;
}

export default function UserProfile() {
  const router = useRouter();
  const { userId } = useLocalSearchParams();
  const { user } = useAuth();
  const [characterName, setCharacterName] = useState("");
  const [characterImageUrl, setCharacterImageUrl] = useState<string | null>(null);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [isFollowing, setIsFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [posts, setPosts] = useState<Post[]>([]);

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
        
        // Load posts from users that THIS profile is following
        const followingIds = data.following || [];
        const postsData: Post[] = [];
        
        for (const followingUserId of followingIds) {
          // Skip if it's the profile owner themselves (should never happen, but safety check)
          if (followingUserId === userId) {
            console.log("Skipping self in posts grid");
            continue;
          }
          
          const followedUserDoc = await getDoc(doc(db, "characters", followingUserId));
          if (followedUserDoc.exists()) {
            const followedUserData = followedUserDoc.data();
            postsData.push({
              id: followingUserId,
              imageUrl: followedUserData.imageUrl,
              name: followedUserData.name
            });
          }
        }
        
        setPosts(postsData);
        
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

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>{characterName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Profile Section */}
      <View style={styles.profileHeader}>
        <View style={styles.profilePictureWrapper}>
          {characterImageUrl ? (
            <Image 
              source={{ uri: characterImageUrl }}
              style={styles.profilePicture}
              resizeMode="cover"
            />
          ) : (
            <View style={styles.profilePicturePlaceholder}>
              <Text style={styles.placeholderText}>?</Text>
            </View>
          )}
        </View>
        
        <View style={styles.profileInfo}>
          <Text style={styles.username}>{characterName}</Text>
          <View style={styles.statsContainer}>
            <View style={styles.statItem}>
              <Text style={styles.statNumber}>{posts.length}</Text>
              <Text style={styles.statLabel}>posts</Text>
            </View>
            <Pressable 
              style={styles.statItem}
              onPress={() => {
                console.log("View followers of", userId);
                router.push({
                  pathname: "/followers",
                  params: { userId: userId }
                });
              }}
            >
              <Text style={styles.statNumber}>{followersCount}</Text>
              <Text style={styles.statLabel}>followers</Text>
            </Pressable>
            <Pressable 
              style={styles.statItem}
              onPress={() => {
                console.log("View following of", userId);
                router.push({
                  pathname: "/following",
                  params: { userId: userId }
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

      {/* Follow Button */}
      {!isOwnProfile && (
        <View style={styles.actionSection}>
          <Pressable
            style={({ pressed }) => [
              styles.followButton, 
              isFollowing && styles.followingButton,
              pressed && styles.buttonPressed
            ]}
            onPress={handleFollow}
          >
            <Text style={[styles.followButtonText, isFollowing && styles.followingButtonText]}>
              {isFollowing ? "Unfollow" : "Follow"}
            </Text>
          </Pressable>
          <Pressable
            style={({ pressed }) => [
              styles.messageButton,
              pressed && styles.buttonPressed
            ]}
            onPress={() => {
              console.log("Message", userId);
              router.push({
                pathname: "/chat",
                params: { 
                  userId: userId,
                  userName: characterName,
                  userImage: characterImageUrl
                }
              });
            }}
          >
            <Text style={styles.messageButtonText}>Message</Text>
          </Pressable>
        </View>
      )}

      {/* Posts Grid */}
      <FlatList
        data={posts}
        numColumns={3}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <Pressable
            style={({ pressed }) => [
              styles.gridItem,
              pressed && styles.gridItemPressed
            ]}
            onPress={() => {
              console.log("View character:", item.name);
              router.push({
                pathname: "/character-view",
                params: { userId: userId }
              });
            }}
          >
            <Image source={{ uri: item.imageUrl }} style={styles.gridImage} />
          </Pressable>
        )}
        contentContainerStyle={styles.postsGrid}
      />
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingTop: 50,
    paddingBottom: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  backButton: {
    padding: 8,
  },
  backText: {
    color: "#ffffff",
    fontSize: 24,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
  placeholder: {
    width: 40,
  },
  profileHeader: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 10,
  },
  profilePictureWrapper: {
    marginRight: 20,
  },
  profilePicture: {
    width: 90,
    height: 90,
    borderRadius: 45,
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
  actionSection: {
    flexDirection: "row",
    gap: 8,
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  followButton: {
    flex: 1,
    backgroundColor: "#0095f6",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  messageButton: {
    flex: 1,
    backgroundColor: "#262626",
    paddingVertical: 8,
    borderRadius: 6,
    alignItems: "center",
  },
  messageButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "600",
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
  buttonPressed: {
    opacity: 0.6,
  },
  postsGrid: {
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
  },
});
