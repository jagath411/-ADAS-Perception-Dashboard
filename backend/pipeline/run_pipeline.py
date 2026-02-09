import cv2
import time
import sys
import os
import numpy as np

# Adjust path to allow imports from parent backend directory
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from detection.model import ADASDetector
from segmentation.model import LaneSegmenter

class PerceptionPipeline:
    def __init__(self):
        print("[INFO] Initializing ADAS Perception Pipeline Class...")
        self.detector = ADASDetector()
        self.segmenter = LaneSegmenter()
        self.colors = {
            'person': (0, 0, 255),
            'car': (255, 0, 0),
            'truck': (255, 165, 0),
            'traffic light': (0, 255, 255),
            'stop sign': (0, 128, 255)
        }

    def process_frame(self, frame):
        start_time = time.time()
        detections = self.detector.detect(frame)
        lane_mask = self.segmenter.segment(frame)
        mask_resized = cv2.resize(lane_mask, (frame.shape[1], frame.shape[0]))
        annotated_frame = frame.copy()
        
        overlay = annotated_frame.copy()
        overlay[mask_resized > 0] = (0, 255, 0)
        cv2.addWeighted(overlay, 0.3, annotated_frame, 0.7, 0, annotated_frame)
        
        for det in detections:
            x1, y1, x2, y2 = map(int, det['bbox'])
            label = det['label']
            conf = det['confidence']
            color = self.colors.get(label, (0, 255, 0))
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), color, 2)
            cv2.putText(annotated_frame, f"{label} {conf:.2f}", (x1, y1-10), 
                        cv2.FONT_HERSHEY_SIMPLEX, 0.5, color, 2)
        
        end_time = time.time()
        latency = (end_time - start_time) * 1000
        fps = 1 / (end_time - start_time) if (end_time - start_time) > 0 else 0
        return annotated_frame, {"detections": detections, "latency_ms": latency, "fps": fps}

if __name__ == "__main__":
    pipeline = PerceptionPipeline()
    cap = cv2.VideoCapture(0) 
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        processed_frame, metrics = pipeline.process_frame(frame)
        cv2.putText(processed_frame, f"FPS: {metrics['fps']:.1f}", (20, 40), 
                    cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        cv2.imshow("ADAS CLI Tester", processed_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break
    cap.release()
    cv2.destroyAllWindows()