
import { GoogleGenAI } from "@google/genai";
import { SYSTEM_PROMPT } from "../constants";

const apiKey = process.env.API_KEY || '';

export const getSceneAnalysis = async (imageData: string, detections: any[]) => {
  if (!apiKey) {
    return "API Key missing. Please check your environment configuration.";
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const model = 'gemini-3-flash-preview';
    
    const imagePart = {
      inlineData: {
        mimeType: 'image/jpeg',
        data: imageData.split(',')[1],
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
    return "Failed to analyze scene. High load or invalid request.";
  }
};
