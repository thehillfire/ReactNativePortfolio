import { useRouter } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { questions } from "../data/questions";

export default function Questionnaire() {
  const router = useRouter();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>([]);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Fade in at half speed (2000ms instead of 1000ms)
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start();
  }, [currentQuestion]);

  const handleAnswer = (answer: string) => {
    const newAnswers = [...answers, answer];
    setAnswers(newAnswers);

    if (currentQuestion < questions.length - 1) {
      // Fade out and move to next question
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 500,
        useNativeDriver: true,
      }).start(() => {
        setCurrentQuestion(currentQuestion + 1);
        fadeAnim.setValue(0);
      });
    } else {
      // All questions answered, navigate to character creation
      router.push({
        pathname: "/character-creation",
        params: { answers: JSON.stringify(newAnswers) }
      });
    }
  };

  const question = questions[currentQuestion];

  return (
    <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
      <View style={styles.content}>
        <Text style={styles.questionNumber}>
          Question {currentQuestion + 1} of {questions.length}
        </Text>
        
        <Text style={styles.question}>{question.question}</Text>

        <View style={styles.buttonContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.answerButton,
              pressed && styles.buttonPressed
            ]}
            onPress={() => handleAnswer(question.optionA)}
          >
            <Text style={styles.buttonText}>{question.optionA}</Text>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.answerButton,
              pressed && styles.buttonPressed
            ]}
            onPress={() => handleAnswer(question.optionB)}
          >
            <Text style={styles.buttonText}>{question.optionB}</Text>
          </Pressable>
        </View>
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#000000",
  },
  content: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 40,
  },
  questionNumber: {
    fontSize: 14,
    color: "#666",
    marginBottom: 30,
    textAlign: "center",
  },
  question: {
    fontSize: 28,
    fontWeight: "bold",
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 60,
    lineHeight: 40,
  },
  buttonContainer: {
    width: "100%",
    maxWidth: 400,
    gap: 20,
  },
  answerButton: {
    backgroundColor: "transparent",
    borderWidth: 2,
    borderColor: "#ffffff",
    paddingVertical: 20,
    paddingHorizontal: 30,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.7,
    backgroundColor: "#1a1a1a",
  },
  buttonText: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "600",
  },
});
