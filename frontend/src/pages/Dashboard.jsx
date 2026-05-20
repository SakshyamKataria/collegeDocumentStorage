import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { FileText, Database, Share2, AlertTriangle, RefreshCw } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import api from '../services/api';
import { getSocket } from '../services/socket';

const STATS = [
  { key: 'totalDocuments',  label: 'Total Documents', Icon: FileText,      color: '#3b82f6', dim: 'rgba(59,130,246,0.12)'   },
  { key: 'totalSize',       label: 'Storage Used',    Icon: Database,      color: '#a78bfa', dim: 'rgba(167,139,250,0.12)'  },
  { key: 'replicationRate', label: 'Replication',     Icon: Share2,        color: '#10b981', dim: 'rgba(16,185,129,0.12)'   },
  { key: 'failedUploads',   label: 'Failed Uploads',  Icon: AlertTriangle, color: '#f43f5e', dim: 'rgba(244,63,94,0.12)'    },
];

const card = {
  background: '#0F1623',
  border: '1px solid rgba(255,255,255,0.07)',
  borderRadius: 14,
  padding: 20,
  boxShadow: '0 4px 24px rgba(0,0,0,0.25)',
  transition: 'transform 0.15s ease, box-shadow 0.15s ease',
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1a2336', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 10, padding: '10px 14px', boxShadow: '0 8px 24px rgba(0,0,0,0.4)', fontFamily: "'Inter', sans-serif" }}>
      <p style={{ color: '#64748b', fontSize: 11, marginBottom: 6 }}>{label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ color: p.stroke, fontSize: 12, margin: '2px 0' }}>
          {p.dataKey}: <strong style={{ color: '#f1f5f9' }}>{p.value}</strong>
        </p>
      ))}
    </div>
  );
};

export default function Dashboard() {
  const [stats, setStats] = useState({ totalDocuments: 0, totalSize: '0 MB', replicationRate: '100%', failedUploads: 0, chartData: [] });
  const [loading, setLoading] = useState(true);

  const fetchData = async () => {
    try { setLoading(true); const r = await api.get('/analytics'); setStats(r.data.data); }
    catch {} finally { setLoading(false); }
  };

  useEffect(() => {
    fetchData();
    const iv = setInterval(fetchData, 10000);
    const s = getSocket();
    const evs = ['analytics:update','document:created','document:deleted','document:updated','document:replicationUpdated','node:update'];
    evs.forEach(e => s.on(e, fetchData));
    return () => { clearInterval(iv); evs.forEach(e => s.off(e, fetchData)); };
  }, []);

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: "'Inter', sans-serif" }}>
      {/* Header row */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Overview</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>Live system metrics · auto-refresh every 10s</p>
        </div>
        <button onClick={fetchData}
          style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: '#141c28', border: '1px solid rgba(255,255,255,0.07)', color: '#94a3b8', fontSize: 13, cursor: 'pointer', fontFamily: "'Inter', sans-serif" }}
          onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
          onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'}>
          <RefreshCw size={13} color="#3b82f6" style={loading ? { animation: 'spin 1s linear infinite' } : {}} />
          Refresh
        </button>
      </div>

      {/* Stat cards - 4 col */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {STATS.map(({ key, label, Icon, color, dim }, i) => (
          <motion.div key={key}
            initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07, duration: 0.3 }}
            style={card}
            onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.35)'; }}
            onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 24px rgba(0,0,0,0.25)'; }}
          >
            <div style={{ width: 36, height: 36, borderRadius: 10, background: dim, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16 }}>
              <Icon size={17} color={color} />
            </div>
            <p style={{ fontSize: 12, color: '#64748b', marginBottom: 4 }}>{label}</p>
            <p style={{ fontSize: 26, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>{stats[key] ?? '—'}</p>
          </motion.div>
        ))}
      </div>

      {/* Chart */}
      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.32, duration: 0.3 }}
        style={{ ...card, padding: 24 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
          <div>
            <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', margin: 0 }}>Network Traffic</p>
            <p style={{ fontSize: 12, color: '#64748b', marginTop: 4 }}>Upload vs download across all nodes</p>
          </div>
          <div style={{ display: 'flex', gap: 16, fontSize: 12 }}>
            {[['Uploads','#3b82f6'],['Downloads','#10b981']].map(([l,c]) => (
              <span key={l} style={{ display: 'flex', alignItems: 'center', gap: 6, color: c }}>
                <span style={{ width: 16, height: 2, background: c, borderRadius: 1, display: 'inline-block' }} />
                {l}
              </span>
            ))}
          </div>
        </div>
        <div style={{ height: 200 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={stats.chartData} margin={{ top: 4, right: 0, left: -24, bottom: 0 }}>
              <defs>
                <linearGradient id="gU" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#3b82f6" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#3b82f6" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="gD" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#10b981" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="#10b981" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid vertical={false} stroke="rgba(255,255,255,0.04)" />
              <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }} dy={6} />
              <YAxis axisLine={false} tickLine={false} tick={{ fill: '#64748b', fontSize: 11, fontFamily: 'Inter' }} />
              <Tooltip content={<CustomTooltip />} />
              <Area type="monotone" dataKey="uploads"   stroke="#3b82f6" strokeWidth={1.5} fill="url(#gU)" dot={false} />
              <Area type="monotone" dataKey="downloads" stroke="#10b981" strokeWidth={1.5} fill="url(#gD)" dot={false} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </motion.div>
    </div>
  );
}