// OpenAI API Configuration for text generation via Cloud Functions
const CLOUD_FUNCTION_URL = "https://us-central1-loreforgeauth.cloudfunctions.net/generateCharacterBackstory";

export const generateBackstory = async (prompt: string): Promise<string> => {
  console.log("Calling Cloud Function to generate backstory...");
  
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
      throw new Error(error.error || 'Failed to generate backstory');
    }

    const data = await response.json();
    console.log("Backstory generated successfully via Cloud Function");
    return data.backstory;
  } catch (error: any) {
    console.error('Backstory generation error:', error);
    throw new Error(error.message || 'Failed to generate backstory');
  }
};
