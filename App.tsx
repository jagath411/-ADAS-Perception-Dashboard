
import React, { useState, useEffect, useCallback } from 'react';
import Sidebar from './components/Sidebar';
import PerceptionViewport from './components/PerceptionViewport';
import MetricsGrid from './components/MetricsGrid';
import { MOCK_DETECTIONS } from './constants';
import { getSceneAnalysis } from './services/geminiService';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [showLanes, setShowLanes] = useState(true);
  const [isAnalysing, setIsAnalysing] = useState(false);
  const [analysis, setAnalysis] = useState<string>('');
  const [currentImage, setCurrentImage] = useState('https://picsum.photos/id/191/1280/720');

  const handleAnalysis = async () => {
    setIsAnalysing(true);
    // In a real app, we'd capture the frame from video/canvas
    // Here we use a static prompt + the current display
    const result = await getSceneAnalysis(currentImage, MOCK_DETECTIONS);
    setAnalysis(result);
    setIsAnalysing(false);
  };

  const changeScene = () => {
    const ids = [191, 107, 183, 119];
    const newId = ids[Math.floor(Math.random() * ids.length)];
    setCurrentImage(`https://picsum.photos/id/${newId}/1280/720`);
    setAnalysis('');
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden text-gray-200">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 overflow-y-auto bg-black p-4 lg:p-8">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Perception Engine v4.2</h1>
            <p className="text-gray-500 text-sm">Unified multi-task inference pipeline running in real-time.</p>
          </div>
          
          <div className="flex items-center space-x-3">
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
              className="px-4 py-3 bg-white/5 hover:bg-white/10 rounded-xl border border-white/5 text-sm font-medium transition-colors"
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
                  detections={MOCK_DETECTIONS} 
                  showLanes={showLanes} 
                />
                
                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-bold flex items-center">
                      <i className="fa-solid fa-brain text-blue-500 mr-3"></i>
                      AI Scene Interpreter
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
                    <div className="text-gray-400 text-sm leading-relaxed font-light prose prose-invert max-w-none bg-black/40 p-4 rounded-xl border border-white/5">
                      {analysis}
                    </div>
                  ) : (
                    <div className="h-24 flex items-center justify-center border-2 border-dashed border-white/5 rounded-xl text-gray-600 text-sm italic">
                      Click "Analyze Frame" to use Gemini for real-time risk assessment and scene context.
                    </div>
                  )}
                </div>
              </div>

              <div className="space-y-6">
                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">Live Detections</h3>
                  <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                    {MOCK_DETECTIONS.map((det) => (
                      <div key={det.id} className="p-3 bg-black/50 rounded-xl border border-white/5 flex items-center justify-between group hover:border-blue-500/30 transition-colors">
                        <div className="flex items-center space-x-3">
                          <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${det.color}20` }}>
                            <i className={`fa-solid ${det.label === 'Vehicle' ? 'fa-car' : det.label === 'Pedestrian' ? 'fa-person-walking' : 'fa-signs-post'}`} style={{ color: det.color }}></i>
                          </div>
                          <div>
                            <div className="text-xs font-bold text-white uppercase">{det.label}</div>
                            <div className="text-[10px] text-gray-500 font-mono">ID: DET-00{det.id}</div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-xs font-mono text-emerald-500 font-bold">{(det.confidence * 100).toFixed(1)}%</div>
                          <div className="text-[10px] text-gray-500">Conf.</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="bg-[#0f0f0f] border border-white/5 rounded-2xl p-6">
                  <h3 className="font-bold mb-4">System Alerts</h3>
                  <div className="space-y-3">
                    <div className="p-3 bg-red-500/10 rounded-xl border border-red-500/20 text-red-500 flex items-start space-x-3">
                      <i className="fa-solid fa-circle-exclamation mt-1"></i>
                      <div className="text-xs">
                        <span className="font-bold block mb-1 uppercase">Collision Warning</span>
                        Vehicle ID: DET-001 is rapidly decelerating. Predicted TTC: 2.4s.
                      </div>
                    </div>
                    <div className="p-3 bg-blue-500/10 rounded-xl border border-blue-500/20 text-blue-500 flex items-start space-x-3">
                      <i className="fa-solid fa-info-circle mt-1"></i>
                      <div className="text-xs">
                        <span className="font-bold block mb-1 uppercase">Lane Departure</span>
                        Approaching left boundary. Lateral deviation: 0.15m.
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
                  
                  <ArchNode icon="fa-camera" label="Raw Input" detail="1080p @ 30fps" />
                  <ArchNode icon="fa-sliders" label="Preprocessing" detail="Resize & Norm" />
                  
                  <div className="relative z-10 p-6 bg-blue-600 rounded-2xl shadow-xl shadow-blue-500/20 border border-blue-400/30">
                    <div className="text-xs font-bold uppercase tracking-widest text-blue-100 mb-4 text-center">Multi-Task Backbone</div>
                    <div className="flex gap-4">
                      <div className="px-3 py-2 bg-black/30 rounded-lg text-[10px] font-mono">YOLOv8 Head</div>
                      <div className="px-3 py-2 bg-black/30 rounded-lg text-[10px] font-mono">DeepLab Head</div>
                    </div>
                  </div>

                  <ArchNode icon="fa-layer-group" label="Feature Fusion" detail="SPPF & BiFPN" />
                  <ArchNode icon="fa-display" label="Perception" detail="BBoxes & Masks" />
                </div>

                <div className="mt-12 grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-4 flex items-center">
                      <i className="fa-solid fa-microchip mr-3 text-blue-500"></i>
                      Hardware Acceleration
                    </h4>
                    <p className="text-sm text-gray-400">
                      Optimized using TensorRT for NVIDIA Xavier NX. FP16 quantization enables 25ms inference time while maintaining ISO safety standards.
                    </p>
                  </div>
                  <div className="p-6 bg-black/40 rounded-2xl border border-white/5">
                    <h4 className="font-bold mb-4 flex items-center">
                      <i className="fa-solid fa-code-branch mr-3 text-emerald-500"></i>
                      Data Pipeline
                    </h4>
                    <p className="text-sm text-gray-400">
                      Automated CI/CD using GitHub Actions with integrated testing on BDD100K validation sets before production deployment.
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
