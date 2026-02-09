
import cv2
import numpy as np
import base64
import time
import re
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Import your existing ADAS components
from detection.model import ADASDetector
from segmentation.model import LaneSegmenter

app = FastAPI(
    title="ADAS Perception API",
    description="Backend service for Real-time Object Detection and Lane Segmentation",
    version="1.0.0"
)

# Enable CORS for frontend interaction
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize models at startup to avoid reload latency
print("[INFO] Loading ADAS Perception Models...")
detector = ADASDetector()
segmenter = LaneSegmenter()
print("[INFO] Models loaded successfully.")

class DetectionResult(BaseModel):
    label: str
    confidence: float
    bbox: List[float] # [x1, y1, x2, y2]

class PerceptionRequest(BaseModel):
    image_base64: str # Expects a base64 string, potentially with data:image/xxx;base64, prefix

class PerceptionResponse(BaseModel):
    detections: List[dict]
    lane_mask_base64: str
    inference_time_ms: float
    fps: float

def decode_base64_to_image(base64_str: str) -> np.ndarray:
    # Remove data URI prefix if present
    if "base64," in base64_str:
        base64_str = base64_str.split("base64,")[1]
    
    img_data = base64.b64decode(base64_str)
    nparr = np.frombuffer(img_data, np.uint8)
    img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
    return img

def encode_image_to_base64(image: np.ndarray) -> str:
    _, buffer = cv2.imencode('.png', image)
    return base64.b64encode(buffer).decode('utf-8')

@app.get("/health")
async def health_check():
    return {"status": "healthy", "version": "1.0.0"}

@app.post("/perception/analyze", response_model=PerceptionResponse)
async def analyze_image(request: PerceptionRequest):
    """
    Receives a base64 encoded image, runs multi-task perception, 
    and returns detections + lane segmentation mask.
    """
    try:
        start_time = time.time()
        
        # 1. Decode base64 to OpenCV image
        frame = decode_base64_to_image(request.image_base64)
        
        if frame is None:
            raise HTTPException(status_code=400, detail="Failed to decode image from base64 string.")

        # 2. Object Detection (YOLOv8)
        detections = detector.detect(frame)
        
        # 3. Lane Segmentation (DeepLabV3)
        lane_mask = segmenter.segment(frame)
        
        # 4. Prepare visualization mask
        # Resizing mask to original frame dimensions
        mask_resized = cv2.resize(lane_mask, (frame.shape[1], frame.shape[0]))
        
        # Convert mask to base64 for frontend consumption
        mask_base64 = encode_image_