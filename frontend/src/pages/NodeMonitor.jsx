import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Activity, CheckCircle2, XCircle } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function NodeMonitor() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);

    // Initial fetch only for admins
    const fetchNodes = async () => {
      try {
        const res = await api.get('/nodes');
        setNodes(res.data.data);
      } catch (err) {
        console.error('Failed to fetch initial nodes');
      } finally {
        setLoading(false);
      }
    };

    if (storedUser?.role === 'admin') {
      fetchNodes();
    } else {
      setLoading(false);
    }

    const socket = getSocket();
    socket.on('node:update', (updatedNodes) => {
      setNodes([...updatedNodes]);
    });

    return () => {
      socket.off('node:update');
    };
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-4 text-slate-500">Only admins can view the node monitoring dashboard.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Distributed Node Monitor</h1>
          <p className="text-slate-500 mt-1">Real-time heartbeat status from Redis Pub/Sub</p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-full text-sm font-medium border border-emerald-200">
          <Activity size={16} className="animate-pulse" />
          Live Monitoring
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence>
          {nodes.map((node) => (
            <motion.div
              key={node.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-6 border-b border-slate-100 flex justify-between items-start">
                <div className="flex items-center gap-4">
                  <div className={`p-3 rounded-xl ${node.status === 'online' ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                    <Server size={24} />
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-800 text-lg">{node.id}</h3>
                    <p className="text-sm text-slate-500 font-mono">{node.url}</p>
                  </div>
                </div>
                <div className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-semibold ${
                  node.status === 'online' ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'
                }`}>
                  {node.status === 'online' ? <CheckCircle2 size={16} /> : <XCircle size={16} />}
                  {node.status.toUpperCase()}
                </div>
              </div>
              
              <div className="bg-slate-50 p-6 grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Storage Consumed</p>
                  <p className="text-lg font-bold text-slate-700">
                    {node.totalSize ? (node.totalSize / 1024 / 1024).toFixed(2) + ' MB' : '0 MB'}
                  </p>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase mb-1">Last Heartbeat</p>
                  <p className="text-lg font-bold text-slate-700">
                    {node.lastSeen ? Math.floor((Date.now() - node.lastSeen) / 1000) + 's ago' : 'Never'}
                  </p>
                </div>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
