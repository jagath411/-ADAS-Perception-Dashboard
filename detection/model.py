
import torch
from ultralytics import YOLO

class ADASDetector:
    def __init__(self, model_path='yolov8n.pt'):
        """
        Initializes the YOLOv8 detector. 
        Classes of interest: 0: person, 2: car, 7: truck, 9: traffic light, 11: stop sign
        """
        self.model = YOLO(model_path)
        # Filter for ADAS relevant classes (Vehicle, Pedestrian, Sign)
        self.target_classes = [0, 2, 7, 9, 11] 

    def detect(self, frame):
        results = self.model(frame, classes=self.target_classes, verbose=False)
        detections = []
        
        for r in results:
            for box in r.boxes:
                coords = box.xyxy[0].tolist() # x1, y1, x2, y2
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
