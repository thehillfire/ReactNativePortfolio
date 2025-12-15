const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Get OpenAI API key from environment or config
const getOpenAIKey = () => {
  // Try environment variable first (for local development)
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  // Fall back to Firebase config (for deployed functions)
  try {
    return functions.config().openai?.key;
  } catch (e) {
    return null;
  }
};

// Generate AI character image
exports.generateCharacterImage = functions.https.onCall(async (data, context) => {
  // Allow unauthenticated for testing - remove in production
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  // }

  const { prompt } = data;

  if (!prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
  }

  try {
    const openaiApiKey = getOpenAIKey();
    
    if (!openaiApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured');
    }

    // Call OpenAI API
    const response = await fetch("https://api.openai.com/v1/images/generations", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "dall-e-3",
        prompt: prompt,
        n: 1,
        size: "1024x1024",
        quality: "standard",
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new functions.https.HttpsError('internal', error.error?.message || 'Failed to generate image');
    }

    const result = await response.json();
    return { imageUrl: result.data[0].url };
    
  } catch (error) {
    console.error('Error generating image:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to generate image');
  }
});

// Generate AI character backstory
exports.generateCharacterBackstory = functions.https.onCall(async (data, context) => {
  // Allow unauthenticated for testing - remove in production
  // if (!context.auth) {
  //   throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  // }

  const { prompt } = data;

  if (!prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
  }

  try {
    const openaiApiKey = getOpenAIKey();
    
    if (!openaiApiKey) {
      throw new functions.https.HttpsError('failed-precondition', 'OpenAI API key not configured');
    }

    // Call OpenAI Chat API
    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are a creative fantasy RPG storyteller who writes compelling character backstories."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        max_tokens: 200,
        temperature: 0.8,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      console.error('OpenAI API error:', error);
      throw new functions.https.HttpsError('internal', error.error?.message || 'Failed to generate backstory');
    }

    const result = await response.json();
    return { backstory: result.choices[0].message.content.trim() };
    
  } catch (error) {
    console.error('Error generating backstory:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to generate backstory');
  }
});
