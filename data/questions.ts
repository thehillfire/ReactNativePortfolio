export interface Question {
  id: number;
  question: string;
  optionA: string;
  optionB: string;
}

export const staticQuestions: Question[] = [
  {
    id: 1,
    question: "Male or Female?",
    optionA: "Male",
    optionB: "Female"
  }
];

// Generate one question at a time for reliability
async function generateSingleQuestion(questionNumber: number): Promise<Question> {
  const { generateText } = await import('../config/together');
  
  const prompt = `Generate a single character-defining question for a fantasy RPG character creation (question ${questionNumber} of 6).

STRICT REQUIREMENTS:
- Question: Maximum 15 words
- Each option: Maximum 4 words
- Two opposing options only
- Must influence character's appearance, personality, or behavior

Topics: morality, appearance, personality, combat style, social behavior, fears, desires, strengths, weaknesses.

Return ONLY in this exact format (no extra text):
QUESTION: [Your question here?]
OPTION_A: [First choice]
OPTION_B: [Second choice]`;

  const response = await generateText(prompt);
  console.log(`Question ${questionNumber} AI response:`, response);
  
  // Parse the response - try multiple patterns to be more flexible
  let questionMatch = response.match(/QUESTION:\s*(.+?)(?:\n|$)/i);
  let optionAMatch = response.match(/OPTION_A:\s*(.+?)(?:\n|$)/i);
  let optionBMatch = response.match(/OPTION_B:\s*(.+?)(?:\n|$)/i);
  
  if (!questionMatch || !optionAMatch || !optionBMatch) {
    console.error("Failed to parse AI response. Full response:", response);
    throw new Error(`Failed to parse AI response for question ${questionNumber}`);
  }
  
  return {
    id: questionNumber + 1, // +1 because gender is question 1
    question: questionMatch[1].trim(),
    optionA: optionAMatch[1].trim(),
    optionB: optionBMatch[1].trim()
  };
}

export async function generateDynamicQuestions(): Promise<Question[]> {
  const generatedQuestions: Question[] = [];
  
  // Generate 6 questions one at a time
  for (let i = 0; i < 6; i++) {
    try {
      const question = await generateSingleQuestion(i);
      generatedQuestions.push(question);
      console.log(`Successfully generated question ${i + 1}:`, question);
    } catch (error) {
      console.error(`Error generating question ${i + 1}:`, error);
      throw new Error(`Failed to generate question ${i + 1}. Please try again.`);
    }
  }
  
  // Combine static gender question with AI-generated questions
  return [...staticQuestions, ...generatedQuestions];
}
