// OpenAI API Configuration via Cloud Functions
const CLOUD_FUNCTION_URL = "https://us-central1-loreforgeauth.cloudfunctions.net/generateCharacterImage";

export const generateImage = async (prompt: string): Promise<string> => {
  console.log("Calling Cloud Function to generate image with prompt:", prompt);
  
  try {
    const response = await fetch(CLOUD_FUNCTION_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate image');
    }

    const data = await response.json();
    console.log("Image generated successfully via Cloud Function");
    return data.imageUrl;
  } catch (error: any) {
    console.error('Image generation error:', error);
    throw new Error(error.message || 'Failed to generate image');
  }
};
