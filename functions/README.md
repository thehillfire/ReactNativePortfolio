# Cloud Functions Setup

## Local Development

1. Install dependencies:
```bash
cd functions
npm install
```

2. Make sure `.env` file exists in `functions/` directory with:
```
OPENAI_API_KEY=your-key-here
```

3. Start Firebase emulators:
```bash
firebase emulators:start
```

## Deployment to Firebase

1. Set the OpenAI API key in Firebase config:
```bash
firebase functions:config:set openai.key="your-openai-api-key-here"
```

2. Deploy functions:
```bash
firebase deploy --only functions
```

## Functions Available

- `generateCharacterImage` - Generates character images using DALL-E 3
- `generateCharacterBackstory` - Generates character backstories using GPT-4
- `uploadImageFromUrl` - **NEW!** Downloads DALL-E images and uploads to Firebase Storage (fixes expiration issue)

## Fixing Image Expiration Issue

The `uploadImageFromUrl` function solves the 403 error you're seeing. When deployed, it:
1. Downloads the temporary DALL-E image from OpenAI's servers
2. Uploads it to your Firebase Storage bucket
3. Returns a permanent public URL

**To deploy this fix:**
```bash
cd functions
npm run deploy
```

After deployment, the app will automatically use this function when saving characters, and images will no longer expire!

## Security Notes

- API keys are stored securely in Firebase Functions config (production) or `.env` files (local)
- `.env` files are git-ignored and never committed
- Functions can be called from any authenticated device without exposing API keys
