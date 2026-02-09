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
  const response = await fetch(`${BACKEND_URL}/perception/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ image_base64: base64Image }),
  });

  if (!response.ok) throw new Error(`Backend Error: ${response.status}`);
  return await response.json();
};

export const checkHealth = async () => {
  try {
    const response = await fetch(`${BACKEND_URL}/health`, { signal: AbortSignal.timeout(2000) });
    if (!response.ok) return { status: 'offline' };
    return await response.json();
  } catch (e) {
    return { status: 'offline' };
  }
};