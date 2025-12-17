import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Animated, Image, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { generateImage } from "../config/stability";
import { generateBackstory } from "../config/together";
import { useAuth } from "../context/AuthContext";
import { uploadImageToStorage } from "../utils/imageStorage";

export default function CharacterCreation() {
  const router = useRouter();
  const { answers } = useLocalSearchParams();
  const { user } = useAuth();
  const [generatedImageUrl, setGeneratedImageUrl] = useState<string | null>(null);
  const [backstory, setBackstory] = useState<string>("");
  const [gender, setGender] = useState<string>("male");
  const [isGenerating, setIsGenerating] = useState(true);
  const [error, setError] = useState("");
  const [debugStatus, setDebugStatus] = useState("Initializing...");
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const imageFadeAnim = useRef(new Animated.Value(0)).current;
  const titleFadeAnim = useRef(new Animated.Value(0)).current;
  const backstoryFadeAnim = useRef(new Animated.Value(0)).current;
  const buttonFadeAnim = useRef(new Animated.Value(0)).current;
  const hasGenerated = useRef(false);

  console.log("CharacterCreation component mounted");
  console.log("User:", user?.uid);
  console.log("Answers:", answers);

  useEffect(() => {
    console.log("Fade animation useEffect triggered");
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, []);

  useEffect(() => {
    if (!hasGenerated.current) {
      console.log("Generate character useEffect triggered");
      hasGenerated.current = true;
      generateCharacter();
    }
  }, []);

  useEffect(() => {
    // Sequential fade-in animation when image is loaded
    if (generatedImageUrl) {
      // First fade in the image
      Animated.timing(imageFadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }).start(() => {
        // Then fade in the title
        Animated.timing(titleFadeAnim, {
          toValue: 1,
          duration: 600,
          useNativeDriver: true,
        }).start(() => {
          // Then fade in the backstory
          Animated.timing(backstoryFadeAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }).start(() => {
            // Finally fade in the button
            Animated.timing(buttonFadeAnim, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }).start();
          });
        });
      });
    }
  }, [generatedImageUrl]);

  const generateCharacter = async () => {
    if (!answers) {
      setDebugStatus("Missing answers");
      setError("Missing questionnaire answers");
      setIsGenerating(false);
      return;
    }

    try {
      const answersArray = JSON.parse(answers as string);
      console.log("Parsed answers:", answersArray);
      
      if (!answersArray || answersArray.length === 0) {
        setDebugStatus("Empty answers array");
        setError("No questionnaire answers provided");
        setIsGenerating(false);
        return;
      }
      
      // Extract gender from first answer (Male or Female)
      const genderAnswer = answersArray[0];
      const extractedGender = genderAnswer?.toLowerCase().includes("male") && !genderAnswer?.toLowerCase().includes("female") 
        ? "male" 
        : "female";
      setGender(extractedGender);
      
      // Format answers for better image generation
      // Create a descriptive summary of character traits
      const characterTraits = answersArray.slice(1).map((answer: string, index: number) => {
        // Clean up the answer text
        return answer.toLowerCase().replace(/\b(the|a|an|is|are|was|were)\b/g, '').trim();
      }).filter((trait: string) => trait.length > 0);
      
      const traitsDescription = characterTraits.join(", ");
      
      const prompt = `A ${extractedGender} fantasy character portrait. Character personality and appearance: ${traitsDescription}. Epic fantasy style, detailed, mystical, high quality, dramatic lighting, upper body or full body portrait. CRITICAL: DO NOT include any text, words, letters, symbols, runes, or writing of any kind in the image. Pure visual character art only, completely text-free.`;
      
      setIsGenerating(true);
      setDebugStatus("Starting image generation...");
      console.log("Starting image generation with prompt:", prompt);
      setDebugStatus("Calling DALL-E API...");
      // Generate image with DALL-E
      const tempImageUrl = await generateImage(prompt);
      console.log("Image generated, URL:", tempImageUrl);
      setDebugStatus("Image generated! Creating backstory...");
      
      // Generate backstory from all answers
      const characterBackstory = await generateBackstory(answersArray);
      setBackstory(characterBackstory);
      console.log("Backstory generated");
      setDebugStatus("Backstory complete! Processing image...");
      
      // Try to upload to Firebase Storage only if user is logged in
      if (user) {
        try {
          console.log("Attempting to upload image to Firebase Storage...");
          setDebugStatus("Uploading image to Firebase Storage...");
          const permanentImageUrl = await uploadImageToStorage(tempImageUrl, user.uid);
          console.log("Upload successful, using permanent URL");
          setDebugStatus("Upload complete!");
          setGeneratedImageUrl(permanentImageUrl);
        } catch (uploadError) {
          console.warn("Upload to Firebase Storage failed, using temporary DALL-E URL:", uploadError);
          setDebugStatus("Using temporary URL (upload failed)");
          setGeneratedImageUrl(tempImageUrl);
        }
      } else {
        // Guest mode - use temporary URL
        setDebugStatus("Guest mode - using temporary URL");
        setGeneratedImageUrl(tempImageUrl);
      }
    } catch (error: any) {
      console.error("Character generation error:", error);
      setDebugStatus("Error: " + error.message);
      setError(error.message || "Failed to generate character");
    } finally {
      setIsGenerating(false);
    }
  };

  const createCharacterPrompt = (answersArray: string[]): string => {
    // Build a character description based on their answers
    let traits = [];
    
    if (answersArray[0]?.includes("darkness")) {
      traits.push("shadowy and mysterious");
    } else {
      traits.push("radiant and fierce");
    }
    
    if (answersArray[1]?.includes("Everything")) {
      traits.push("noble and selfless");
    } else {
      traits.push("cunning and strategic");
    }
    
    if (answersArray[2]?.includes("storm")) {
      traits.push("chaotic and powerful");
    } else {
      traits.push("wise and defensive");
    }
    
    if (answersArray[3]?.includes("Feared")) {
      traits.push("intimidating and dominant");
    } else {
      traits.push("compassionate and heroic");
    }
    
    if (answersArray[4]?.includes("vengeance")) {
      traits.push("vengeful and dark");
    } else {
      traits.push("merciful and enlightened");
    }

    return `A fantasy character portrait that is ${traits.join(", ")}. Epic, detailed, mystical, high quality, dramatic lighting, full body or upper body portrait. CRITICAL: DO NOT include any text, words, letters, symbols, runes, or writing of any kind in the image. Pure visual character art only, completely text-free.`;
  };

  const handleContinue = async () => {
    if (!generatedImageUrl) return;

    // Navigate to name screen (works in both guest and authenticated mode)
    router.push({
      pathname: "/character-name",
      params: { 
        imageUrl: generatedImageUrl,
        backstory: backstory,
        gender: gender
      }
    });
  };

  return (
    <View style={styles.container}>
      {isGenerating ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Forging your destiny...</Text>
          <Text style={styles.debugText}>{debugStatus}</Text>
        </View>
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>{error}</Text>
          <Text style={styles.debugText}>Debug: {debugStatus}</Text>
        </View>
      ) : generatedImageUrl ? (
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <Animated.View style={[styles.imageWrapper, { opacity: imageFadeAnim }]}>
            <Image 
              source={{ uri: generatedImageUrl }} 
              style={styles.characterImage}
              resizeMode="cover"
            />
          </Animated.View>
          
          <Animated.Text style={[styles.title, { opacity: titleFadeAnim }]}>
            Your Character Awaits...
          </Animated.Text>
          
          <Animated.View style={[styles.backstoryContainer, { opacity: backstoryFadeAnim }]}>
            <Text style={styles.backstoryTitle}>Origin Story</Text>
            <Text style={styles.backstoryText}>{backstory}</Text>
          </Animated.View>
          
          <Animated.View style={{ opacity: buttonFadeAnim }}>
            <Pressable
              style={({ pressed }) => [
                styles.continueButton,
                pressed && styles.buttonPressed
              ]}
              onPress={handleContinue}
            >
              <Text style={styles.continueButtonText}>Continue</Text>
            </Pressable>
          </Animated.View>
        </ScrollView>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    alignItems: "center",
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  imageWrapper: {
    width: "100%",
    aspectRatio: 0.57, // Match Stability AI portrait ratio (768/1344)
    maxWidth: 500,
    marginBottom: 30,
    borderRadius: 16,
    overflow: "hidden",
    backgroundColor: "#1a1a1a",
  },
  characterImage: {
    width: "100%",
    height: "100%",
  },
  title: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 20,
    textAlign: "center",
  },
  backstoryContainer: {
    width: "100%",
    maxWidth: 500,
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    marginBottom: 30,
  },
  backstoryTitle: {
    fontSize: 18,
    fontWeight: "bold",
    color: "#ffffff",
    marginBottom: 10,
    textAlign: "center",
  },
  backstoryText: {
    fontSize: 14,
    color: "#cccccc",
    lineHeight: 22,
    textAlign: "center",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingText: {
    color: "#ffffff",
    fontSize: 18,
    marginTop: 20,
  },
  debugText: {
    color: "#888",
    fontSize: 12,
    marginTop: 10,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ff3333",
    padding: 20,
    borderRadius: 8,
  },
  errorText: {
    color: "#ffffff",
    fontSize: 16,
    textAlign: "center",
  },
  continueButton: {
    backgroundColor: "#ffffff",
    paddingVertical: 15,
    paddingHorizontal: 50,
    borderRadius: 8,
    width: "100%",
    maxWidth: 300,
    alignItems: "center",
    marginBottom: 20,
  },
  buttonPressed: {
    opacity: 0.7,
  },
  continueButtonText: {
    color: "#000000",
    fontSize: 18,
    fontWeight: "600",
  },
});
