import { useLocalSearchParams, useRouter } from "expo-router";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

type Following = {
  id: string;
  name: string;
  imageUrl: string;
};

export default function Following() {
  const router = useRouter();
  const { user } = useAuth();
  const { userId } = useLocalSearchParams();
  const [following, setFollowing] = useState<Following[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFollowing();
  }, [user, userId]);

  const loadFollowing = async () => {
    // Use provided userId or current user's id
    const targetUserId = (userId as string) || user?.uid;
    if (!targetUserId) return;
    
    setLoading(true);
    try {
      const userDoc = await getDoc(doc(db, "characters", targetUserId));
      if (userDoc.exists()) {
        const data = userDoc.data();
        const followingIds = data.following || [];
        
        // Load each followed user's data
        const followingData: Following[] = [];
        for (const followingId of followingIds) {
          const followingDoc = await getDoc(doc(db, "characters", followingId));
          if (followingDoc.exists()) {
            const fData = followingDoc.data();
            followingData.push({
              id: followingId,
              name: fData.name,
              imageUrl: fData.imageUrl,
            });
          }
        }
        
        setFollowing(followingData);
      }
    } catch (error) {
      console.error("Error loading following:", error);
    } finally {
      setLoading(false);
    }
  };

  const renderFollowing = ({ item }: { item: Following }) => (
    <Pressable
      style={({ pressed }) => [
        styles.userItem,
        pressed && styles.pressed
      ]}
      onPress={() => {
        console.log("Navigating to profile:", item.name, "ID:", item.id);
        router.push({
          pathname: "/user-profile",
          params: { userId: item.id }
        });
      }}
    >
      <Image source={{ uri: item.imageUrl }} style={styles.avatar} />
      <Text style={styles.userName}>{item.name}</Text>
    </Pressable>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Following</Text>
        <View style={styles.placeholder} />
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={following}
          renderItem={renderFollowing}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>Not following anyone yet</Text>
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#262626",
  },
  pressed: {
    backgroundColor: "#1a1a1a",
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
