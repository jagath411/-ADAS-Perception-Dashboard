
import cv2
import time
import numpy as np
from detection.model import ADASDetector
from segmentation.model import LaneSegmenter

class PerceptionPipeline:
    def __init__(self):
        print("[INFO] Initializing ADAS Perception Pipeline Class...")
        self.detector = ADASDetector()
        self.segmenter = LaneSegmenter()
        self.colors = {
            'person': (0, 0, 255),    # Red
            'car': (255, 0, 0),       # Blue
            'truck': (255, 165, 0),   # Orange
            'traffic light': (0, 255, 255),
            'stop sign': (0, 128, 255)
        }

    def process_frame(self, frame):
        """Processes a single frame and returns annotated image and data."""
        start_time = time.time()
        
        # 1. Run Object Detection
        detections = self.detector.detect(frame)
        
        # 2. Run Lane Segmentation
        lane_mask = self.segmenter.segment(frame)
        
        # 3. Fusion & Visualization
        mask_resized = cv2.resize(lane_mask, (frame.shape[1], frame.shape[0]))
        
        annotated_frame = frame.copy()
        
        # Create lane overlay (Green)
        overlay = annotated_frame.copy()
        overlay[mask_resized > 0] = (0, 255, 0)
        cv2.addWeighted(overlay, 0.3, annotated_frame, 0.7, 0, annotated_frame)
        
        # Draw Detections
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
        
        return annotated_frame, {
            "detections": detections,
            "latency_ms": latency,
            "fps": fps
        }

if __name__ == "__main__":
    # CLI execution for testing
    pipeline = PerceptionPipeline()
    cap = cv2.VideoCapture(0) 
    
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        
        processed_frame, metrics = pipeline.process_frame(frame)
        
        cv2.putText(processed_frame, f"FPS: {metrics['fps']:.1f} | Latency: {metrics['latency_ms']:.1f}ms", 
                    (20, 40), cv2.FONT_HERSHEY_SIMPLEX, 0.8, (255, 255, 255), 2)
        
        cv2.imshow("ADAS CLI Tester", processed_frame)
        if cv2.waitKey(1) & 0xFF == ord('q'): break
            
    cap.release()
    cv2.destroyAllWindows()
