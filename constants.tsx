import { Detection } from './types.ts';

export const COLORS = {
  VEHICLE: '#3b82f6',
  PEDESTRIAN: '#ef4444', 
  SIGN: '#f59e0b',
  LANE: '#10b981',
};

export const MOCK_DETECTIONS: Detection[] = [
  { id: '1', label: 'Car', confidence: 0.98, bbox: [15, 60, 20, 15], color: COLORS.VEHICLE },
  { id: '2', label: 'Truck', confidence: 0.95, bbox: [45, 58, 12, 10], color: COLORS.VEHICLE },
  { id: '3', label: 'Pedestrian', confidence: 0.88, bbox: [75, 55, 5, 12], color: COLORS.PEDESTRIAN },
  { id: '4', label: 'Traffic Sign', confidence: 0.92, bbox: [85, 20, 6, 8], color: COLORS.SIGN },
];

export const SYSTEM_PROMPT = `You are a world-class ADAS Perception Engineer. Analyze the visual perception frame from a multi-task pipeline. 
Evaluate the scene using professional automotive terminology (ego-vehicle path, TTC, ISO 26262 implications).`;