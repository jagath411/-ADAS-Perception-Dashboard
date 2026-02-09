import torch
from ultralytics import YOLO

class ADASDetector:
    def __init__(self, model_path='yolov8n.pt'):
        self.model = YOLO(model_path)
        self.target_classes = [0, 2, 7, 9, 11] 

    def detect(self, frame):
        results = self.model(frame, classes=self.target_classes, verbose=False)
        detections = []
        for r in results:
            for box in r.boxes:
                coords = box.xyxy[0].tolist()
                conf = box.conf[0].item()
                cls = int(box.cls[0].item())
                label = self.model.names[cls]
                detections.append({
                    "bbox": coords,
                    "confidence": conf,
                    "label": label,
                    "class_id": cls
                })
        return detections