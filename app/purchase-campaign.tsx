import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";

export default function PurchaseCampaign() {
  const router = useRouter();
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 800,
      useNativeDriver: true,
    }).start();
  }, []);

  const handlePurchase = (count: number, price: string) => {
    console.log(`Purchasing ${count} campaign(s) for ${price}`);
    router.push("/questionnaire");
  };

  return (
    <View style={styles.container}>
      <Pressable 
        style={styles.backButton}
        onPress={() => router.back()}
      >
        <Text style={styles.backArrow}>←</Text>
      </Pressable>
      
      <ScrollView 
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          <View style={styles.cardsContainer}>
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handlePurchase(1, "$1.99")}
            >
              <Text style={styles.cardIcon}>⚔️</Text>
              <Text style={styles.cardTitle}>Single Campaign</Text>
              <Text style={styles.cardPrice}>$1.99</Text>
              <Text style={styles.cardDescription}>Create one new character and embark on their journey</Text>
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handlePurchase(2, "$2.99")}
            >
              <Text style={styles.cardIcon}>🗡️</Text>
              <Text style={styles.cardTitle}>Dual Destiny</Text>
              <Text style={styles.cardPrice}>$2.99</Text>
              <Text style={styles.cardDescription}>2 campaigns • Best value per character</Text>
            </Pressable>
            
            <Pressable
              style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
              onPress={() => handlePurchase(5, "$4.99")}
            >
              <Text style={styles.cardIcon}>👑</Text>
              <Text style={styles.cardTitle}>Legend Pack</Text>
              <Text style={styles.cardPrice}>$4.99</Text>
              <Text style={styles.cardDescription}>5 campaigns • Maximum adventure</Text>
            </Pressable>
          </View>
          
          <Text style={styles.disclaimer}>Payment integration coming soon. Proceeding will create character for free during beta.</Text>
        </Animated.View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000",
  },
  backButton: {
    position: "absolute",
    top: 50,
    left: 20,
    zIndex: 10,
    padding: 10,
  },
  backArrow: {
    fontSize: 32,
    color: "#fff",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 40,
  },
  content: {
    width: '100%',
  },
  title: {
    fontSize: 32,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 16,
    color: "#999",
    marginBottom: 40,
    textAlign: "center",
  },
  cardsContainer: {
    gap: 20,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#1a1a1a",
    borderWidth: 1,
    borderColor: "#333",
    paddingVertical: 24,
    paddingHorizontal: 20,
    borderRadius: 8,
    alignItems: "center",
  },
  cardPressed: {
    opacity: 0.7,
  },
  cardIcon: {
    fontSize: 48,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 22,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 8,
  },
  cardPrice: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 12,
  },
  cardDescription: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  disclaimer: {
    fontSize: 12,
    color: "#666",
    textAlign: "center",
    fontStyle: "italic",
  },
});
