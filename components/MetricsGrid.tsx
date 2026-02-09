
import React from 'react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const data = [
  { time: '00:00', latency: 45, fps: 22 },
  { time: '00:05', latency: 48, fps: 21 },
  { time: '00:10', latency: 42, fps: 24 },
  { time: '00:15', latency: 50, fps: 20 },
  { time: '00:20', latency: 44, fps: 23 },
  { time: '00:25', latency: 41, fps: 25 },
  { time: '00:30', latency: 46, fps: 22 },
];

const MetricsGrid: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <MetricCard title="mAP @0.5 (YOLOv8)" value="65.4%" trend="+1.2%" color="text-blue-500" />
      <MetricCard title="Lane IoU (DeepLabV3)" value="72.8%" trend="+0.8%" color="text-emerald-500" />
      <MetricCard title="Avg Latency (CPU)" value="44.2ms" trend="-2.1ms" color="text-amber-500" />
      <MetricCard title="Target FPS" value="22.5" trend="Stable" color="text-purple-500" />

      <div className="col-span-1 md:col-span-2 lg:col-span-3 bg-[#0f0f0f] p-6 rounded-2xl border border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="space-y-1">
            <h3 className="font-bold">Real-time Inference Stability</h3>
            <p className="text-xs text-gray-500">Monitoring multi-task pipeline jitter across CPU/NPU</p>
          </div>
          <div className="flex items-center space-x-4 text-[10px] font-mono uppercase tracking-wider">
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-blue-500 mr-2"></div> Latency</div>
            <div className="flex items-center"><div className="w-2 h-2 rounded-full bg-emerald-500 mr-2"></div> FPS</div>
          </div>
        </div>
        <div className="h-48">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <defs>
                <linearGradient id="colorLatency" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#222" vertical={false} />
              <XAxis dataKey="time" stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <YAxis stroke="#444" fontSize={10} tickLine={false} axisLine={false} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#111', border: '1px solid #333', borderRadius: '8px' }}
                itemStyle={{ fontSize: '12px' }}
              />
              <Area type="monotone" dataKey="latency" stroke="#3b82f6" fillOpacity={1} fill="url(#colorLatency)" strokeWidth={2} />
              <Area type="monotone" dataKey="fps" stroke="#10b981" fillOpacity={0} strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="col-span-1 bg-[#0f0f0f] p-6 rounded-2xl border border-white/5">
        <h3 className="font-bold mb-4">Training Progress</h3>
        <div className="space-y-4">
          <ClassRow label="Detection mAP" progress={65} color="bg-blue-500" />
          <ClassRow label="Segmentation IoU" progress={72} color="bg-emerald-500" />
          <ClassRow label="Recall" progress={88} color="bg-purple-500" />
          <ClassRow label="Precision" progress={82} color="bg-amber-500" />
        </div>
      </div>
    </div>
  );
};

const MetricCard = ({ title, value, trend, color }: any) => (
  <div className="bg-[#0f0f0f] p-6 rounded-2xl border border-white/5 hover:border-white/10 transition-colors">
    <h4 className="text-gray-500 text-[10px] font-bold uppercase tracking-wider mb-2">{title}</h4>
    <div className="flex items-end justify-between">
      <span className={`text-2xl font-bold ${color}`}>{value}</span>
      <span className={`text-xs ${trend.includes('+') ? 'text-emerald-500' : 'text-red-500'} font-mono`}>{trend}</span>
    </div>
  </div>
);

const ClassRow = ({ label, progress, color }: any) => (
  <div>
    <div className="flex justify-between text-[11px] mb-1">
      <span className="text-gray-400">{label}</span>
      <span className="font-mono text-white">{progress}%</span>
    </div>
    <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
      <div className={`h-full ${color} rounded-full`} style={{ width: `${progress}%` }}></div>
    </div>
  </div>
);

export default MetricsGrid;
