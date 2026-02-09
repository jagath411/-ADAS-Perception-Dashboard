import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import PerceptionViewport from './components/PerceptionViewport.tsx';
import MetricsGrid from './components/MetricsGrid.tsx';
import { MOCK_DETECTIONS, COLORS } from './constants.tsx';
import { getSceneAnalysis } from './services/geminiService.ts';
import { analyzeFrame, PerceptionResponse, checkHealth } from './services/perceptionService.ts';
import { Detection } from './types.ts';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanes, setShowLanes] = useState(true);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [currentImage, setCurrentImage] = useState('https://picsum.photos/id/191/1280/720');
  
  const [isLive, setIsLive] = useState(false);
  const [backendStatus, setBackendStatus] = useState<'online' | 'offline' | 'checking'>('checking');
  const [liveDetections, setLiveDetections] = useState<Detection[]>([]);
  const [laneMask, setLaneMask] = useState<string | undefined>(undefined);
  const [backendLatency, setBackendLatency] = useState(0);
  
  const videoRef = useRef<HTMLVideoElement>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processingIntervalRef = useRef<number | null>(null);

  useEffect(() => {
    checkHealth()
      .then(res => setBackendStatus(res.status === 'healthy' ? 'online' : 'offline'))
      .catch(() => setBackendStatus('offline'));
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
      console.error("Camera access failed", err);
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
      ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
      const base64 = canvas.toDataURL('image/jpeg', 0.7);
      setCurrentImage(base64);
      try {
        const response: PerceptionResponse = await analyzeFrame(base64);
        const uiDetections: Detection[] = response.detections.map((d, i) => ({
          id: `live-${i}`,
          label: d.label.charAt(0).toUpperCase() + d.label.slice(1),
          confidence: d.confidence,
          bbox: [(d.bbox[0]/12.8), (d.bbox[1]/7.2), ((d.bbox[2]-d.bbox[0])/12.8), ((d.bbox[3]-d.bbox[1])/7.2)],
          color: d.label === 'person' ? COLORS.PEDESTRIAN : COLORS.VEHICLE
        }));
        setLiveDetections(uiDetections);
        setLaneMask(response.lane_mask_base64);
        setBackendLatency(response.inference_time_ms);
      } catch (e) {
        console.warn("Backend inference failed", e);
      }
    }, 250);
  };

  const handleAnalysis = async () => {
    setIsAnalysing(true);
    const result = await getSceneAnalysis(currentImage, isLive ? liveDetections : MOCK_DETECTIONS);
    setAnalysis(result);
    setIsAnalysing(false);
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-200 bg-[#050505]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <canvas ref={captureCanvasRef} width={1280} height={720} className="hidden" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Perception Engine v4.2</h1>
            <p className="text-gray-500 text-sm">Real-time ADAS visualization stack.</p>
          </div>
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => isLive ? stopLiveMode() : startLiveMode()}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${isLive ? 'bg-red-600 border-red-500' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <i className={`fa-solid ${isLive ? 'fa-video-slash' : 'fa-video'} mr-2`}></i>
              {isLive ? 'Stop Live' : 'Start Live'}
            </button>
            <div className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase border ${backendStatus === 'online' ? 'border-emerald-500/50 text-emerald-500' : 'border-red-500/50 text-red-500'}`}>
              Backend: {backendStatus}
            </div>
          </div>
        </header>

        {activeTab === 'dashboard' ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
              <div className="xl:col-span-2 space-y-4">
                <PerceptionViewport 
                  imageUrl={currentImage} 
                  detections={isLive ? liveDetections : MOCK_DETECTIONS} 
                  laneMaskUrl={laneMask}
                  showLanes={showLanes} 
                  latency={backendLatency}
                  isLive={isLive}
                />
                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center"><i className="fa-solid fa-brain text-blue-500 mr-2"></i> Scene Analysis</h3>
                    <button onClick={handleAnalysis} disabled={isAnalysing} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold disabled:opacity-50">
                      {isAnalysing ? 'Analyzing...' : 'Analyze Scene'}
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 whitespace-pre-wrap">{analysis || 'Click analyze to begin.'}</div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Detections</h3>
                  <div className="space-y-2 max-h-96 overflow-y-auto">
                    {(isLive ? liveDetections : MOCK_DETECTIONS).map(d => (
                      <div key={d.id} className="p-3 bg-black/40 rounded-lg border border-white/5 flex justify-between">
                        <span className="text-xs font-bold uppercase">{d.label}</span>
                        <span className="text-xs font-mono text-emerald-500">{(d.confidence*100).toFixed(0)}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <MetricsGrid />
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <i className="fa-solid fa-screwdriver-wrench text-6xl mb-4"></i>
            <h2 className="text-xl font-bold uppercase tracking-widest">{activeTab} View</h2>
            <p>Module active but placeholder content rendered for performance.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;