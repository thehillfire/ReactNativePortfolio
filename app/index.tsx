import { useEffect, useState } from "react";
import { ActivityIndicator, Pressable, StyleSheet, Text, View } from "react-native";



export default function Index() {
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 3000);

    return () => clearTimeout(timer);
  }, []);

  if (isLoading) {
    return (
      <View style = {styles.loadingContainer}>
        <ActivityIndicator size="large" color="#ffffff" />
        <Text style= {styles.loadingText}> Loading Portfolio...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}> This is Javi Caballero's Portfolio</Text>
      </View>
    
      <View style={styles.content}>
        <Text style={styles.contentText}>Welcome to my portfolio app!</Text>
        
        <Pressable
          style={({ pressed }) => [
            styles.button,
            pressed && styles.buttonPressed
          ]}
          onPress={() => {
            console.log("Button Pressed");
          }}
        >
          <Text style={styles.buttonText}>View Projects</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
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
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  header: {
    backgroundColor : "#1a1a1a",
    padding: 20,
    paddingTop: 60,
    alignItems: "center",
  },
  headerText: {
    color: "#ffffff",
    fontSize: 24,
    fontWeight: "bold",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  contentText: {
    color: "#ffffff",
    fontSize: 16,
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 30,
    paddingVertical: 10,
    borderRadius: 8,
    elevation: 3,
    shadowColor: "#ffffff",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },  
  buttonPressed: {
    backgroundColor: "#E0E0E0",
    transform: [{ scale: 0.98 }],
  },
  buttonText: {
    color: "#000000",
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
  },
});