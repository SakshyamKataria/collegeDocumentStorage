import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { UploadCloud, File, CheckCircle2, X, AlertCircle, Lock, Globe } from 'lucide-react';
import { uploadDocument } from '../services/api';

const font = "'Inter', sans-serif";
const card = { background: '#0F1623', border: '1px solid rgba(255,255,255,0.07)', borderRadius: 16, padding: 28, boxShadow: '0 4px 24px rgba(0,0,0,0.25)' };

export default function UploadCenter() {
  const [drag, setDrag] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle');
  const [meta, setMeta] = useState({ title: '', visibility: 'private' });

  const onDrag = e => { e.preventDefault(); e.stopPropagation(); setDrag(e.type === 'dragenter' || e.type === 'dragover'); };
  const onDrop = e => { e.preventDefault(); e.stopPropagation(); setDrag(false); const f = e.dataTransfer.files?.[0]; if (f) { setFile(f); setStatus('idle'); } };
  const upload = async () => {
    if (!file) return;
    setStatus('uploading'); setProgress(0);
    try { await uploadDocument(file, meta, p => setProgress(p)); setStatus('success'); }
    catch { setStatus('error'); }
  };
  const reset = () => { setFile(null); setStatus('idle'); setProgress(0); };

  return (
    <div style={{ maxWidth: 560, margin: '0 auto', fontFamily: font }}>
      <h2 style={{ fontSize: 22, fontWeight: 700, color: '#f1f5f9', margin: '0 0 6px 0' }}>Upload</h2>
      <p style={{ fontSize: 13, color: '#64748b', margin: '0 0 24px 0' }}>Push a document to the distributed network</p>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={card}>
        {/* Title */}
        <div style={{ marginBottom: 18 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Document title</label>
          <input type="text" value={meta.title} onChange={e => setMeta(m => ({ ...m, title: e.target.value }))}
            placeholder="E.g. Distributed Systems Assignment"
            style={{ width: '100%', padding: '11px 14px', borderRadius: 10, background: '#141c28', border: '1px solid rgba(255,255,255,0.07)', color: '#f1f5f9', fontSize: 13, fontFamily: font, outline: 'none', boxSizing: 'border-box', transition: 'border-color 0.15s ease' }}
            onFocus={e => { e.target.style.borderColor = '#3b82f6'; e.target.style.boxShadow = '0 0 0 3px rgba(59,130,246,0.12)'; }}
            onBlur={e => { e.target.style.borderColor = 'rgba(255,255,255,0.07)'; e.target.style.boxShadow = 'none'; }}
          />
        </div>

        {/* Visibility */}
        <div style={{ marginBottom: 22 }}>
          <label style={{ display: 'block', fontSize: 12, fontWeight: 500, color: '#94a3b8', marginBottom: 8 }}>Visibility</label>
          <div style={{ display: 'flex', gap: 6, padding: 4, borderRadius: 11, background: '#141c28', border: '1px solid rgba(255,255,255,0.07)' }}>
            {[{ value: 'private', label: 'Private', Icon: Lock }, { value: 'shared', label: 'Shared', Icon: Globe }].map(({ value, label, Icon }) => {
              const active = meta.visibility === value;
              return (
                <button key={value} type="button" onClick={() => setMeta(m => ({ ...m, visibility: value }))}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '9px 0', borderRadius: 8, border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent', background: active ? '#1a2336' : 'transparent', color: active ? '#f1f5f9' : '#64748b', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: font, transition: 'all 0.15s ease' }}>
                  <Icon size={13} color={active ? '#3b82f6' : 'currentColor'} />{label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Drop zone */}
        <div onDragEnter={onDrag} onDragLeave={onDrag} onDragOver={onDrag} onDrop={onDrop}
          style={{ minHeight: 200, borderRadius: 12, border: `2px dashed ${drag ? '#3b82f6' : file ? '#10b981' : 'rgba(255,255,255,0.12)'}`, background: drag ? 'rgba(59,130,246,0.07)' : file ? 'rgba(16,185,129,0.07)' : '#141c28', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s ease', marginBottom: 20, boxShadow: drag ? '0 0 0 4px rgba(59,130,246,0.1)' : 'none' }}>
          <AnimatePresence mode="wait">
            {file ? (
              <motion.div key="file" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(16,185,129,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <File size={22} color="#10b981" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px 0' }}>{file.name}</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 14px 0' }}>{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#f43f5e', background: 'none', border: 'none', cursor: 'pointer', fontFamily: font }}>
                  <X size={12} /> Remove
                </button>
              </motion.div>
            ) : (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '32px 20px' }}>
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'rgba(59,130,246,0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 12 }}>
                  <UploadCloud size={22} color="#3b82f6" />
                </div>
                <p style={{ fontSize: 14, fontWeight: 600, color: '#f1f5f9', margin: '0 0 4px 0' }}>Drag & drop your file here</p>
                <p style={{ fontSize: 12, color: '#64748b', margin: '0 0 16px 0' }}>or click to browse from your computer</p>
                <input type="file" id="fu" style={{ display: 'none' }} onChange={e => { const f = e.target.files?.[0]; if (f) { setFile(f); setStatus('idle'); } }} />
                <label htmlFor="fu" style={{ padding: '8px 18px', borderRadius: 9, background: '#1a2336', border: '1px solid rgba(255,255,255,0.1)', color: '#94a3b8', fontSize: 12, fontWeight: 500, cursor: 'pointer', fontFamily: font, transition: 'border-color 0.15s ease' }}
                  onMouseEnter={e => e.currentTarget.style.borderColor = '#3b82f6'}
                  onMouseLeave={e => e.currentTarget.style.borderColor = 'rgba(255,255,255,0.1)'}>
                  Browse files
                </label>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Progress / feedback */}
        <AnimatePresence>
          {status === 'uploading' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ marginBottom: 16 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, marginBottom: 8 }}>
                <span style={{ color: '#94a3b8' }}>Uploading…</span>
                <span style={{ color: '#3b82f6', fontWeight: 600 }}>{progress}%</span>
              </div>
              <div style={{ height: 4, borderRadius: 2, background: '#1a2336', overflow: 'hidden' }}>
                <motion.div style={{ height: '100%', background: '#3b82f6', borderRadius: 2 }}
                  initial={{ width: 0 }} animate={{ width: `${progress}%` }} transition={{ duration: 0.15 }} />
              </div>
            </motion.div>
          )}
          {status === 'success' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10, background: 'rgba(16,185,129,0.1)', border: '1px solid rgba(16,185,129,0.2)', marginBottom: 16 }}>
              <CheckCircle2 size={15} color="#10b981" />
              <div>
                <p style={{ fontSize: 13, fontWeight: 600, color: '#10b981', margin: 0 }}>Upload successful</p>
                <p style={{ fontSize: 11, color: '#64748b', margin: 0 }}>Being replicated across nodes.</p>
              </div>
            </motion.div>
          )}
          {status === 'error' && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}
              style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 16px', borderRadius: 10, background: 'rgba(244,63,94,0.1)', border: '1px solid rgba(244,63,94,0.2)', color: '#f43f5e', fontSize: 13, marginBottom: 16 }}>
              <AlertCircle size={15} /> Upload failed. Please try again.
            </motion.div>
          )}
        </AnimatePresence>

        {/* Submit */}
        <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={upload} disabled={!file || status === 'uploading' || status === 'success'}
            style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 22px', borderRadius: 10, background: '#3b82f6', color: 'white', fontWeight: 600, fontSize: 13, border: 'none', cursor: (!file || status !== 'idle') ? 'not-allowed' : 'pointer', opacity: (!file || status !== 'idle') ? 0.45 : 1, boxShadow: '0 0 20px rgba(59,130,246,0.25)', fontFamily: font, transition: 'all 0.15s ease' }}
            onMouseEnter={e => { if (file && status === 'idle') e.currentTarget.style.background = '#2563eb'; }}
            onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; }}>
            <UploadCloud size={15} />
            {status === 'uploading' ? 'Uploading…' : 'Upload'}
          </button>
        </div>
      </motion.div>
    </div>
  );
}