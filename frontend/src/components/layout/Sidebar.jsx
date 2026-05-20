import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { LayoutDashboard, UploadCloud, Files, Cpu, Users, HardDrive } from 'lucide-react';

const nav   = [
  { label: 'Overview',  icon: LayoutDashboard, to: '/'          },
  { label: 'Upload',    icon: UploadCloud,     to: '/upload'    },
  { label: 'Documents', icon: Files,           to: '/documents' },
];
const admin = [
  { label: 'Nodes',     icon: Cpu,   to: '/nodes' },
  { label: 'Users',     icon: Users, to: '/users' },
];

const S = {
  aside: {
    width: 220,
    flexShrink: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '20px 12px',
    background: '#0F1623',
    borderRight: '1px solid rgba(255,255,255,0.07)',
    height: '100vh',
    overflowY: 'auto',
  },
  logo: {
    display: 'flex',
    alignItems: 'center',
    gap: 10,
    padding: '0 8px',
    marginBottom: 28,
  },
  logoIcon: {
    width: 28, height: 28,
    borderRadius: 8,
    background: '#3b82f6',
    boxShadow: '0 0 16px rgba(59,130,246,0.35)',
    display: 'flex', alignItems: 'center', justifyContent: 'center',
    flexShrink: 0,
  },
  logoText: {
    fontFamily: "'Inter', sans-serif",
    fontWeight: 600,
    fontSize: 14,
    color: '#f1f5f9',
  },
  sectionLabel: {
    padding: '0 8px',
    fontSize: 10,
    fontWeight: 500,
    textTransform: 'uppercase',
    letterSpacing: '0.1em',
    color: '#64748b',
    marginBottom: 6,
    fontFamily: "'Inter', sans-serif",
  },
  divider: {
    height: 1,
    background: 'rgba(255,255,255,0.07)',
    margin: '16px 8px',
  },
  statusBar: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '10px 12px',
    borderRadius: 10,
    background: '#141c28',
    marginTop: 'auto',
  },
  statusDot: {
    width: 7, height: 7,
    borderRadius: '50%',
    background: '#10b981',
    boxShadow: '0 0 6px #10b981',
    flexShrink: 0,
  },
  statusText: {
    fontSize: 12,
    color: '#94a3b8',
    fontFamily: "'Inter', sans-serif",
  },
};

function Item({ item }) {
  return (
    <NavLink
      to={item.to}
      end={item.to === '/'}
      style={{ textDecoration: 'none', display: 'block', marginBottom: 2 }}
    >
      {({ isActive }) => (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '9px 12px',
          borderRadius: 10,
          background: isActive ? 'rgba(59,130,246,0.12)' : 'transparent',
          border: isActive ? '1px solid rgba(59,130,246,0.25)' : '1px solid transparent',
          color: isActive ? '#f1f5f9' : '#94a3b8',
          fontSize: 13,
          fontWeight: isActive ? 500 : 400,
          fontFamily: "'Inter', sans-serif",
          cursor: 'pointer',
          transition: 'all 0.15s ease',
        }}
        onMouseEnter={e => { if (!isActive) { e.currentTarget.style.background = 'rgba(255,255,255,0.05)'; e.currentTarget.style.color = '#f1f5f9'; }}}
        onMouseLeave={e => { if (!isActive) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#94a3b8'; }}}
        >
          <item.icon size={15} color={isActive ? '#3b82f6' : 'currentColor'} />
          {item.label}
        </div>
      )}
    </NavLink>
  );
}

export default function Sidebar() {
  let user = null;
  try { user = JSON.parse(localStorage.getItem('user') || 'null'); } catch {}

  return (
    <motion.aside
      initial={{ x: -220 }}
      animate={{ x: 0 }}
      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
      style={S.aside}
    >
      {/* Logo */}
      <div style={S.logo}>
        <div style={S.logoIcon}><HardDrive size={14} color="white" /></div>
        <span style={S.logoText}>DistriDoc</span>
      </div>

      {/* Nav */}
      <div style={{ flex: 1 }}>
        <p style={S.sectionLabel}>Menu</p>
        {nav.map(i => <Item key={i.to} item={i} />)}

        {user?.role === 'admin' && (
          <>
            <div style={S.divider} />
            <p style={S.sectionLabel}>Admin</p>
            {admin.map(i => <Item key={i.to} item={i} />)}
          </>
        )}
      </div>

      {/* Status */}
      <div style={S.statusBar}>
        <span style={S.statusDot} />
        <span style={S.statusText}>All systems online</span>
      </div>
    </motion.aside>
  );
}