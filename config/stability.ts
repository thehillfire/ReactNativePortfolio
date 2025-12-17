// Stability AI API for uncensored image generation
// Less restrictive than OpenAI, better for fantasy/mature content

const STABILITY_API_KEY = "sk-uGiwJCk8sq7UEBfcTMA1rDRUrMzPWj87RAf7Z0BTj7plYuce";
const STABILITY_API_URL = "https://api.stability.ai/v1/generation/stable-diffusion-xl-1024-v1-0/text-to-image";

export const generateImage = async (prompt: string): Promise<string> => {
  console.log("Generating image with Stability AI - Prompt:", prompt);
  console.log("API Key (first 10 chars):", STABILITY_API_KEY.substring(0, 10));
  
  try {
    const response = await fetch(STABILITY_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Accept": "application/json",
        "Authorization": `Bearer ${STABILITY_API_KEY}`,
      },
      body: JSON.stringify({
        text_prompts: [
          {
            text: prompt,
            weight: 1
          }
        ],
        cfg_scale: 7,
        height: 1344,
        width: 768,
        steps: 30,
        samples: 1,
      }),
    });

    console.log("Stability AI response status:", response.status);

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Stability AI error:", errorData);
      throw new Error(`Stability AI error (${response.status}): ${JSON.stringify(errorData)}`);
    }

    const data = await response.json();
    
    // The v1 API returns base64 in artifacts array
    if (!data.artifacts || data.artifacts.length === 0) {
      throw new Error("No image generated");
    }
    
    const base64Image = `data:image/png;base64,${data.artifacts[0].base64}`;
    
    console.log("Image generated successfully with Stability AI");
    return base64Image;
  } catch (error: any) {
    console.error('Stability AI image generation error:', error);
    throw new Error(error.message || 'Failed to generate image');
  }
};
