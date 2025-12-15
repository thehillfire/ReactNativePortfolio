// OpenAI API Configuration for text generation via Cloud Functions
import { getFunctions, httpsCallable } from 'firebase/functions';
import { app } from './firebase';

const functions = getFunctions(app);

export const generateBackstory = async (prompt: string): Promise<string> => {
  console.log("Calling Cloud Function to generate backstory...");
  
  try {
    const generateBackstoryFunction = httpsCallable(functions, 'generateCharacterBackstory');
    const result = await generateBackstoryFunction({ prompt });
    const data = result.data as { backstory: string };
    
    console.log("Backstory generated successfully via Cloud Function");
    return data.backstory;
  } catch (error: any) {
    console.error('Backstory generation error:', error);
    throw new Error(error.message || 'Failed to generate backstory');
  }
};
