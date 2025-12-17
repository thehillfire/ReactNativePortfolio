import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, onSnapshot, orderBy, query, serverTimestamp, setDoc, updateDoc } from "firebase/firestore";
import { useEffect, useRef, useState } from "react";
import { FlatList, Image, KeyboardAvoidingView, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../config/firebase";
import { useAuth } from "../context/AuthContext";

type Message = {
  id: string;
  text: string;
  senderId: string;
  timestamp: Date;
};

export default function Chat() {
  const router = useRouter();
  const { userId, userName, userImage } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [conversationId, setConversationId] = useState<string | null>(null);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (!user || !userId) return;

    // Create conversation ID (sorted to ensure consistency)
    const participants = [user.uid, userId as string].sort();
    const convId = participants.join("_");
    setConversationId(convId);

    // Initialize conversation if it doesn't exist
    const initConversation = async () => {
      const convRef = doc(db, "conversations", convId);
      await setDoc(convRef, {
        participants,
        lastMessage: "",
        lastMessageTime: serverTimestamp(),
        unreadBy: [],
      }, { merge: true });
    };
    initConversation();

    // Listen to messages
    const messagesRef = collection(db, "conversations", convId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const msgs: Message[] = [];
      snapshot.forEach((doc) => {
        const data = doc.data();
        msgs.push({
          id: doc.id,
          text: data.text,
          senderId: data.senderId,
          timestamp: data.timestamp?.toDate() || new Date(),
        });
      });
      setMessages(msgs);
      
      // Mark messages as read
      if (msgs.length > 0) {
        updateDoc(doc(db, "conversations", convId), {
          unreadBy: []
        }).catch(console.error);
      }
    });

    return () => unsubscribe();
  }, [user, userId]);

  const sendMessage = async () => {
    if (!inputText.trim() || !user || !conversationId) return;

    const messageText = inputText.trim();
    setInputText("");

    try {
      // Add message
      const messagesRef = collection(db, "conversations", conversationId, "messages");
      await addDoc(messagesRef, {
        text: messageText,
        senderId: user.uid,
        timestamp: serverTimestamp(),
      });

      // Update conversation
      await updateDoc(doc(db, "conversations", conversationId), {
        lastMessage: messageText,
        lastMessageTime: serverTimestamp(),
        unreadBy: [userId as string],
      });

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  };

  const renderMessage = ({ item }: { item: Message }) => {
    const isMyMessage = item.senderId === user?.uid;
    
    return (
      <View style={[
        styles.messageContainer,
        isMyMessage ? styles.myMessageContainer : styles.otherMessageContainer
      ]}>
        <View style={[
          styles.messageBubble,
          isMyMessage ? styles.myMessage : styles.otherMessage
        ]}>
          <Text style={[
            styles.messageText,
            isMyMessage ? styles.myMessageText : styles.otherMessageText
          ]}>
            {item.text}
          </Text>
        </View>
        <Text style={styles.timestamp}>{formatTime(item.timestamp)}</Text>
      </View>
    );
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={0}
    >
      {/* Header */}
      <View style={styles.header}>
        <Pressable onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backText}>←</Text>
        </Pressable>
        <Image source={{ uri: userImage as string }} style={styles.headerAvatar} />
        <Text style={styles.headerTitle}>{userName}</Text>
        <View style={styles.placeholder} />
      </View>

      {/* Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.messagesContainer}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />

      {/* Input */}
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          placeholderTextColor="#999"
          value={inputText}
          onChangeText={setInputText}
          multiline
          maxLength={500}
        />
        <Pressable
          style={styles.sendButton}
          onPress={sendMessage}
          disabled={!inputText.trim()}
        >
          <Text style={[
            styles.sendText,
            !inputText.trim() && styles.sendTextDisabled
          ]}>
            Send
          </Text>
        </Pressable>
      </View>
    </KeyboardAvoidingView>
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
    padding: 8,
    marginRight: 8,
  },
  backText: {
    color: "#ffffff",
    fontSize: 24,
  },
  headerAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  headerTitle: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "600",
    flex: 1,
  },
  placeholder: {
    width: 40,
  },
  messagesContainer: {
    padding: 16,
    flexGrow: 1,
  },
  messageContainer: {
    marginBottom: 12,
    maxWidth: "75%",
  },
  myMessageContainer: {
    alignSelf: "flex-end",
    alignItems: "flex-end",
  },
  otherMessageContainer: {
    alignSelf: "flex-start",
    alignItems: "flex-start",
  },
  messageBubble: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    marginBottom: 4,
  },
  myMessage: {
    backgroundColor: "#0095f6",
  },
  otherMessage: {
    backgroundColor: "#262626",
  },
  messageText: {
    fontSize: 15,
    lineHeight: 20,
  },
  myMessageText: {
    color: "#ffffff",
  },
  otherMessageText: {
    color: "#ffffff",
  },
  timestamp: {
    color: "#666",
    fontSize: 11,
    marginHorizontal: 12,
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: "#262626",
    backgroundColor: "#000000",
  },
  input: {
    flex: 1,
    backgroundColor: "#262626",
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 10,
    color: "#ffffff",
    fontSize: 15,
    maxHeight: 100,
    marginRight: 12,
  },
  sendButton: {
    paddingVertical: 10,
    paddingHorizontal: 4,
  },
  sendText: {
    color: "#0095f6",
    fontSize: 16,
    fontWeight: "600",
  },
  sendTextDisabled: {
    color: "#0095f644",
  },
});
