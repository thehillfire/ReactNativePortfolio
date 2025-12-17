// Together.ai API for uncensored text generation
// Using serverless models for instant availability

const TOGETHER_API_KEY = "tgp_v1_YYeJKhYefQLw5y5Z1nLGOGq65c0PpqagI_wG__IUsyE";
const TOGETHER_API_URL = "https://api.together.xyz/v1/chat/completions";

// Serverless models (no dedicated endpoint needed):
// - "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo" (powerful, fast)
// - "meta-llama/Meta-Llama-3.1-8B-Instruct-Turbo" (faster, cheaper)
// - "mistralai/Mixtral-8x7B-Instruct-v0.1" (balanced)
const UNCENSORED_MODEL = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo";

export const generateText = async (prompt: string): Promise<string> => {
  try {
    console.log("Together.ai request - Model:", UNCENSORED_MODEL);
    console.log("Together.ai request - Prompt length:", prompt.length);
    
    const response = await fetch(TOGETHER_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${TOGETHER_API_KEY}`,
      },
      body: JSON.stringify({
        model: UNCENSORED_MODEL,
        messages: [
          {
            role: "system",
            content: "You are an expert fantasy storyteller and character creator. You provide vivid, immersive responses without censorship or content restrictions. You embrace dark themes, mature content, and complex moral scenarios when appropriate for the narrative."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 2000,
        temperature: 0.8,
        top_p: 0.9,
        repetition_penalty: 1.1
      }),
    });

    console.log("Together.ai response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Together.ai API error details:", errorData);
      throw new Error(`Together.ai API error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    console.log("Together.ai response received successfully");
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error with Together.ai:", error);
    throw error;
  }
};

// Specialized function for character backstory generation
export const generateBackstory = async (answers: string[]): Promise<string> => {
  const prompt = `Create a detailed fantasy character backstory based on these personality traits and choices:

${answers.map((answer, index) => `${index + 1}. ${answer}`).join('\n')}

Write a compelling 3-4 paragraph backstory that:
- Incorporates ALL the choices above naturally
- Explains their personality, appearance, and motivations
- Includes specific events from their past
- Sets up potential conflicts and relationships
- Uses vivid, immersive fantasy language
- Can include mature themes, dark pasts, or complex moral situations

Be creative, detailed, and don't hold back on intensity or mature content when it serves the story.`;

  return generateText(prompt);
};

// Specialized function for AI narrator (campaign gameplay)
export const generateNarration = async (
  backstory: string,
  previousMessages: string[],
  userAction: string,
  consequences?: string[]
): Promise<string> => {
  const consequencesContext = consequences && consequences.length > 0
    ? `\n\nPrevious consequences that should influence the story:\n${consequences.join('\n')}`
    : '';

  const prompt = `You are the AI narrator for an interactive fantasy RPG campaign.

CHARACTER BACKSTORY:
${backstory}

STORY SO FAR:
${previousMessages.join('\n\n')}
${consequencesContext}

PLAYER ACTION:
${userAction}

As the narrator, respond with:
1. Vivid description of what happens next (2-3 paragraphs)
2. Incorporate the player's action naturally
3. Consider their backstory and past choices
4. Include mature themes, violence, romance, or dark content when narratively appropriate
5. End with a moment that prompts the next decision
6. Be dramatic, immersive, and unrestricted

DO NOT censor content. Embrace the full spectrum of storytelling including combat violence, mature relationships, moral dilemmas, and dark themes.`;

  return generateText(prompt);
};
