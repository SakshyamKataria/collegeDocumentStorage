import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, Share2, AlertTriangle, RefreshCw } from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import api from '../services/api';
import { getSocket } from '../services/socket';

const StatCard = ({ title, value, icon: Icon, trend, color }) => (
  <motion.div 
    whileHover={{ y: -4 }}
    className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm"
  >
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-xl bg-${color}-500/10`}>
        <Icon size={22} className={`text-${color}-500`} />
      </div>
      <span className={trend > 0 ? 'text-emerald-500 font-medium text-sm' : 'text-rose-500 font-medium text-sm'}>
        {trend > 0 ? '+' : ''}{trend}%
      </span>
    </div>
    <p className="text-slate-500 text-sm font-medium mb-1">{title}</p>
    <h3 className="text-3xl font-bold text-slate-800">{value}</h3>
  </motion.div>
);

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalDocuments: 0,
    totalSize: '0 MB',
    replicationRate: '100%',
    failedUploads: 0,
    chartData: []
  });
  const [loading, setLoading] = useState(true);

  const fetchAnalytics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/analytics');
      setStats(res.data.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
    const interval = setInterval(fetchAnalytics, 10000); // refresh every 10s

    const socket = getSocket();
    socket.on('analytics:update', fetchAnalytics);
    socket.on('document:created', fetchAnalytics);
    socket.on('document:deleted', fetchAnalytics);
    socket.on('document:updated', fetchAnalytics);
    socket.on('document:replicationUpdated', fetchAnalytics);
    socket.on('node:update', fetchAnalytics);

    return () => {
      clearInterval(interval);
      socket.off('analytics:update', fetchAnalytics);
      socket.off('document:created', fetchAnalytics);
      socket.off('document:deleted', fetchAnalytics);
      socket.off('document:updated', fetchAnalytics);
      socket.off('document:replicationUpdated', fetchAnalytics);
      socket.off('node:update', fetchAnalytics);
    };
  }, []);

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      <div className="flex justify-between items-end">
        <div>
          <h1 className="text-3xl font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-purple-600 tracking-tight">System Overview</h1>
          <p className="text-slate-500 mt-1">Live metrics from your Distributed Document Repository.</p>
        </div>
        <button onClick={fetchAnalytics} className="flex items-center gap-2 px-4 py-2 bg-white border border-slate-200 shadow-sm rounded-lg text-sm font-medium text-slate-600 hover:text-indigo-600 hover:border-indigo-200 transition-all">
          <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
          Refresh
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard title="Total Documents" value={stats.totalDocuments} icon={FileText} trend={12} color="indigo" />
        <StatCard title="Storage Used" value={stats.totalSize} icon={Database} trend={5} color="blue" />
        <StatCard title="Replication Rate" value={stats.replicationRate} icon={Share2} trend={0.1} color="emerald" />
        <StatCard title="Failed Uploads" value={stats.failedUploads} icon={AlertTriangle} trend={-14} color="rose" />
      </div>

      <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div className="mb-6">
          <h2 className="text-lg font-bold text-slate-800">Network Traffic</h2>
          <p className="text-sm text-slate-500">Upload vs Download volume across all nodes</p>
        </div>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorUploads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#6366f1" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                </linearGradient>
                <linearGradient id="colorDownloads" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#14b8a6" stopOpacity={0.3}/>
                  <stop offset="95%" stopColor="#14b8a6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dy={10} />
              <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8'}} dx={-10} />
              <CartesianGrid vertical={false} stroke="#e2e8f0" strokeDasharray="4 4" />
              <Tooltip 
                contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
              />
              <Area type="monotone" dataKey="uploads" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorUploads)" />
              <Area type="monotone" dataKey="downloads" stroke="#14b8a6" strokeWidth={3} fillOpacity={1} fill="url(#colorDownloads)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}
