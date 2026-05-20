import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Lock, User, ArrowRight, Loader2, AlertCircle, HardDrive } from 'lucide-react';
import api from '../services/api';

const F = {
  page: {
    minHeight: '100vh',
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#0B0F14',
    fontFamily: "'Inter', -apple-system, sans-serif",
    position: 'relative',
    overflow: 'hidden',
  },
  glow: {
    position: 'absolute',
    width: 500, height: 500,
    borderRadius: '50%',
    background: 'radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%)',
    top: '50%', left: '50%',
    transform: 'translate(-50%, -50%)',
    filter: 'blur(60px)',
    pointerEvents: 'none',
  },
  card: {
    position: 'relative',
    width: '100%',
    maxWidth: 380,
    margin: '0 16px',
    padding: 36,
    borderRadius: 18,
    background: 'rgba(15,22,35,0.85)',
    backdropFilter: 'blur(24px)',
    WebkitBackdropFilter: 'blur(24px)',
    border: '1px solid rgba(255,255,255,0.10)',
    boxShadow: '0 24px 64px rgba(0,0,0,0.5)',
  },
  logoRow: { display: 'flex', alignItems: 'center', gap: 10, marginBottom: 28 },
  logoIcon: {
    width: 32, height: 32, borderRadius: 9,
    background: '#3b82f6',
    boxShadow: '0 0 20px rgba(59,130,246,0.4)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
  },
  logoText: { fontWeight: 600, fontSize: 15, color: '#f1f5f9' },
  heading: { fontSize: 24, fontWeight: 700, color: '#f1f5f9', marginBottom: 6, lineHeight: 1.2 },
  sub: { fontSize: 13, color: '#64748b', marginBottom: 28 },
  toggle: {
    display: 'flex',
    borderRadius: 10,
    padding: 4,
    background: '#141c28',
    border: '1px solid rgba(255,255,255,0.07)',
    marginBottom: 24,
    gap: 4,
  },
  toggleBtn: (active) => ({
    flex: 1,
    padding: '8px 0',
    borderRadius: 7,
    border: active ? '1px solid rgba(255,255,255,0.1)' : '1px solid transparent',
    background: active ? '#1a2336' : 'transparent',
    color: active ? '#f1f5f9' : '#64748b',
    fontSize: 12,
    fontWeight: 500,
    cursor: 'pointer',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s ease',
  }),
  fieldWrap: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '12px 14px',
    borderRadius: 10,
    background: '#141c28',
    border: '1px solid rgba(255,255,255,0.07)',
    marginBottom: 10,
    transition: 'border-color 0.15s ease',
  },
  fieldInput: {
    flex: 1,
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: 13,
    color: '#f1f5f9',
    fontFamily: "'Inter', sans-serif",
  },
  errorBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 14px',
    borderRadius: 10,
    background: 'rgba(244,63,94,0.1)',
    border: '1px solid rgba(244,63,94,0.25)',
    color: '#f43f5e',
    fontSize: 12,
    marginBottom: 16,
  },
  submitBtn: (loading) => ({
    width: '100%',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: '13px 0',
    borderRadius: 10,
    background: '#3b82f6',
    color: 'white',
    fontWeight: 600,
    fontSize: 14,
    border: 'none',
    cursor: loading ? 'not-allowed' : 'pointer',
    opacity: loading ? 0.7 : 1,
    boxShadow: '0 0 24px rgba(59,130,246,0.3)',
    fontFamily: "'Inter', sans-serif",
    transition: 'all 0.15s ease',
    marginTop: 6,
  }),
  switchText: { textAlign: 'center', fontSize: 13, color: '#64748b', marginTop: 20 },
  switchLink: { color: '#3b82f6', cursor: 'pointer', fontWeight: 500, background: 'none', border: 'none', fontFamily: "'Inter', sans-serif", fontSize: 13 },
};

function Field({ icon: Icon, type, placeholder, value, onChange, required }) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ ...F.fieldWrap, borderColor: focused ? '#3b82f6' : 'rgba(255,255,255,0.07)', boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.12)' : 'none' }}>
      <Icon size={15} color={focused ? '#3b82f6' : '#64748b'} />
      <input type={type} placeholder={placeholder} value={value} onChange={onChange} required={required}
        style={F.fieldInput} onFocus={() => setFocused(true)} onBlur={() => setFocused(false)} />
    </div>
  );
}

export default function Login() {
  const navigate = useNavigate();
  const [isLogin, setIsLogin] = useState(true);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const set = k => e => setForm(f => ({ ...f, [k]: e.target.value }));

  const submit = async e => {
    e.preventDefault(); setError(''); setLoading(true);
    try {
      const res = await api.post(isLogin ? '/auth/login' : '/auth/register',
        isLogin ? { email: form.email, password: form.password }
                : { name: form.name, email: form.email, password: form.password });
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('user', JSON.stringify(res.data.user));
      navigate('/');
    } catch (err) { setError(err.response?.data?.error || 'Authentication failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={F.page}>
      <div style={F.glow} />
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4, ease: 'easeOut' }}>
        <div style={F.card}>
          {/* Logo */}
          <div style={F.logoRow}>
            <div style={F.logoIcon}><HardDrive size={16} color="white" /></div>
            <span style={F.logoText}>DistriDoc</span>
          </div>

          <h2 style={F.heading}>{isLogin ? 'Welcome back' : 'Create account'}</h2>
          <p style={F.sub}>{isLogin ? 'Sign in to your workspace' : 'Get started with DistriDoc'}</p>

          {/* Toggle */}
          <div style={F.toggle}>
            {['Sign In', 'Register'].map((label, i) => (
              <button key={label} type="button" style={F.toggleBtn(isLogin ? i === 0 : i === 1)}
                onClick={() => { setIsLogin(i === 0); setError(''); }}>
                {label}
              </button>
            ))}
          </div>

          {/* Error */}
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                <div style={F.errorBox}><AlertCircle size={14} />{error}</div>
              </motion.div>
            )}
          </AnimatePresence>

          <form onSubmit={submit}>
            <AnimatePresence>
              {!isLogin && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}>
                  <Field icon={User} type="text" placeholder="Full name" value={form.name} onChange={set('name')} required />
                </motion.div>
              )}
            </AnimatePresence>
            <Field icon={Mail} type="email" placeholder="Email address" value={form.email} onChange={set('email')} required />
            <Field icon={Lock} type="password" placeholder="Password" value={form.password} onChange={set('password')} required />
            <button type="submit" disabled={loading} style={F.submitBtn(loading)}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = '#2563eb'; }}
              onMouseLeave={e => { e.currentTarget.style.background = '#3b82f6'; }}>
              {loading
                ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Signing in…</>
                : <>{isLogin ? 'Sign in' : 'Create account'} <ArrowRight size={15} /></>
              }
            </button>
          </form>

          <p style={F.switchText}>
            {isLogin ? "Don't have an account? " : 'Already have an account? '}
            <button type="button" style={F.switchLink} onClick={() => { setIsLogin(!isLogin); setError(''); }}>
              {isLogin ? 'Register' : 'Sign in'}
            </button>
          </p>
        </div>
      </motion.div>
    </div>
  );
}