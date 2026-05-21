import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Server, Activity, CheckCircle2, XCircle, HardDrive, Clock, AlertTriangle, Info } from 'lucide-react';
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

      <div className="grid grid-cols-3 divide-x" style={{ borderColor: 'var(--border)' }}>
        {[
          { label: 'Storage', value: node.totalSize ? `${(node.totalSize/1024/1024).toFixed(2)} MB` : '0 MB', icon: HardDrive },
          { label: 'Latency', value: node.latencyMs !== undefined ? `${node.latencyMs} ms` : '—', icon: Activity },
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

function TopologyView({ nodes }) {
  // A sleek animated topology showing Gateway -> Nodes
  return (
    <div className="rounded-2xl p-8 mb-8 relative flex flex-col items-center justify-center gap-16 overflow-hidden" 
         style={{ background: 'linear-gradient(180deg, #09090b 0%, #000 100%)', border: '1px solid var(--border)' }}>
      
      {/* Animated Background Grid */}
      <div className="absolute inset-0" 
           style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '30px 30px' }} />

      {/* Gateway */}
      <div className="z-10 flex flex-col items-center">
        <div className="w-16 h-16 rounded-2xl flex items-center justify-center relative shadow-[0_0_40px_rgba(59,130,246,0.3)]" style={{ background: 'var(--surface)', border: '1px solid var(--accent-border)' }}>
          <div className="absolute -inset-2 rounded-2xl animate-pulse" style={{ border: '1px solid var(--accent-glow)' }} />
          <Server size={24} style={{ color: 'var(--accent)' }} />
        </div>
        <p className="mt-3 font-semibold text-sm text-white">API Gateway</p>
        <span className="flex items-center gap-1.5 px-2 py-1 mt-1 rounded text-[10px] uppercase font-bold" style={{ background: 'var(--accent-dim)', color: 'var(--accent)' }}>
          Active
        </span>
      </div>

      {/* Connecting animated particles mapping Gateway -> Nodes */}
      <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden opacity-30 flex justify-center items-center">
         <svg className="w-full h-full" viewBox="0 0 1000 500" preserveAspectRatio="none">
            {nodes.map((node, i) => {
              const targetX = i === 0 ? 300 : 700;
              const online = node.status === 'online';
              const strokeColor = online ? 'var(--emerald)' : 'var(--rose)';
              return (
                <g key={`line-${node.id}`}>
                  <path d={`M 500 200 C 500 350, ${targetX} 250, ${targetX} 400`} fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="2" />
                  {online && (
                     <circle r="4" fill="var(--accent)">
                       <animateMotion dur="2s" repeatCount="indefinite" path={`M 500 200 C 500 350, ${targetX} 250, ${targetX} 400`} />
                     </circle>
                  )}
                </g>
              )
            })}
         </svg>
      </div>

      {/* Storage Nodes */}
      <div className="z-10 flex w-full justify-around px-8">
        {nodes.map(node => {
          const online = node.status === 'online';
          const color = online ? 'var(--emerald)' : 'var(--rose)';
          const glow = online ? 'rgba(34,197,94,0.3)' : 'rgba(239,68,68,0.3)';
          
          return (
            <div key={`topo-${node.id}`} className="flex flex-col items-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center relative transition-shadow duration-300" style={{ background: 'var(--surface)', border: `1px solid ${color}`, boxShadow: `0 0 25px ${glow}` }}>
                {online && <div className="absolute -inset-1.5 rounded-2xl animate-pulse opacity-50" style={{ border: `1px solid ${color}` }} />}
                <HardDrive size={22} style={{ color }} />
              </div>
              <p className="mt-3 font-semibold text-sm text-white">{node.id}</p>
              <p className="text-[11px] text-gray-500 font-mono mt-0.5">{node.url}</p>
              <span className="flex items-center gap-1.5 px-2 py-1 mt-1.5 rounded text-[10px] uppercase font-bold tracking-wider"
                style={{ background: online ? 'var(--emerald-dim)' : 'var(--rose-dim)', color }}>
                {online ? 'Online' : 'Offline'}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  );
}

export default function NodeMonitor() {
  const [nodes, setNodes] = useState([]);
  const [alerts, setAlerts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(u);
    if (u?.role === 'admin') {
      api.get('/nodes').then(r => {
        setNodes(r.data.data);
        if (r.data.alerts) setAlerts(r.data.alerts);
      }).catch(console.error).finally(() => setLoading(false));
    } else { setLoading(false); }
    const s = getSocket();
    s.on('node:update', ns => setNodes([...ns]));
    s.on('system:alert', newAlert => setAlerts(prev => [newAlert, ...prev].slice(0, 50)));
    return () => { s.off('node:update'); s.off('system:alert'); };
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

      {!loading && <TopologyView nodes={nodes} />}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <AnimatePresence>
          {loading
            ? [0,1].map(i => <div key={i} className="h-36 rounded-2xl animate-pulse" style={{ background: 'var(--surface)' }} />)
            : nodes.map((n, i) => <NodeCard key={n.id} node={n} index={i} />)
          }
        </AnimatePresence>
      </div>

      {/* System Alerts Panel */}
      <div className="mt-8 rounded-2xl overflow-hidden" style={{ background: '#09090b', border: '1px solid var(--border)' }}>
        <div className="p-4 flex items-center justify-between" style={{ borderBottom: '1px solid var(--border)', background: 'var(--bg-2)' }}>
          <div className="flex items-center gap-2">
            <Activity size={16} style={{ color: 'var(--text-h)' }} />
            <h3 className="font-semibold text-sm" style={{ color: 'var(--text-h)' }}>System, Security & Audit Logs</h3>
          </div>
          <span className="text-xs" style={{ color: 'var(--text)' }}>Latest 50 events</span>
        </div>
        <div className="p-4 h-64 overflow-y-auto font-mono text-xs space-y-2">
          {alerts.length === 0 ? (
            <p style={{ color: 'var(--text)' }} className="text-center mt-10">No system events recorded yet.</p>
          ) : (
            alerts.map(alert => {
              const isFault = alert.type === 'FAULT';
              const isRecovery = alert.type === 'RECOVERY';
              const isSecurity = alert.type === 'SECURITY';
              const isAudit = alert.type === 'AUDIT';
              
              let color = 'var(--text)';
              if (isFault) color = 'var(--rose)';
              if (isRecovery) color = 'var(--emerald)';
              if (isSecurity) color = '#f59e0b'; // Amber
              if (isAudit) color = '#3b82f6'; // Blue
              
              return (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }} 
                  animate={{ opacity: 1, x: 0 }} 
                  key={alert.id} 
                  className="flex gap-3 py-1"
                >
                  <span style={{ color: 'var(--text)', opacity: 0.5 }}>
                    [{new Date(alert.timestamp).toLocaleTimeString()}]
                  </span>
                  <span style={{ color, fontWeight: 'bold' }}>
                    [{alert.type}]
                  </span>
                  <span style={{ color: 'var(--text-h)' }}>
                    {alert.message}
                  </span>
                </motion.div>
              )
            })
          )}
        </div>
      </div>
    </div>
  );
}
