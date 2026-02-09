
import React from 'react';
import { Detection } from './types';

export const COLORS = {
  VEHICLE: '#3b82f6', // car, truck
  PEDESTRIAN: '#ef4444', 
  SIGN: '#f59e0b', // traffic sign
  LANE: '#10b981', // drivable lanes
};

export const MOCK_DETECTIONS: Detection[] = [
  { id: '1', label: 'Car', confidence: 0.98, bbox: [15, 60, 20, 15], color: COLORS.VEHICLE },
  { id: '2', label: 'Truck', confidence: 0.95, bbox: [45, 58, 12, 10], color: COLORS.VEHICLE },
  { id: '3', label: 'Pedestrian', confidence: 0.88, bbox: [75, 55, 5, 12], color: COLORS.PEDESTRIAN },
  { id: '4', label: 'Traffic Sign', confidence: 0.92, bbox: [85, 20, 6, 8], color: COLORS.SIGN },
];

export const SYSTEM_PROMPT = `You are a world-class ADAS (Advanced Driver Assistance Systems) Perception Engineer at a leading automotive company like BMW. 
Analyze the visual perception frame from a multi-task pipeline (YOLOv8 for detection, DeepLabV3 for lane segmentation). 
Evaluate the scene using professional automotive terminology (ego-vehicle path, TTC - Time To Collision, ODD - Operational Design Domain, ISO 26262 safety implications). 
Your goal is to provide a safety-critical assessment of the detected objects (Vehicles, Pedestrians, Signs) and the lane segmentation accuracy.`;
