
const BACKEND_URL = 'http://localhost:8000';

export interface BackendDetection {
  bbox: [number, number, number, number];
  confidence: number;
  label: string;
  class_id: number;
}

export interface PerceptionResponse {
  detections: BackendDetection[];
  lane_mask_base64: string;
  inference_time_ms: number;
  fps: number;
}

export const analyzeFrame = async (base64Image: string): Promise<PerceptionResponse> => {
  try {
    const response = await fetch(`${BACKEND_URL}/perception/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ image_base64: base64Image }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    return await response.json();
  } catch (error) {
    console.error("Perception API Error:", error);
    throw error;
  }
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`);
    return await response.json();
  } catch (e) {
    return { status: 'offline' };
  }
};
