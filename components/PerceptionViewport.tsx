
import React, { useRef, useEffect } from 'react';
import { Detection } from '../types';
import { COLORS } from '../constants';

interface Props {
  imageUrl: string;
  detections: Detection[];
  laneMaskUrl?: string;
  showLanes: boolean;
  latency?: number;
  isLive?: boolean;
}

const PerceptionViewport: React.FC<Props> = ({ 
  imageUrl, 
  detections, 
  laneMaskUrl, 
  showLanes, 
  latency = 0,
  isLive = false
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const maskImgRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and Redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lanes from Backend Mask
    if (showLanes && laneMaskUrl) {
      const maskImg = new Image();
      maskImg.src = `data:image/png;base64,${laneMaskUrl}`;
      maskImg.onload = () => {
        ctx.globalAlpha = 0.4;
        ctx.drawImage(maskImg, 0, 0, canvas.width, canvas.height);
        ctx.globalAlpha = 1.0;
      };
    }

    // Draw Detections
    detections.forEach((det) => {
      // Backend returns absolute coords (x1, y1, x2, y2), or % based. 
      // Assuming our App converts them to percentages for the UI
      const x = (det.bbox[0] / 100) * canvas.width;
      const y = (det.bbox[1] / 100) * canvas.height;
      const w = (det.bbox[2] / 100) * canvas.width;
      const h = (det.bbox[3] / 100) * canvas.height;

      ctx.strokeStyle = det.color;
      ctx.lineWidth = 3;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = det.color;
      const labelText = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 14px JetBrains Mono';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillRect(x, y - 25, textWidth + 10, 25);

      // Label text
      ctx.fillStyle = 'white';
      ctx.fillText(labelText, x + 5, y - 8);
    });

  }, [detections, showLanes, laneMaskUrl, imageUrl]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
      <img 
        src={imageUrl} 
        alt="Input Feed" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas 
        ref={canvasRef}
        width={1280}
        height={720}
        className="absolute inset-0 w-full h-full pointer-events-none z-10"
      />
      
      {/* Overlay UI elements */}
      <div className="absolute top-4 left-4 space-y-2 pointer-events-none z-20">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center space-x-2">
          <div className={`w-2 h-2 rounded-full ${isLive ? 'bg-red-500 animate-pulse' : 'bg-blue-500'}`}></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">
            Mode: {isLive ? 'Live Camera' : 'Static Scenario'}
          </span>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 text-right space-y-1 z-20">
        <div className="text-white/40 text-[10px] font-mono uppercase">Backend Latency</div>
        <div className={`${latency > 100 ? 'text-amber-400' : 'text-emerald-400'} font-mono font-bold text-lg leading-none`}>
          {latency.toFixed(1)}ms
        </div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
        <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
          <div>
            <div className="text-white/40 uppercase">Processor</div>
            <div className="text-white">FastAPI ADAS Backend</div>
          </div>
          <div>
            <div className="text-white/40 uppercase">Framework</div>
            <div className="text-white">PyTorch + YOLOv8</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerceptionViewport;
