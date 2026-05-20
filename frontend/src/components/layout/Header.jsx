import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { LogOut, Search } from 'lucide-react';

const TITLES = {
  '/':          'Overview',
  '/upload':    'Upload',
  '/documents': 'Documents',
  '/nodes':     'Node Monitor',
  '/users':     'Users',
};

const S = {
  header: {
    height: 56,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0 24px',
    background: '#0F1623',
    borderBottom: '1px solid rgba(255,255,255,0.07)',
    flexShrink: 0,
    fontFamily: "'Inter', sans-serif",
  },
  title: {
    fontSize: 14,
    fontWeight: 600,
    color: '#f1f5f9',
    fontFamily: "'Inter', sans-serif",
  },
  right: {
    display: 'flex',
    alignItems: 'center',
    gap: 12,
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: 8,
    padding: '6px 12px',
    borderRadius: 10,
    background: '#141c28',
    border: '1px solid rgba(255,255,255,0.07)',
  },
  searchInput: {
    background: 'transparent',
    border: 'none',
    outline: 'none',
    fontSize: 13,
    color: '#94a3b8',
    width: 140,
    fontFamily: "'Inter', sans-serif",
  },
  avatar: {
    width: 28, height: 28,
    borderRadius: '50%',
    background: 'rgba(59,130,246,0.15)',
    border: '1px solid rgba(59,130,246,0.3)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: 11,
    fontWeight: 600,
    color: '#3b82f6',
    fontFamily: "'Inter', sans-serif",
    flexShrink: 0,
  },
  userInfo: {
    display: 'flex',
    flexDirection: 'column',
    gap: 1,
  },
  userName: {
    fontSize: 12,
    fontWeight: 500,
    color: '#f1f5f9',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1,
  },
  userRole: {
    fontSize: 10,
    color: '#64748b',
    textTransform: 'capitalize',
    fontFamily: "'Inter', sans-serif",
    lineHeight: 1,
  },
  logoutBtn: {
    padding: 6,
    borderRadius: 8,
    background: 'transparent',
    border: 'none',
    cursor: 'pointer',
    color: '#64748b',
    display: 'flex',
    alignItems: 'center',
    transition: 'all 0.15s ease',
  },
};

export default function Header() {
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [user, setUser] = useState(null);

  useEffect(() => {
    try { setUser(JSON.parse(localStorage.getItem('user') || 'null')); } catch {}
  }, []);

  return (
    <header style={S.header}>
      <span style={S.title}>{TITLES[pathname] ?? 'DistriDoc'}</span>

      <div style={S.right}>
        {/* Search */}
        <div style={S.searchBox}>
          <Search size={13} color="#64748b" />
          <input type="text" placeholder="Search…" style={S.searchInput} />
        </div>

        {/* User */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <div style={S.avatar}>{user?.name?.[0]?.toUpperCase() ?? 'G'}</div>
          <div style={S.userInfo}>
            <span style={S.userName}>{user?.name ?? 'Guest'}</span>
            <span style={S.userRole}>{user?.role ?? 'guest'}</span>
          </div>
        </div>

        {/* Logout */}
        <button
          style={S.logoutBtn}
          onClick={() => { localStorage.removeItem('token'); localStorage.removeItem('user'); navigate('/login'); }}
          onMouseEnter={e => { e.currentTarget.style.background = 'rgba(244,63,94,0.1)'; e.currentTarget.style.color = '#f43f5e'; }}
          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = '#64748b'; }}
          title="Log out"
        >
          <LogOut size={15} />
        </button>
      </div>
    </header>
  );
}