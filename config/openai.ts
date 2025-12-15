// OpenAI API Configuration
// Temporarily using direct API call - will move to Cloud Function for production

const OPENAI_API_KEY = process.env.EXPO_PUBLIC_OPENAI_API_KEY || "";

export const generateImage = async (prompt: string): Promise<string> => {
  console.log("Starting image generation with prompt:", prompt);
  
  try {
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    console.log("Response status:", response.status);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("API Error Response:", errorText);
      
      let errorMessage = "Failed to generate image";
      try {
        const error = JSON.parse(errorText);
        errorMessage = error.error?.message || errorMessage;
      } catch {
        errorMessage = `Server error (${response.status}): ${errorText.substring(0, 100)}`;
      }
      
      throw new Error(errorMessage);
    }

    const data = await response.json();
    console.log("Image generated successfully");
    return data.data[0].url;
  } catch (error: any) {
    console.error("Image generation error:", error);
    console.error("Error details:", error.message, error.stack);
    
    // Provide more user-friendly error messages
    if (error.message.includes("content policy")) {
      throw new Error("Image request violated content policy. Try different character traits.");
    } else if (error.message.includes("rate limit")) {
      throw new Error("Too many requests. Please wait a moment and try again.");
    } else if (error.message.includes("500")) {
      throw new Error("OpenAI server error. Please try again in a few moments.");
    }
    
    throw new Error(error.message || "Failed to generate image");
  }
};
