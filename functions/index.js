const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

// Generate AI character image
exports.generateCharacterImage = functions.https.onCall(async (data, context) => {
  // Verify user is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const { prompt } = data;

  if (!prompt) {
    throw new functions.https.HttpsError('invalid-argument', 'Prompt is required');
  }

  try {
    const openaiApiKey = functions.config().openai.key;
    
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
