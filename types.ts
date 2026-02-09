
export interface Detection {
  id: string;
  label: string;
  confidence: number;
  bbox: [number, number, number, number]; // [x, y, w, h] in percentages
  color: string;
}

export interface PerceptionFrame {
  imageUrl: string;
  timestamp: number;
  detections: Detection[];
  laneMaskUrl?: string;
  metrics: {
    inferenceTime: number;
    fps: number;
  };
}

export enum PerceptionMode {
  LIVE = 'LIVE',
  PLAYBACK = 'PLAYBACK',
  BATCH = 'BATCH'
}

export interface AppState {
  isProcessing: boolean;
  currentFrame: PerceptionFrame | null;
  mode: PerceptionMode;
}
