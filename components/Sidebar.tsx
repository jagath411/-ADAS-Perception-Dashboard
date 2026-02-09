
import React from 'react';

interface Props {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

const Sidebar: React.FC<Props> = ({ activeTab, setActiveTab }) => {
  const tabs = [
    { id: 'dashboard', icon: 'fa-chart-line', label: 'Inference' },
    { id: 'metrics', icon: 'fa-microchip', label: 'Models & Metrics' },
    { id: 'architecture', icon: 'fa-project-diagram', label: 'Architecture' },
    { id: 'dataset', icon: 'fa-database', label: 'Dataset Explorer' },
    { id: 'config', icon: 'fa-cog', label: 'System Config' },
  ];

  return (
    <div className="w-20 lg:w-64 h-full bg-[#0a0a0a] border-r border-white/5 flex flex-col p-4">
      <div className="flex items-center space-x-3 mb-10 px-2">
        <div className="w-10 h-10 rounded-xl bg-blue-600 flex items-center justify-center shrink-0 shadow-lg shadow-blue-500/20">
          <i className="fa-solid fa-car-side text-white"></i>
        </div>
        <span className="hidden lg:block font-bold text-lg tracking-tight">ADAS Perception</span>
      </div>

      <nav className="flex-1 space-y-2">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`w-full flex items-center p-3 rounded-xl transition-all duration-200 group ${
              activeTab === tab.id 
                ? 'bg-blue-600/10 text-blue-500 border border-blue-500/20' 
                : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }`}
          >
            <i className={`fa-solid ${tab.icon} text-lg lg:mr-4 shrink-0 transition-transform group-hover:scale-110`}></i>
            <span className="hidden lg:block font-medium text-sm">{tab.label}</span>
          </button>
        ))}
      </nav>

      <div className="mt-auto p-4 hidden lg:block rounded-2xl bg-gradient-to-br from-blue-600/20 to-purple-600/20 border border-white/5">
        <h4 className="text-xs font-bold text-blue-400 uppercase mb-2">Safety Status</h4>
        <div className="flex items-center space-x-2 text-xs text-white/60">
          <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
          <span>SIL-2 Compliant</span>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
