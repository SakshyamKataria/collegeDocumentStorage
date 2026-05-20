import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Download, FileText, CheckCircle2, Clock, XCircle, Edit3, Trash2, Search } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

const card = { background: '#0F1623', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 14, boxShadow: '0 4px 24px rgba(0,0,0,0.25)', overflow: 'hidden' };
const font = "'Inter', sans-serif";

const BADGE = {
  completed: { label: 'Replicated', color: '#10b981', bg: 'rgba(16,185,129,0.12)', Icon: CheckCircle2 },
  pending:   { label: 'Syncing',    color: '#f59e0b', bg: 'rgba(245,158,11,0.12)',  Icon: Clock        },
  failed:    { label: 'Failed',     color: '#f43f5e', bg: 'rgba(244,63,94,0.12)',   Icon: XCircle      },
};

const Badge = ({ status }) => {
  const b = BADGE[status] || BADGE.pending;
  return (
    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 8, background: b.bg, color: b.color, fontSize: 11, fontWeight: 500, fontFamily: font }}>
      <b.Icon size={11} />{b.label}
    </span>
  );
};

export default function DocumentsList() {
  const [docs, setDocs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [user, setUser] = useState(null);

  const fetchDocs = useCallback(async () => {
    try { const r = await api.get('/documents'); setDocs(r.data.data); }
    catch (e) { console.error(e); } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('user') || 'null')); } catch {}
    fetchDocs();
    const s = getSocket();
    s.on('document:created', d => { if (d) setDocs(p => [d, ...p.filter(x => x._id !== d._id)]); });
    s.on('document:deleted', ({ id }) => setDocs(p => p.filter(d => d._id !== id)));
    s.on('document:updated', u => setDocs(p => p.map(d => d._id === u._id ? u : d)));
    return () => { s.off('document:created'); s.off('document:deleted'); s.off('document:updated'); };
  }, [fetchDocs]);

  const download = async (id, name) => {
    try {
      const r = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([r.data]));
      a.setAttribute('download', name);
      document.body.appendChild(a); a.click(); a.remove();
    } catch { alert('Download failed'); }
  };

  const rename = async (id, cur) => {
    const t = window.prompt('New title:', cur);
    if (!t?.trim()) return;
    try { await api.put(`/documents/${id}`, { title: t.trim() }); setDocs(p => p.map(d => d._id === id ? { ...d, title: t.trim() } : d)); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const del = async (id) => {
    if (!window.confirm('Delete this document?')) return;
    try { await api.delete(`/documents/${id}`); setDocs(p => p.filter(d => d._id !== id)); }
    catch (e) { alert(e.response?.data?.error || 'Failed'); }
  };

  const isOwner = doc => {
    const uid = user?._id || user?.id;
    return user?.role === 'admin' || (doc?.uploadedBy?._id ?? doc?.uploadedBy) === uid;
  };

  const filtered = docs.filter(d =>
    d.title?.toLowerCase().includes(search.toLowerCase()) ||
    d.originalName?.toLowerCase().includes(search.toLowerCase())
  );

  const COLS = '2fr 1fr 1fr 1fr 1fr 100px';

  return (
    <div style={{ maxWidth: 1100, margin: '0 auto', fontFamily: font }}>
      {/* Top bar */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 24 }}>
        <div>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: 0 }}>Documents</h2>
          <p style={{ fontSize: 13, color: '#64748b', marginTop: 4 }}>{docs.length} file{docs.length !== 1 ? 's' : ''} stored</p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px', borderRadius: 10, background: '#141c28', border: '1px solid rgba(255,255,255,0.07)' }}>
          <Search size={13} color="#64748b" />
          <input type="text" placeholder="Filter…" value={search} onChange={e => setSearch(e.target.value)}
            style={{ background: 'transparent', border: 'none', outline: 'none', fontSize: 13, color: '#94a3b8', width: 150, fontFamily: font }} />
        </div>
      </div>

      {/* Table */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={card}>
        {/* Header */}
        <div style={{ display: 'grid', gridTemplateColumns: COLS, padding: '12px 20px', background: '#141c28', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          {['NAME','NODE','VISIBILITY','STATUS','SIZE','ACTIONS'].map((h, i) => (
            <span key={h} style={{ fontSize: 10, fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.08em', color: '#64748b', textAlign: i === 5 ? 'right' : 'left' }}>{h}</span>
          ))}
        </div>

        {/* Rows */}
        {loading ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>Loading…</div>
        ) : filtered.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center', color: '#64748b', fontSize: 13 }}>No documents found.</div>
        ) : filtered.map((doc, i) => (
          <motion.div key={doc._id}
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.03 }}
            style={{ display: 'grid', gridTemplateColumns: COLS, padding: '14px 20px', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.04)', cursor: 'default', transition: 'background 0.15s ease' }}
            onMouseEnter={e => e.currentTarget.style.background = '#141c28'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            {/* Name */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, minWidth: 0 }}>
              <div style={{ width: 34, height: 34, borderRadius: 9, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FileText size={15} color="#3b82f6" />
              </div>
              <div style={{ minWidth: 0 }}>
                <p style={{ fontSize: 13, fontWeight: 500, color: '#f1f5f9', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.title}</p>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{doc.originalName}</p>
              </div>
            </div>
            {/* Node */}
            <span style={{ fontSize: 12, color: '#94a3b8', fontFamily: 'monospace' }}>{doc.primaryNode}</span>
            {/* Visibility */}
            <span style={{ display: 'inline-flex' }}>
              <span style={{ fontSize: 11, padding: '4px 10px', borderRadius: 8, background: doc.visibility === 'shared' ? 'rgba(16,185,129,0.12)' : 'rgba(255,255,255,0.05)', color: doc.visibility === 'shared' ? '#10b981' : '#94a3b8', fontWeight: 500 }}>
                {doc.visibility}
              </span>
            </span>
            {/* Status */}
            <Badge status={doc.replicationStatus} />
            {/* Size */}
            <span style={{ fontSize: 12, color: '#64748b' }}>{(doc.size / 1024 / 1024).toFixed(2)} MB</span>
            {/* Actions */}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 4 }}>
              {[
                { I: Download, fn: () => download(doc._id, doc.originalName), always: true,        hc: '#3b82f6' },
                { I: Edit3,    fn: () => rename(doc._id, doc.title),          always: isOwner(doc), hc: '#f1f5f9' },
                { I: Trash2,   fn: () => del(doc._id),                        always: isOwner(doc), hc: '#f43f5e' },
              ].filter(b => b.always).map(({ I, fn, hc }, j) => (
                <button key={j} onClick={fn}
                  style={{ padding: 6, borderRadius: 7, background: 'transparent', border: 'none', cursor: 'pointer', color: '#64748b', display: 'flex', transition: 'all 0.15s ease' }}
                  onMouseEnter={e => { e.currentTarget.style.color = hc; e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; }}
                  onMouseLeave={e => { e.currentTarget.style.color = '#64748b'; e.currentTarget.style.background = 'transparent'; }}>
                  <I size={14} />
                </button>
              ))}
            </div>
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
}