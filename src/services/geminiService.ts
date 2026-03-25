import { GoogleGenAI, Type, GenerateContentResponse } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || "" });

export const geminiService = {
  async generateCharacterBio(name: string, niche: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Create a detailed personality and background bio for an AI influencer named ${name} who is in the ${niche} niche. Include their tone of voice, hobbies, and a unique quirk. Return as a short paragraph.`,
    });
    return response.text;
  },

  async generateImage(prompt: string): Promise<string | undefined> {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [{ text: prompt }],
      },
      config: {
        imageConfig: {
          aspectRatio: "1:1",
        },
      },
    });

    for (const part of response.candidates?.[0]?.content?.parts || []) {
      if (part.inlineData) {
        return `data:image/png;base64,${part.inlineData.data}`;
      }
    }
    return undefined;
  },

  async generatePostContent(characterName: string, personality: string, topic: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Write a social media post for ${characterName}. 
      Personality: ${personality}. 
      Topic: ${topic}. 
      Make it engaging and include relevant hashtags.`,
    });
    return response.text;
  }
};
