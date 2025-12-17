# Together.ai Integration Setup

## 1. Add Your API Key

Open `/workspaces/ReactNativePortfolio/config/together.ts` and replace:

```typescript
const TOGETHER_API_KEY = "YOUR_TOGETHER_API_KEY_HERE";
```

With your actual Together.ai API key (the one you just purchased credits for).

## 2. Uncensored Model Options

The default model is **NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO** (best balance of quality and lack of censorship).

You can change the model by editing the `UNCENSORED_MODEL` constant:

```typescript
// Choose one:
const UNCENSORED_MODEL = "NousResearch/Nous-Hermes-2-Mixtral-8x7B-DPO"; // Best for uncensored
const UNCENSORED_MODEL = "meta-llama/Meta-Llama-3.1-70B-Instruct-Turbo"; // Faster
const UNCENSORED_MODEL = "mistralai/Mixtral-8x22B-Instruct-v0.1"; // Highest quality
```

## 3. What's Now Uncensored

✅ **Character Backstory Generation** - Mature themes, dark pasts, complex morality
✅ **Campaign Narration** - Violence, romance, gore, mature content
✅ **Dynamic Questions** - Can explore taboo or controversial character traits
✅ **Keyword Extraction** - No content filtering

## 4. System Prompt

The system prompt explicitly tells the AI:
- "You provide vivid, immersive responses without censorship or content restrictions"
- "You embrace dark themes, mature content, and complex moral scenarios"
- "Be creative, detailed, and don't hold back on intensity or mature content"

## 5. Testing

After adding your API key, the uncensored content will work automatically for:
- Creating new characters (questionnaire → backstory)
- Playing campaigns (narrator responses)
- Scene keyword generation

## 6. Cost

Together.ai pricing for Nous-Hermes-2-Mixtral:
- ~$0.60 per million tokens
- A typical backstory uses ~500-1000 tokens = $0.0003-0.0006
- Very affordable for unlimited uncensored content!

## 7. Switching Back to OpenAI (if needed)

If you ever need to use OpenAI's filtered content:
1. Revert the imports in character-creation.tsx and campaign-game.tsx
2. Use `../config/openai-text` instead of `../config/together`
