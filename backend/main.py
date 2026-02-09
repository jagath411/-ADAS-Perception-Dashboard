import cv2
import numpy as np
import base64
import time
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional

# Updated imports to match backend folder structure
from detection.model import ADASDetector
from segmentation.model import LaneSegmenter

SERVICE_START_TIME = time.time()

app = FastAPI(
    title="ADAS Perception API",
    description="Backend service for Real-time Object Detection and Lane Segmentation",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

print("[INFO] Loading ADAS Perception Models...")
try:
    detector = ADASDetector()
    segmenter = LaneSegmenter()
    MODELS_READY = True
    print("[INFO] Models loaded successfully.")
except Exception as e:
    print(f"[ERROR] Failed to load models: {e}")
    detector = None
    segmenter = None
    MODELS_READY = False

class PerceptionRequest(BaseModel):
    image_base64: str

class BatchPerceptionRequest(BaseModel):
    images_base64: List[str]

class PerceptionResponse(BaseModel):
    detections: List[dict]
    lane_mask_base64: str
    inference_time_ms: float
    fps: float

def decode_base64_to_image(base64_str: str) -> np.ndarray:
    if "base64," in base64_str:
        base64_str = base64_str.split("base64,")[1]
    try:
        img_data = base64.b64decode(base64_str)
        nparr = np.frombuffer(img_data, np.uint8)
        img = cv2.imdecode(nparr, cv2.IMREAD_COLOR)
        return img
    except Exception:
        return None

def encode_image_to_base64(image: np.ndarray) -> str:
    _, buffer = cv2.imencode('.png', image)
    return base64.b64encode(buffer).decode('utf-8')

@app.get("/health")
async def health_check():
    uptime_seconds = time.time() - SERVICE_START_TIME
    return {
        "status": "healthy" if MODELS_READY else "degraded",
        "uptime_seconds": round(uptime_seconds, 2),
        "services": {
            "object_detection": "ready" if detector else "error",
            "lane_segmentation": "ready" if segmenter else "error"
        }
    }

@app.post("/perception/analyze", response_model=PerceptionResponse)
async def analyze_image(request: PerceptionRequest):
    if not MODELS_READY:
        raise HTTPException(status_code=503, detail="Models are not initialized.")
    try:
        start_time = time.time()
        frame = decode_base64_to_image(request.image_base64)
        if frame is None:
            raise HTTPException(status_code=400, detail="Failed to decode image.")

        detections = detector.detect(frame)
        lane_mask = segmenter.segment(frame)
        mask_resized = cv2.resize(lane_mask, (frame.shape[1], frame.shape[0]))
        mask_base64 = encode_image_to_base64(mask_resized)
        
        end_time = time.time()
        inference_time = (end_time - start_time) * 1000
        fps = 1.0 / (end_time - start_time) if (end_time - start_time) > 0 else 0

        return {
            "detections": detections,
            "lane_mask_base64": mask_base64,
            "inference_time_ms": round(inference_time, 2),
            "fps": round(fps, 1)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)