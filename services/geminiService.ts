import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants.tsx";

// Robust check for environment variables in ESM/Local environments
const getApiKey = () => {
  try {
    return (window as any).process?.env?.API_KEY || (import.meta as any).env?.VITE_API_KEY || '';
  } catch {
    return '';
  }
};

export const getSceneAnalysis = async (imageData: string, detections: any[]) => {
  const apiKey = getApiKey();
  if (!apiKey) {
    console.error("Gemini API Key missing in process.env.API_KEY");
    return "Configuration Error: API Key is missing. Please ensure process.env.API_KEY is defined.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';
    
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData.includes('base64,') ? imageData.split(',')[1] : imageData,
      },
    };

    const textPart = {
      text: `Analyze this driving scene. The following objects were detected: ${JSON.stringify(detections)}. 
      Explain what the driver should be aware of and any potential false positives or occlusion risks in the segmentation mask.`
    };

    const response = await ai.models.generateContent({
      model,
      contents: { parts: [imagePart, textPart] },
      config: {
        systemInstruction: SYSTEM_PROMPT,
        temperature: 0.7,
      },
    });

    return response.text || "No analysis available.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return "The AI analysis module encountered an error. Please verify your connection or API quota.";
  }
};