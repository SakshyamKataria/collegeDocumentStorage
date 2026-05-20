import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Activity, CheckCircle2, XCircle, HardDrive, Clock } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

function NodeCard({ node, index }) {
  const online = node.status === 'online';
  const color = online ? 'var(--emerald)' : 'var(--rose)';
  const dim   = online ? 'var(--emerald-dim)' : 'var(--rose-dim)';

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.35 }}
      className="rounded-2xl overflow-hidden"
      style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}
    >
      <div className="p-5 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)' }}>
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl" style={{ background: dim }}>
            <Server size={16} style={{ color }} />
          </div>
          <div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>{node.id}</p>
            <p className="text-xs font-mono mt-0.5" style={{ color: 'var(--text)' }}>{node.url}</p>
          </div>
        </div>
        <span className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: dim, color }}>
          {online ? <CheckCircle2 size={12} /> : <XCircle size={12} />}
          {online ? 'Online' : 'Offline'}
        </span>
      </div>

      <div className="grid grid-cols-2 divide-x" style={{ borderColor: 'var(--border)' }}>
        {[
          { label: 'Storage', value: node.totalSize ? `${(node.totalSize/1024/1024).toFixed(2)} MB` : '0 MB', icon: HardDrive },
          { label: 'Heartbeat', value: node.lastSeen ? `${Math.floor((Date.now()-node.lastSeen)/1000)}s ago` : 'Never', icon: Clock },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="p-4" style={{ borderRight: '1px solid var(--border)' }}>
            <div className="flex items-center gap-1.5 mb-1">
              <Icon size={11} style={{ color: 'var(--text)' }} />
              <p className="text-xs" style={{ color: 'var(--text)' }}>{label}</p>
            </div>
            <p className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>{value}</p>
          </div>
        ))}
      </div>
    </motion.div>
  );
}

export default function NodeMonitor() {
  const [nodes, setNodes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(u);
    if (u?.role === 'admin') {
      api.get('/nodes').then(r => setNodes(r.data.data)).catch(console.error).finally(() => setLoading(false));
    } else { setLoading(false); }
    const s = getSocket();
    s.on('node:update', ns => setNodes([...ns]));
    return () => s.off('node:update');
  }, []);

  if (!user || user.role !== 'admin') {
    return (
      <div className="flex flex-col items-center justify-center h-64 rounded-2xl"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)' }}>
        <XCircle size={28} style={{ color: 'var(--rose)' }} className="mb-3" />
        <p className="font-semibold" style={{ color: 'var(--text-h)' }}>Access denied</p>
        <p className="text-sm mt-1" style={{ color: 'var(--text)' }}>Admin privileges required.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>Node Monitor</h2>
          <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>
            {nodes.filter(n => n.status === 'online').length}/{nodes.length} nodes online · Redis Pub/Sub
          </p>
        </div>
        <span className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium"
          style={{ background: 'var(--emerald-dim)', color: 'var(--emerald)', border: '1px solid rgba(16,185,129,0.2)' }}>
          <Activity size={12} className="animate-pulse" /> Live
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {loading
            ? [0,1].map(i => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />)
            : nodes.map((n, i) => <NodeCard key={n.id} node={n} index={i} />)
          }
        </AnimatePresence>
      </div>
    </div>
  );
}
