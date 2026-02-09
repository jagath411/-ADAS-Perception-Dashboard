import cv2
import time
import sys
import os
import numpy as np

sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from detection.model import ADASDetector
from segmentation.model import LaneSegmenter

class PerceptionPipeline:
    def __init__(self):
        self.detector = ADASDetector()
        self.segmenter = LaneSegmenter()

    def process_frame(self, frame):
        detections = self.detector.detect(frame)
        lane_mask = self.segmenter.segment(frame)
        mask_resized = cv2.resize(lane_mask, (frame.shape[1], frame.shape[0]))
        annotated_frame = frame.copy()
        overlay = annotated_frame.copy()
        overlay[mask_resized > 0] = (0, 255, 0)
        cv2.addWeighted(overlay, 0.3, annotated_frame, 0.7, 0, annotated_frame)
        for det in detections:
            x1, y1, x2, y2 = map(int, det['bbox'])
            cv2.rectangle(annotated_frame, (x1, y1), (x2, y2), (255, 0, 0), 2)
        return annotated_frame

if __name__ == "__main__":
    pipeline = PerceptionPipeline()
    cap = cv2.VideoCapture(0)
    while cap.isOpened():
        ret, frame = cap.read()
        if not ret: break
        out = pipeline.process_frame(frame)
        cv2.imshow("ADAS", out)
        if cv2.waitKey(1) & 0xFF == ord('q'): break
    cap.release()
    cv2.destroyAllWindows()