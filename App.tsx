
import React, { useState, useEffect, useCallback, useRef } from 'react';
import Sidebar from './components/Sidebar';
import PerceptionViewport from './components/PerceptionViewport';
import MetricsGrid from './components/MetricsGrid';
import { MOCK_DETECTIONS, COLORS } from './constants';
import { getSceneAnalysis } from './services/geminiService';
import { analyzeFrame, PerceptionResponse, checkHealth } from './services/perceptionService';
import { Detection } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanes, setShowLanes] = useState(true);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [currentImage, setCurrentImage] = useState('https://picsum.photos/id/191/1280/720');
  
  // Live Streaming States
  const [isLive, setIsLive] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [laneMask, setLaneMask] = useState<string | undefined>(undefined);
  const [backendLatency, setBackendLatency] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingIntervalRef = useRef<number | null>(null);

  // Health check on mount
  useEffect(() => {
    checkHealth().then(res => {
      setBackendStatus(res.status === 'healthy' ? 'online' : 'offline');
    });
  }, []);

  const startLiveMode = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { width: 1280, height: 720, frameRate: 15 } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
        setIsLive(true);
        startProcessingLoop();
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      alert("Could not access camera. Please check permissions.");
    }
  };

  const stopLiveMode = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    if (processingIntervalRef.current) {
      window.clearInterval(processingIntervalRef.current);
    }
    setIsLive(false);
    setLiveDetections([]);
    setLaneMask(undefined);
  };

  const startProcessingLoop = () => {
    processingIntervalRef.current = window.setInterval(async () => {
      if (!videoRef.current || !captureCanvasRef.current || !isLive) return;

      const canvas = captureCanvasRef.current;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Capture frame
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      setCurrentImage(base64);

      try {
        const response: PerceptionResponse = await analyzeFrame(base64);
        
        // Convert Backend detections to UI Detections
        const uiDetections: Detection[] = response.detections.map((d, i) => {
          // Backend bbox: [x1, y1, x2, y2] in pixels
          // Need to convert to % relative to 1280x720 (our target capture res)
          const x = (d.bbox[0] / 1280) * 100;
          const y = (d.bbox[1] / 720) * 100;
          const w = ((d.bbox[2] - d.bbox[0]) / 1280) * 100;
          const h = ((d.bbox[3] - d.bbox[1]) / 720) * 100;

          let color = COLORS.VEHICLE;
          if (d.label === 'person') color = COLORS.PEDESTRIAN;
          if (d.label.includes('sign') || d.label.includes('light')) color = COLORS.SIGN;

          return {
            id: `live-${i}`,
            label: d.label.charAt(0).toUpperCase() + d.label.slice(1),
            confidence: d.confidence,
            bbox: [x, y, w, h],
            color: color
          };
        });

        setLiveDetections(uiDetections);
        setLaneMask(response.lane_mask_base64);
        setBackendLatency(response.inference_time_ms);
      } catch (e) {
        console.warn("Processing frame failed", e);
      }
    }, 200); // 5 FPS processing
  };

  const handleAnalysis = async () => {
    setIsAnalysing(true);
    const result = await getSceneAnalysis(currentImage, isLive ? liveDetections : MOCK_DETECTIONS);
    setAnalysis(result);
    setIsAnalysing(false);
  };

  const toggleLive = () => {
    if (isLive) stopLiveMode();
    else startLiveMode();
  };

  const changeScene = () => {
    if (isLive) return;
    const ids = [191, 107, 183, 119];
    const newId = ids[Math.floor(Math.random() * ids.length)];
    setCurrentImage(`https://picsum.photos/id/${newId}/1280/720`);
    setAnalysis('');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      {/* Hidden processing elements */}
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <canvas ref={captureCanvasRef} width={1280} height={720} className="hidden" />

      <main className="flex-1 overflow-y-auto bg-black p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <div className="flex items-center space-x-3">
              <h1 className="text-2xl font-bold tracking-tight">Perception Engine v4.2</h1>
              <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase border ${backendStatus === 'online' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/10' : 'border-red-500/50 text-red-500 bg-red-500/10'}`}>
                Backend: {backendStatus}
              </div>
            </div>
            <p className="text-gray-500 text-sm">Unified multi-task inference pipeline running in real-time.</p>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={toggleLive}
              className={`px-4 py-3 rounded-xl border text-sm font-bold transition-all flex items-center ${isLive ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-500/20' : 'bg-white/5 border-white/5 hover:bg-white/10'}`}
            >
              <i className={`fa-solid ${isLive ? 'fa-video-slash' : 'fa-video'} mr-2`}></i>
              {isLive ? 'Stop Live Feed' : 'Start Live Feed'}
            </button>

            <div className="flex p-1 bg-[#1a1a1a] rounded-xl border border-white/5">
              <button 
                onClick={() => setShowLanes(true)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${showLanes ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Segmentation ON
              </button>
              <button 
                onClick={() => setShowLanes(false)}
                className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${!showLanes ? 'bg-blue-600 text-white shadow-lg' : 'text-gray-500 hover:text-gray-300'}`}
              >
                Detection Only
              </button>
            </div>

            <button 
              onClick={changeScene}
              disabled={isLive}
              className="px-4 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-30 rounded-xl border border-white/5 text-sm font-medium transition-colors"
            >
              <i className="fa-solid fa-rotate mr-2"></i> Random Scenario
            </button>
          </div>
        </header>

        {activeTab === 'dashboard' && (
          <div className="space-y-8 animate-in fade-in duration-500">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-4">
                <PerceptionViewport 
                  imageUrl={currentImage} 
                  detections={isLive ? liveDetections : MOCK_DETECTIONS} 
                  laneMaskUrl={laneMask}
                  showLanes={showLanes} 
                  latency={isLive ? backendLatency : 32}
                  isLive={isLive}
                />
                
                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center">
                      <i className="fa-solid fa-brain text-blue-500 mr-3"></i>
                      AI Scene Interpreter (Gemini)
                    </h3>
                    <button 
                      onClick={handleAnalysis}
                      disabled={isAnalysing}
                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-800 disabled:opacity-50 text-white rounded-lg text-sm font-bold transition-all flex items-center"
                    >
                      {isAnalysing ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                          Reasoning...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-magnifying-glass mr-2"></i>
                          Analyze Frame
                        </>
                      )}
                    </button>
                  </div>
                  
                  {analysis ? (
                    <div className="text-gray-400 text-sm leading-relaxed font-light prose prose-invert max-w-none bg-black/40 p-4 rounded-xl border border-white/5 whitespace-pre-wrap">
                      {analysis}
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-gray-600 text-sm italic">
                      {isLive ? 'Capture a live frame for Gemini analysis.' : 'Click "Analyze Frame" to use Gemini for real-time risk assessment.'}
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Live Detections</h3>
                    <span className="text-[10px] font-mono text-gray-500 bg-white/5 px-2 py-1 rounded">
                      Count: {isLive ? liveDetections.length : MOCK_DETECTIONS.length}
                    </span>
                  </div>
                  <div className="space-y-3 max-h-[450px] overflow-y-auto pr-2 custom-scrollbar">
                    {(isLive ? liveDetections : MOCK_DETECTIONS).map((det) => (
                      <div key={det.id} className="p-3 bg-black/50 rounded-xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${det.color}20` }}>
                            <i className={`fa-solid ${det.label.toLowerCase() === 'vehicle' || det.label.toLowerCase() === 'car' ? 'fa-car' : det.label.toLowerCase() === 'pedestrian' || det.label.toLowerCase() === 'person' ? 'fa-person-walking' : 'fa-signs-post'}`} style={{ color: det.color }}></i>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white uppercase">{det.label}</div>
                            <div className="text-[10px] text-gray-500 font-mono">{det.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-emerald-500 font-bold">{(det.confidence * 100).toFixed(1)}%</div>
                          <div className="text-[10px] text-gray-500">Conf.</div>
                        </div>
                      </div>
                    ))}
                    {(isLive ? liveDetections : MOCK_DETECTIONS).length === 0 && (
                      <div className="text-center py-10 text-gray-600 text-xs italic">
                        No objects detected in current field of view.
                      </div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">System Alerts</h3>
                  <div className="space-y-3">
                    {isLive && liveDetections.some(d => d.confidence > 0.9) ? (
                      <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 flex items-start space-x-3 animate-pulse">
                        <i className="fa-solid fa-circle-exclamation mt-1"></i>
                        <div className="text-xs">
                          <span className="font-bold block mb-1 uppercase">Collision Warning</span>
                          High confidence object detected in path. TTC: Calculating...
                        </div>
                      </div>
                    ) : (
                      <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20 text-emerald-500 flex items-start space-x-3">
                        <i className="fa-solid fa-shield-check mt-1"></i>
                        <div className="text-xs">
                          <span className="font-bold block mb-1 uppercase">Safety Status: Nominal</span>
                          No immediate hazards detected in current trajectory.
                        </div>
                      </div>
                    )}
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500 flex items-start space-x-3">
                      <i className="fa-solid fa-info-circle mt-1"></i>
                      <div className="text-xs">
                        <span className="font-bold block mb-1 uppercase">Lane Keeping</span>
                        Lateral control active. Lane markings confidence: {laneMask ? 'High' : 'Low'}.
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <MetricsGrid />
          </div>
        )}

        {activeTab === 'architecture' && (
          <div className="animate-in slide-in-from-bottom-4 duration-500">
             <div className="bg-[#0f0f0f] border border-white/5 rounded-3xl p-8 max-w-4xl mx-auto">
                <h2 className="text-3xl font-bold mb-8 text-center">System Pipeline</h2>
                
                <div className="relative flex flex-col md:flex-row items-center justify-between gap-12 py-10">
                  <div className="absolute top-1/2 left-0 w-full h-px bg-gradient-to-r from-transparent via-blue-500/30 to-transparent hidden md:block"></div>
                  
                  <ArchNode icon="fa-camera" label="Raw Input" detail="Camera / Socket" />
                  <ArchNode icon="fa-sliders" label="FastAPI" detail="Base64 Decode" />
                  
                  <div className="relative z-10 p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 border border-blue-400/30">
                    <div className="text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 text-center">Multi-Task Backbone</div>
                    <div className="flex gap-4">
                      <div className="px-3 py-2 bg-black/30 rounded-lg text-[10px] font-mono">YOLOv8 Head</div>
                      <div className="px-3 py-2 bg-black/30 rounded-lg text-[10px] font-mono">DeepLab Head</div>
                    </div>
                  </div>

                  <ArchNode icon="fa-layer-group" label="JSON Response" detail="Detections & Mask" />
                  <ArchNode icon="fa-display" label="UI Dashboard" detail="Canvas Overlay" />
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-4 flex items-center">
                      <i className="fa-solid fa-microchip mr-3 text-blue-500"></i>
                      Backend Orchestration
                    </h4>
                    <p className="text-sm text-gray-400">
                      Utilizes FastAPI for high-performance asynchronous request handling. The multi-task model serves both object detection and semantic segmentation heads simultaneously to minimize GPU overhead.
                    </p>
                  </div>
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-4 flex items-center">
                      <i className="fa-solid fa-code-branch mr-3 text-emerald-500"></i>
                      Real-time constraints
                    </h4>
                    <p className="text-sm text-gray-400">
                      Optimized for low-latency transmission using JPEG compression. UI target: 15-30 FPS. Backend inference target: &lt;50ms per frame.
                    </p>
                  </div>
                </div>
             </div>
          </div>
        )}

        {/* Placeholder for other tabs */}
        {(activeTab === 'metrics' || activeTab === 'dataset' || activeTab === 'config') && (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <i className={`fa-solid ${activeTab === 'metrics' ? 'fa-microchip' : activeTab === 'dataset' ? 'fa-database' : 'fa-cog'} text-6xl mb-6`}></i>
            <h2 className="text-xl font-bold uppercase tracking-widest">{activeTab} module active</h2>
            <p className="text-sm">Real-time telemetry stream connected. View dashboard for primary controls.</p>
          </div>
        )}
      </main>
    </div>
  );
};

const ArchNode = ({ icon, label, detail }: any) => (
  <div className="relative z-10 flex flex-col items-center group">
    <div className="w-16 h-16 bg-[#1a1a1a] border border-white/10 rounded-2xl flex items-center justify-center text-xl text-blue-500 group-hover:scale-110 group-hover:border-blue-500/50 transition-all duration-300">
      <i className={`fa-solid ${icon}`}></i>
    </div>
    <div className="mt-4 text-center">
      <div className="text-sm font-bold text-white">{label}</div>
      <div className="text-[10px] text-gray-500 font-mono mt-1">{detail}</div>
    </div>
  </div>
);

export default App;
