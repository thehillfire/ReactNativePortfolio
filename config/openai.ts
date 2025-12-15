// OpenAI API Configuration via Cloud Functions
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

export const generateImage = async (prompt: string): Promise<string> => {
  console.log("Calling Cloud Function to generate image with prompt:", prompt);
  
  try {
    const generateImageFunction = httpsCallable(functions, 'generateCharacterImage');
    const result = await generateImageFunction({ prompt });
    const data = result.data as { imageUrl: string };
    
    console.log("Image generated successfully via Cloud Function");
    return data.imageUrl;
  } catch (error: any) {
    console.error('Image generation error:', error);
    throw new Error(error.message || 'Failed to generate image');
  }
};
