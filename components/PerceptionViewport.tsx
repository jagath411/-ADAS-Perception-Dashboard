
import React, { useRef, useEffect } from 'react';
import { Detection } from '../types';
import { COLORS } from '../constants';

interface Props {
  imageUrl: string;
  detections: Detection[];
  showLanes: boolean;
}

const PerceptionViewport: React.FC<Props> = ({ imageUrl, detections, showLanes }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Clear and Redraw
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Lanes Simulation
    if (showLanes) {
      ctx.beginPath();
      ctx.moveTo(canvas.width * 0.4, canvas.height);
      ctx.bezierCurveTo(canvas.width * 0.45, canvas.height * 0.7, canvas.width * 0.48, canvas.height * 0.55, canvas.width * 0.48, canvas.height * 0.5);
      ctx.lineTo(canvas.width * 0.52, canvas.height * 0.5);
      ctx.bezierCurveTo(canvas.width * 0.52, canvas.height * 0.55, canvas.width * 0.55, canvas.height * 0.7, canvas.width * 0.6, canvas.height);
      ctx.fillStyle = 'rgba(16, 185, 129, 0.3)';
      ctx.fill();
      ctx.strokeStyle = COLORS.LANE;
      ctx.lineWidth = 4;
      ctx.setLineDash([15, 15]);
      ctx.stroke();
    }

    // Draw Detections
    detections.forEach((det) => {
      const x = (det.bbox[0] / 100) * canvas.width;
      const y = (det.bbox[1] / 100) * canvas.height;
      const w = (det.bbox[2] / 100) * canvas.width;
      const h = (det.bbox[3] / 100) * canvas.height;

      ctx.strokeStyle = det.color;
      ctx.lineWidth = 2;
      ctx.setLineDash([]);
      ctx.strokeRect(x, y, w, h);

      // Label background
      ctx.fillStyle = det.color;
      const labelText = `${det.label} ${(det.confidence * 100).toFixed(0)}%`;
      ctx.font = 'bold 12px Inter';
      const textWidth = ctx.measureText(labelText).width;
      ctx.fillRect(x, y - 20, textWidth + 10, 20);

      // Label text
      ctx.fillStyle = 'white';
      ctx.fillText(labelText, x + 5, y - 5);
    });

  }, [detections, showLanes]);

  return (
    <div className="relative w-full aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border border-white/10 group">
      <img 
        src={imageUrl} 
        alt="ADAS Input" 
        className="absolute inset-0 w-full h-full object-cover"
      />
      <canvas 
        ref={canvasRef}
        width={1280}
        height={720}
        className="absolute inset-0 w-full h-full pointer-events-none"
      />
      
      {/* Overlay UI elements */}
      <div className="absolute top-4 left-4 space-y-2 pointer-events-none">
        <div className="bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 flex items-center space-x-2">
          <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></div>
          <span className="text-[10px] uppercase font-bold tracking-widest text-white/80">Stream: Active</span>
        </div>
      </div>
      
      <div className="absolute top-4 right-4 text-right space-y-1">
        <div className="text-white/40 text-[10px] font-mono uppercase">System Latency</div>
        <div className="text-emerald-400 font-mono font-bold text-lg leading-none">32ms</div>
      </div>

      <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md p-3 rounded-lg border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
        <div className="grid grid-cols-2 gap-4 text-[11px] font-mono">
          <div>
            <div className="text-white/40 uppercase">Resolution</div>
            <div className="text-white">1920x1080 (HD)</div>
          </div>
          <div>
            <div className="text-white/40 uppercase">Encoder</div>
            <div className="text-white">NVENC H.264</div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PerceptionViewport;
