import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from "expo-router";
import { addDoc, collection, doc, getDoc, getDocs, onSnapshot, orderBy, query, serverTimestamp, where } from "firebase/firestore";
import React, { useEffect, useRef, useState } from "react";
import { Animated, Dimensions, ImageBackground, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from "react-native";
import { db } from "../config/firebase";
import { getSceneImage } from "../config/pexels";
import { generateNarration } from "../config/together";
import { useAuth } from "../context/AuthContext";

interface Message {
  id: string;
  role: "narrator" | "player";
  content: string;
  timestamp: any;
  fadeAnim?: Animated.Value;
  imageUrl?: string; // Placeholder for future scene images
  photographer?: string; // Photo credit from Pexels
}

const { height: SCREEN_HEIGHT } = Dimensions.get('window');

export default function CampaignGame() {
  const router = useRouter();
  const { characterId } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [loading, setLoading] = useState(false);
  const [campaignId, setCampaignId] = useState<string | null>(null);
  const [characterName, setCharacterName] = useState("");
  const [characterGender, setCharacterGender] = useState("");
  const [characterBackstory, setCharacterBackstory] = useState("");
  const [followedCharacters, setFollowedCharacters] = useState<any[]>([]);
  const [showInput, setShowInput] = useState(false);
  const [typingText, setTypingText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);
  const inputFadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    loadCharacterAndCampaign();
  }, []);

  const loadCharacterAndCampaign = async () => {
    if (!user || !characterId) return;

    try {
      // Get character info
      const characterRef = doc(db, "characters", characterId as string);
      const characterSnap = await getDoc(characterRef);
      if (characterSnap.exists()) {
        const charData = characterSnap.data();
        setCharacterName(charData.name || "Adventurer");
        setCharacterGender(charData.gender || "");
        setCharacterBackstory(charData.backstory || "");
        
        // Load followed characters for potential NPC appearances
        const following = charData.following || [];
        if (following.length > 0) {
          const followedChars = [];
          for (const followedId of following.slice(0, 5)) { // Limit to 5 for performance
            const followedRef = doc(db, "characters", followedId);
            const followedSnap = await getDoc(followedRef);
            if (followedSnap.exists()) {
              followedChars.push({
                id: followedId,
                userId: followedSnap.data().userId,
                name: followedSnap.data().name,
                gender: followedSnap.data().gender,
              });
            }
          }
          setFollowedCharacters(followedChars);
        }
      }

      // Check for existing campaign for this character
      const campaignsRef = collection(db, "campaigns");
      const q = query(
        campaignsRef,
        where("userId", "==", user.uid),
        where("characterId", "==", characterId)
      );

      const campaignSnapshot = await getDocs(q);
      
      if (!campaignSnapshot.empty) {
        // Load existing campaign
        const campaignDoc = campaignSnapshot.docs[0];
        setCampaignId(campaignDoc.id);
        loadMessages(campaignDoc.id);
      } else {
        // Start new campaign
        startNewCampaign();
      }
    } catch (error) {
      console.error("Error loading campaign:", error);
    }
  };

  const startNewCampaign = async () => {
    if (!user || !characterId) return;

    try {
      setLoading(true);
      
      // Create new campaign document with consequence tracking
      const campaignRef = await addDoc(collection(db, "campaigns"), {
        userId: user.uid,
        characterId: characterId,
        createdAt: serverTimestamp(),
        lastActivity: serverTimestamp(),
        consequences: [], // Track pending consequences
        keyEvents: [], // Track major story events
        introducedCharacters: [], // Track which followed users appeared
      });

      setCampaignId(campaignRef.id);

      // Generate opening narration based on character's backstory
      const pronoun = characterGender === "male" ? "he" : characterGender === "female" ? "she" : "they";
      const possessive = characterGender === "male" ? "his" : characterGender === "female" ? "her" : "their";
      
      // Randomly decide if a followed character appears (30% chance)
      let npcIntro = "";
      if (followedCharacters.length > 0 && Math.random() < 0.3) {
        const randomNPC = followedCharacters[Math.floor(Math.random() * followedCharacters.length)];
        const npcPronoun = randomNPC.gender === "male" ? "he" : randomNPC.gender === "female" ? "she" : "they";
        npcIntro = ` A ${randomNPC.gender} warrior named ${randomNPC.name} may cross ${possessive} path.`;
        
        // Track this character appearance
        await addDoc(collection(db, "campaigns", campaignRef.id, "messages"), {
          role: "system",
          content: `NPC_INTRODUCED:${randomNPC.id}:${randomNPC.userId}`,
          timestamp: serverTimestamp(),
        });
      }
      
      const openingPrompt = `You are a masterful fantasy RPG narrator creating a deeply immersive story.

CHARACTER BACKSTORY:
${characterBackstory}

Based on this backstory, begin ${characterName}'s adventure. Your opening should:
1. Reference elements from ${possessive} backstory (${possessive} origin, motivation, or defining traits)
2. Place ${pronoun} in a situation that relates to who ${pronoun} is
3. Present a compelling hook or immediate challenge
4. Be 3-4 sentences that draw the player into the world${npcIntro}

Remember: This story must feel personal to ${characterName}. Every event should connect to who ${pronoun} is and where ${pronoun} comes from.`;
      
      const opening = await generateNarration(characterBackstory, [], openingPrompt);

      // Fetch scene image based on opening narration
      const sceneImage = await getSceneImage(opening);

      // Add opening message with scene image
      await addDoc(collection(db, "campaigns", campaignRef.id, "messages"), {
        role: "narrator",
        content: opening,
        imageUrl: sceneImage?.url || "",
        photographer: sceneImage?.photographer || "",
        timestamp: serverTimestamp(),
      });

      loadMessages(campaignRef.id);
    } catch (error) {
      console.error("Error starting campaign:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = (campaignId: string) => {
    const messagesRef = collection(db, "campaigns", campaignId, "messages");
    const q = query(messagesRef, orderBy("timestamp", "asc"));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const loadedMessages: Message[] = [];
      snapshot.forEach((doc) => {
        const msgData = doc.data();
        loadedMessages.push({ 
          id: doc.id, 
          ...msgData,
          fadeAnim: new Animated.Value(0),
        } as Message);
      });
      setMessages(loadedMessages);
      
      // Animate messages in sequence
      loadedMessages.forEach((msg, index) => {
        if (msg.fadeAnim) {
          Animated.timing(msg.fadeAnim, {
            toValue: 1,
            duration: 800,
            delay: index * 200,
            useNativeDriver: true,
          }).start();
        }
      });
      
      setTimeout(() => {
        scrollViewRef.current?.scrollToEnd({ animated: true });
        if (loadedMessages[loadedMessages.length - 1]?.role === "narrator") {
          setShowInput(true);
          Animated.timing(inputFadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start();
        }
      }, loadedMessages.length * 200 + 500);
    });

    return unsubscribe;
  };

  const sendAction = async () => {
    if (!inputText.trim() || !campaignId || !user) return;

    const action = inputText.trim();
    setInputText("");
    setShowInput(false);
    setLoading(true);
    
    // Fade out input
    Animated.timing(inputFadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    try {
      // Add player action
      await addDoc(collection(db, "campaigns", campaignId, "messages"), {
        role: "player",
        content: action,
        timestamp: serverTimestamp(),
      });

      // Build context from recent messages
      const recentMessages = messages
        .slice(-8)
        .map(m => `${m.role === "narrator" ? "Narrator" : characterName}: ${m.content}`)
        .join("\n\n");

      const pronoun = characterGender === "male" ? "he" : characterGender === "female" ? "she" : "they";
      const possessive = characterGender === "male" ? "his" : characterGender === "female" ? "her" : "their";

      // Count turns to introduce delayed consequences
      const turnNumber = messages.filter(m => m.role === "player").length + 1;
      
      // Randomly introduce followed characters as NPCs (20% chance every 3 turns)
      let npcHint = "";
      if (followedCharacters.length > 0 && turnNumber % 3 === 0 && Math.random() < 0.2) {
        const randomNPC = followedCharacters[Math.floor(Math.random() * followedCharacters.length)];
        npcHint = ` Consider introducing ${randomNPC.name} (a ${randomNPC.gender} character) into the scene as an ally, rival, or mysterious figure.`;
        
        // Send notification to the user whose character appeared
        try {
          const conversationsRef = collection(db, "conversations");
          const q = query(
            conversationsRef,
            where("participants", "array-contains", user.uid)
          );
          const convSnap = await getDocs(q);
          
          let conversationId = null;
          for (const convDoc of convSnap.docs) {
            const participants = convDoc.data().participants;
            if (participants.includes(randomNPC.userId)) {
              conversationId = convDoc.id;
              break;
            }
          }
          
          if (!conversationId) {
            const newConv = await addDoc(conversationsRef, {
              participants: [user.uid, randomNPC.userId],
              lastMessage: `Your character ${randomNPC.name} appeared in ${characterName}'s adventure!`,
              lastMessageTime: serverTimestamp(),
              unreadBy: [randomNPC.userId],
            });
            conversationId = newConv.id;
          }
          
          await addDoc(collection(db, "conversations", conversationId, "messages"), {
            senderId: "system",
            text: `🎭 Your character ${randomNPC.name} has appeared in ${characterName}'s adventure! They're writing your character's story right now.`,
            timestamp: serverTimestamp(),
          });
          
          // Track this introduction
          await addDoc(collection(db, "campaigns", campaignId, "messages"), {
            role: "system",
            content: `NPC_INTRODUCED:${randomNPC.id}:${randomNPC.userId}`,
            timestamp: serverTimestamp(),
          });
        } catch (notifError) {
          console.error("Error sending NPC notification:", notifError);
        }
      }

      // Generate AI response with consequence awareness
      const narratorPrompt = `You are a masterful fantasy RPG narrator creating an immersive, consequence-driven story.

CHARACTER BACKSTORY:
${characterBackstory}

CHARACTER: ${characterName} (${pronoun}/${pronoun === "he" ? "him" : pronoun === "she" ? "her" : "them"})
ACTION TAKEN: "${action}"

RECENT STORY:
${recentMessages}

Narrate what happens next (3-4 sentences). CRITICAL RULES:
1. Every consequence must feel natural and realistic - actions have ripple effects
2. Reference ${characterName}'s backstory when relevant (${possessive} past should influence the present)
3. Major actions (violence, theft, etc.) should create future complications
4. Each choice should open new possibilities and close others
5. The world reacts intelligently - NPCs remember, evidence exists, rumors spread${npcHint}

Make this feel like ${characterName}'s unique story, not a generic adventure.`;

      const response = await generateNarration(characterBackstory, [recentMessages], action);
      
      // Fetch scene image for this narration
      const sceneImage = await getSceneImage(response);

      // Add narrator response with scene image
      await addDoc(collection(db, "campaigns", campaignId, "messages"), {
        role: "narrator",
        content: response,
        imageUrl: sceneImage?.url || "",
        photographer: sceneImage?.photographer || "",
        timestamp: serverTimestamp(),
      });

    } catch (error) {
      console.error("Error sending action:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Ambient background gradient */}
      <LinearGradient
        colors={['#0a0a0a', '#1a0a1a', '#0a0a1a']}
        style={StyleSheet.absoluteFillObject}
      />
      
      <View style={styles.header}>
        <Pressable onPress={() => router.back()}>
          <Text style={styles.backButton}>← Exit</Text>
        </Pressable>
        <View style={styles.titleContainer}>
          <Text style={styles.title}>{characterName}'s Quest</Text>
          <View style={styles.divider} />
        </View>
        <View style={{ width: 60 }} />
      </View>

      <ScrollView 
        ref={scrollViewRef}
        style={styles.storyContainer}
        contentContainerStyle={styles.storyContent}
        showsVerticalScrollIndicator={false}
      >
        {messages.map((message, index) => (
          <Animated.View
            key={message.id}
            style={[
              styles.storyCard,
              message.role === "player" && styles.actionCard,
              {
                opacity: message.fadeAnim || 1,
                transform: [{
                  translateY: message.fadeAnim?.interpolate({
                    inputRange: [0, 1],
                    outputRange: [50, 0],
                  }) || 0
                }]
              }
            ]}
          >
            {message.role === "narrator" && (
              <>
                {/* Scene image with blur effect */}
                {message.imageUrl ? (
                  <ImageBackground
                    source={{ uri: message.imageUrl }}
                    style={styles.sceneImage}
                    imageStyle={styles.sceneImageStyle}
                  >
                    <BlurView intensity={60} style={styles.blurContainer}>
                      <View style={styles.imageOverlay}>
                        <Text style={styles.sceneLabel}>Scene #{Math.floor(index / 2) + 1}</Text>
                        {message.photographer && (
                          <Text style={styles.photographerCredit}>📸 {message.photographer}</Text>
                        )}
                      </View>
                    </BlurView>
                  </ImageBackground>
                ) : (
                  <View style={styles.imagePlaceholder}>
                    <LinearGradient
                      colors={['#1a1a2e', '#16213e', '#0f3460']}
                      style={styles.imagePlaceholderGradient}
                    >
                      <Text style={styles.imagePlaceholderText}>🎨</Text>
                      <Text style={styles.imagePlaceholderLabel}>Scene #{Math.floor(index / 2) + 1}</Text>
                    </LinearGradient>
                  </View>
                )}
                
                <View style={styles.narratorContent}>
                  <View style={styles.narratorHeader}>
                    <Text style={styles.narratorIcon}>📖</Text>
                    <Text style={styles.narratorLabel}>The Story Unfolds</Text>
                  </View>
                  <Text style={styles.narratorText}>{message.content}</Text>
                  <View style={styles.ornamentDivider}>
                    <View style={styles.ornamentDot} />
                    <View style={styles.ornamentLine} />
                    <View style={styles.ornamentDot} />
                  </View>
                </View>
              </>
            )}
            
            {message.role === "player" && (
              <View style={styles.actionContent}>
                <View style={styles.actionHeader}>
                  <Text style={styles.actionIcon}>⚔️</Text>
                  <Text style={styles.actionLabel}>Your Action</Text>
                </View>
                <Text style={styles.actionText}>{message.content}</Text>
              </View>
            )}
          </Animated.View>
        ))}
        
        {loading && (
          <View style={styles.loadingCard}>
            <LinearGradient
              colors={['#1a1a2e', '#16213e']}
              style={styles.loadingGradient}
            >
              <Text style={styles.loadingText}>✨ Weaving fate...</Text>
              <View style={styles.loadingDots}>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.dot}>•</Text>
              </View>
            </LinearGradient>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {showInput && !loading && (
        <Animated.View 
          style={[
            styles.inputSection,
            { opacity: inputFadeAnim }
          ]}
        >
          <LinearGradient
            colors={['rgba(26, 26, 46, 0.95)', 'rgba(10, 10, 10, 0.98)']}
            style={styles.inputGradient}
          >
            <Text style={styles.promptText}>What do you do?</Text>
            <View style={styles.inputRow}>
              <TextInput
                style={styles.input}
                placeholder="Describe your action..."
                placeholderTextColor="#666"
                value={inputText}
                onChangeText={setInputText}
                multiline
                maxLength={200}
              />
              <Pressable
                style={[styles.sendButton, !inputText.trim() && styles.sendButtonDisabled]}
                onPress={sendAction}
                disabled={!inputText.trim()}
              >
                <LinearGradient
                  colors={inputText.trim() ? ['#4a9eff', '#2a4a7c'] : ['#1a1a1a', '#0a0a0a']}
                  style={styles.sendGradient}
                >
                  <Text style={styles.sendIcon}>→</Text>
                </LinearGradient>
              </Pressable>
            </View>
            <Text style={styles.charCount}>{inputText.length}/200</Text>
          </LinearGradient>
        </Animated.View>
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
    paddingBottom: 20,
  },
  backButton: {
    color: "#999",
    fontSize: 16,
    fontWeight: "600",
  },
  titleContainer: {
    alignItems: "center",
  },
  title: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#ffffff",
    letterSpacing: 1,
  },
  divider: {
    width: 60,
    height: 2,
    backgroundColor: "#4a9eff",
    marginTop: 8,
    borderRadius: 1,
  },
  storyContainer: {
    flex: 1,
  },
  storyContent: {
    padding: 20,
    paddingBottom: 200,
  },
  storyCard: {
    marginBottom: 30,
    borderRadius: 16,
    overflow: "hidden",
  },
  actionCard: {
    marginLeft: "10%",
  },
  
  // Image placeholder styles
  sceneImage: {
    width: "100%",
    height: 220,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  sceneImageStyle: {
    borderRadius: 12,
  },
  blurContainer: {
    flex: 1,
    justifyContent: "flex-end",
  },
  imageOverlay: {
    padding: 12,
    paddingBottom: 16,
  },
  sceneLabel: {
    color: "#ffffff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 1,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  photographerCredit: {
    color: "#cccccc",
    fontSize: 10,
    marginTop: 4,
    textShadowColor: "rgba(0, 0, 0, 0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
  },
  imagePlaceholder: {
    width: "100%",
    height: 200,
    marginBottom: 16,
    borderRadius: 12,
    overflow: "hidden",
  },
  imagePlaceholderGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  imagePlaceholderText: {
    fontSize: 48,
    marginBottom: 8,
  },
  imagePlaceholderLabel: {
    color: "#4a9eff",
    fontSize: 14,
    fontWeight: "600",
    letterSpacing: 1,
  },
  
  // Narrator styles
  narratorContent: {
    backgroundColor: "rgba(26, 26, 46, 0.6)",
    padding: 20,
    borderWidth: 1,
    borderColor: "rgba(74, 158, 255, 0.3)",
    borderRadius: 12,
  },
  narratorHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  narratorIcon: {
    fontSize: 20,
    marginRight: 8,
  },
  narratorLabel: {
    color: "#4a9eff",
    fontSize: 12,
    fontWeight: "bold",
    letterSpacing: 2,
    textTransform: "uppercase",
  },
  narratorText: {
    fontSize: 18,
    color: "#ffffff",
    lineHeight: 28,
    fontWeight: "400",
    letterSpacing: 0.5,
  },
  ornamentDivider: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 16,
    justifyContent: "center",
  },
  ornamentDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: "#4a9eff",
  },
  ornamentLine: {
    width: 40,
    height: 1,
    backgroundColor: "#4a9eff",
    marginHorizontal: 8,
  },
  
  // Action styles
  actionContent: {
    backgroundColor: "rgba(42, 74, 124, 0.4)",
    padding: 16,
    borderWidth: 1,
    borderColor: "rgba(74, 158, 255, 0.4)",
    borderRadius: 12,
  },
  actionHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  actionIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  actionLabel: {
    color: "#ffffff",
    fontSize: 11,
    fontWeight: "bold",
    letterSpacing: 1.5,
    textTransform: "uppercase",
    opacity: 0.8,
  },
  actionText: {
    fontSize: 16,
    color: "#ffffff",
    lineHeight: 24,
    fontStyle: "italic",
  },
  
  // Loading styles
  loadingCard: {
    marginBottom: 30,
    borderRadius: 12,
    overflow: "hidden",
  },
  loadingGradient: {
    padding: 24,
    alignItems: "center",
  },
  loadingText: {
    fontSize: 16,
    color: "#4a9eff",
    fontWeight: "600",
    marginBottom: 12,
  },
  loadingDots: {
    flexDirection: "row",
    gap: 8,
  },
  dot: {
    fontSize: 24,
    color: "#4a9eff",
    opacity: 0.6,
  },
  
  // Input section styles
  inputSection: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputGradient: {
    padding: 20,
    paddingBottom: 40,
  },
  promptText: {
    fontSize: 14,
    color: "#4a9eff",
    fontWeight: "bold",
    marginBottom: 12,
    letterSpacing: 1,
    textTransform: "uppercase",
  },
  inputRow: {
    flexDirection: "row",
    gap: 12,
    alignItems: "flex-end",
  },
  input: {
    flex: 1,
    backgroundColor: "rgba(26, 26, 46, 0.8)",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
    color: "#ffffff",
    maxHeight: 120,
    borderWidth: 1,
    borderColor: "rgba(74, 158, 255, 0.3)",
  },
  charCount: {
    fontSize: 11,
    color: "#666",
    textAlign: "right",
    marginTop: 8,
  },
  sendButton: {
    width: 50,
    height: 50,
    borderRadius: 25,
    overflow: "hidden",
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendGradient: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  sendIcon: {
    fontSize: 24,
    color: "#ffffff",
    fontWeight: "bold",
  },
});
