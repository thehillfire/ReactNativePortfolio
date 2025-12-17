import { useRouter } from "expo-router";
import { collection, doc, getDoc, onSnapshot, query, where } from "firebase/firestore";
import { useEffect, useState } from "react";
import { ActivityIndicator, FlatList, Image, Pressable, StyleSheet, Text, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

type Conversation = {
  id: string;
  otherUserId: string;
  otherUserName: string;
  otherUserImage: string;
  lastMessage: string;
  lastMessageTime: Date;
  unread: boolean;
};

export default function Messages() {
  const router = useRouter();
  const { user } = useAuth();
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;

    // Listen to conversations in real-time
    const conversationsRef = collection(db, "conversations");
    const q = query(conversationsRef, where("participants", "array-contains", user.uid));
    
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const convos: Conversation[] = [];
      
      for (const docSnap of snapshot.docs) {
        const data = docSnap.data();
        const otherUserId = data.participants.find((id: string) => id !== user.uid);
        
        // Get other user's info
        const otherUserDoc = await getDoc(doc(db, "characters", otherUserId));
        if (otherUserDoc.exists()) {
          const otherUserData = otherUserDoc.data();
          convos.push({
            id: docSnap.id,
            otherUserId,
            otherUserName: otherUserData.name,
            otherUserImage: otherUserData.imageUrl,
            lastMessage: data.lastMessage || "No messages yet",
            lastMessageTime: data.lastMessageTime?.toDate() || new Date(),
            unread: data.unreadBy?.includes(user.uid) || false,
          });
        }
      }
      
      // Sort by most recent
      convos.sort((a, b) => b.lastMessageTime.getTime() - a.lastMessageTime.getTime());
      setConversations(convos);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  const formatTime = (date: Date) => {
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    
    if (days === 0) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    } else if (days < 7) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }
  };

  const renderConversation = ({ item }: { item: Conversation }) => (
    <Pressable
      style={({ pressed }) => [
        styles.conversationItem,
        pressed && styles.pressed
      ]}
      onPress={() => {
        router.push({
          pathname: "/chat",
          params: { 
            userId: item.otherUserId,
            userName: item.otherUserName,
            userImage: item.otherUserImage
          }
        });
      }}
    >
      <Image source={{ uri: item.otherUserImage }} style={styles.avatar} />
      <View style={styles.conversationInfo}>
        <Text style={[styles.userName, item.unread && styles.unreadText]}>
          {item.otherUserName}
        </Text>
        <Text style={[styles.lastMessage, item.unread && styles.unreadText]} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>
      <Text style={styles.time}>{formatTime(item.lastMessageTime)}</Text>
      {item.unread && <View style={styles.unreadDot} />}
    </Pressable>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Text style={styles.headerTitle}>Messages</Text>
        <Pressable 
          onPress={() => router.push({ pathname: "/search", params: { messageMode: "true" } })}
          style={styles.newMessageButton}
        >
          <Text style={styles.newMessageIcon}>✏️</Text>
        </Pressable>
      </View>

      {/* Conversations List */}
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
        </View>
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderConversation}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation from search</Text>
            </View>
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
    flex: 1,
    textAlign: "center",
  },
  newMessageButton: {
    padding: 8,
  },
  newMessageIcon: {
    fontSize: 24,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  listContainer: {
    flexGrow: 1,
  },
  conversationItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#1a1a1a",
  },
  pressed: {
    backgroundColor: "#0a0a0a",
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    marginRight: 12,
  },
  conversationInfo: {
    flex: 1,
  },
  userName: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "400",
    marginBottom: 4,
  },
  lastMessage: {
    color: "#999",
    fontSize: 14,
  },
  unreadText: {
    fontWeight: "600",
    color: "#ffffff",
  },
  time: {
    color: "#999",
    fontSize: 12,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: "#0095f6",
    marginLeft: 8,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingTop: 100,
  },
  emptyText: {
    color: "#ffffff",
    fontSize: 18,
    marginBottom: 8,
  },
  emptySubtext: {
    color: "#999",
    fontSize: 14,
  },
});
