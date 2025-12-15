const functions = require('firebase-functions');
const admin = require('firebase-admin');
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Get OpenAI API key from environment or config
const getOpenAIKey = () => {
  if (process.env.OPENAI_API_KEY) {
    return process.env.OPENAI_API_KEY;
  }
  try {
    return functions.config().openai?.key;
  } catch (e) {
    return null;
  }
};

// Generate AI character image - using onRequest for better CORS support
exports.generateCharacterImage = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const openaiApiKey = getOpenAIKey();
      
      if (!openaiApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      console.log('Generating image with prompt:', prompt);

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
        return res.status(500).json({ error: error.error?.message || 'Failed to generate image' });
      }

      const result = await response.json();
      console.log('Image generated successfully');
      return res.status(200).json({ imageUrl: result.data[0].url });
      
    } catch (error) {
      console.error('Error generating image:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate image' });
    }
  });
});

// Generate AI character backstory - using onRequest for better CORS support
exports.generateCharacterBackstory = functions.https.onRequest((req, res) => {
  cors(req, res, async () => {
    try {
      if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
      }

      const { prompt } = req.body;

      if (!prompt) {
        return res.status(400).json({ error: 'Prompt is required' });
      }

      const openaiApiKey = getOpenAIKey();
      
      if (!openaiApiKey) {
        return res.status(500).json({ error: 'OpenAI API key not configured' });
      }

      console.log('Generating backstory with prompt:', prompt);

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
        return res.status(500).json({ error: error.error?.message || 'Failed to generate backstory' });
      }

      const result = await response.json();
      console.log('Backstory generated successfully');
      return res.status(200).json({ backstory: result.choices[0].message.content.trim() });
      
    } catch (error) {
      console.error('Error generating backstory:', error);
      return res.status(500).json({ error: error.message || 'Failed to generate backstory' });
    }
  });
});
