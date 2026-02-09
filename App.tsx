import React, { useState, useEffect, useRef } from 'react';
import Sidebar from './components/Sidebar.tsx';
import PerceptionViewport from './components/PerceptionViewport.tsx';
import MetricsGrid from './components/MetricsGrid.tsx';
import { MOCK_DETECTIONS, COLORS } from './constants.tsx';
import { getSceneAnalysis } from './services/geminiService.ts';
import { analyzeFrame, PerceptionResponse, checkHealth } from './services/perceptionService.ts';
import { Detection } from './types.ts';

const App: React.FC = () => {
  const [user, setUser] = useState<{ username: string; email: string } | null>(null);
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

  // Check authentication on mount
  useEffect(() => {
    const savedUser = localStorage.getItem('adas_user');
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (e) {
        localStorage.removeItem('adas_user');
      }
    }
  }, []);

  useEffect(() => {
    if (user) {
      checkHealth()
        .then(res => setBackendStatus(res.status === 'healthy' ? 'online' : 'offline'))
        .catch(() => setBackendStatus('offline'));
    }
  }, [user]);

  const handleLogin = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const username = formData.get('username') as string;
    const email = formData.get('email') as string;
    
    if (username && email) {
      const userData = { username, email };
      localStorage.setItem('adas_user', JSON.stringify(userData));
      setUser(userData);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('adas_user');
    setUser(null);
    stopLiveMode();
  };

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

  if (!user) {
    return (
      <div className="flex h-screen w-screen items-center justify-center bg-[#050505] relative overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-blue-600/10 blur-[120px] rounded-full"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-purple-600/10 blur-[120px] rounded-full"></div>
        
        <div className="w-full max-w-md p-8 bg-[#0f0f0f] border border-white/5 rounded-3xl shadow-2xl relative z-10 mx-4">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center text-3xl text-white shadow-xl shadow-blue-500/20 mx-auto mb-6">
              <i className="fa-solid fa-car-side"></i>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white mb-2">ADAS Control Center</h1>
            <p className="text-gray-500 text-sm">Please sign in to access the perception dashboard.</p>
          </div>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Username</label>
              <input 
                required
                name="username"
                type="text" 
                placeholder="perception_lead" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold uppercase tracking-widest text-gray-500 mb-2 ml-1">Email Address</label>
              <input 
                required
                name="email"
                type="email" 
                placeholder="engineer@adas.io" 
                className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 text-white focus:outline-none focus:border-blue-500 transition-colors"
              />
            </div>
            <button 
              type="submit"
              className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all active:scale-[0.98] mt-4"
            >
              Initialize System
            </button>
          </form>
          
          <div className="mt-8 text-center text-[10px] text-gray-600 uppercase tracking-widest font-mono">
            Safety Integrity Level: SIL-2
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-200 bg-[#050505]">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      <video ref={videoRef} autoPlay playsInline className="hidden" />
      <canvas ref={captureCanvasRef} width={1280} height={720} className="hidden" />

      <main className="flex-1 overflow-y-auto p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div className="flex items-center space-x-4">
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Perception Engine v4.2</h1>
              <p className="text-gray-500 text-sm">Active Session: <span className="text-blue-400 font-mono">{user.username}</span></p>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <button 
              onClick={() => isLive ? stopLiveMode() : startLiveMode()}
              className={`px-4 py-2 rounded-xl border text-sm font-bold transition-all ${isLive ? 'bg-red-600 border-red-500 shadow-lg shadow-red-500/20' : 'bg-white/5 border-white/10 hover:bg-white/10'}`}
            >
              <i className={`fa-solid ${isLive ? 'fa-video-slash' : 'fa-video'} mr-2`}></i>
              {isLive ? 'Stop Live' : 'Start Live'}
            </button>
            
            <div className={`px-3 py-2 rounded-xl text-[10px] font-bold uppercase border ${backendStatus === 'online' ? 'border-emerald-500/50 text-emerald-500 bg-emerald-500/5' : 'border-red-500/50 text-red-500 bg-red-500/5'}`}>
              Backend: {backendStatus}
            </div>

            <button 
              onClick={handleLogout}
              className="w-10 h-10 rounded-xl bg-white/5 border border-white/10 flex items-center justify-center hover:bg-red-500/10 hover:border-red-500/50 transition-all"
              title="Logout"
            >
              <i className="fa-solid fa-right-from-bracket text-gray-400"></i>
            </button>
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
                    <button onClick={handleAnalysis} disabled={isAnalysing} className="px-4 py-2 bg-blue-600 rounded-lg text-xs font-bold disabled:opacity-50 hover:bg-blue-500 transition-colors">
                      {isAnalysing ? (
                        <>
                          <i className="fa-solid fa-circle-notch fa-spin mr-2"></i>
                          Reasoning...
                        </>
                      ) : (
                        <>
                          <i className="fa-solid fa-wand-magic-sparkles mr-2"></i>
                          Gemini 3 Flash
                        </>
                      )}
                    </button>
                  </div>
                  <div className="text-sm text-gray-400 whitespace-pre-wrap min-h-[60px]">
                    {analysis || 'Click analysis button to evaluate current perception frame for safety hazards.'}
                  </div>
                </div>
              </div>
              <div className="space-y-6">
                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6 h-fit">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold">Object Stream</h3>
                    <span className="text-[10px] font-mono text-gray-500 bg-black/50 px-2 py-1 rounded border border-white/5">
                      FPS: {isLive ? (1000 / (backendLatency || 250)).toFixed(1) : '60'}
                    </span>
                  </div>
                  <div className="space-y-2 max-h-[500px] overflow-y-auto pr-2 custom-scrollbar">
                    {(isLive ? liveDetections : MOCK_DETECTIONS).map(d => (
                      <div key={d.id} className="p-3 bg-black/40 rounded-xl border border-white/5 flex justify-between items-center group hover:border-blue-500/30 transition-all">
                        <div className="flex items-center space-x-3">
                          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: d.color }}></div>
                          <span className="text-xs font-bold uppercase tracking-wider">{d.label}</span>
                        </div>
                        <span className="text-[10px] font-mono text-emerald-500 bg-emerald-500/5 px-2 py-1 rounded">{(d.confidence*100).toFixed(0)}%</span>
                      </div>
                    ))}
                    {(isLive ? liveDetections : MOCK_DETECTIONS).length === 0 && (
                      <div className="py-8 text-center text-gray-600 text-xs italic">No objects in range</div>
                    )}
                  </div>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Pipeline Health</h3>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Video Decoder</span>
                      <span className="text-emerald-500 font-mono">NOMINAL</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Inference Core</span>
                      <span className={`${backendStatus === 'online' ? 'text-emerald-500' : 'text-red-500'} font-mono`}>{backendStatus.toUpperCase()}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-500">Memory Usage</span>
                      <span className="text-blue-400 font-mono">2.4 GB</span>
                    </div>
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