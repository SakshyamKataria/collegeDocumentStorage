import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Trash2, ShieldCheck, ShieldOff, XCircle } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  const fetchUsers = async () => {
    try { setLoading(true); const r = await api.get('/users'); setUsers(r.data.data); }
    catch (e) { setError(e.response?.data?.error || 'Failed to load users'); }
    finally { setLoading(false); }
  };

  useEffect(() => {
    const u = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(u);
    if (u?.role === 'admin') {
      fetchUsers();
      const s = getSocket();
      s.on('user:roleUpdated', fetchUsers);
      s.on('user:deleted', fetchUsers);
      return () => { s.off('user:roleUpdated', fetchUsers); s.off('user:deleted', fetchUsers); };
    } else { setLoading(false); }
  }, []);

  const updateRole = async (uid, role) => {
    try {
      const r = await api.put(`/users/${uid}/role`, { role });
      setUsers(p => p.map(u => u._id === uid ? { ...u, role: r.data.data.role } : u));
    } catch (e) { setError(e.response?.data?.error || 'Failed'); }
  };

  const deleteUser = async (uid) => {
    if (!window.confirm('Delete this user?')) return;
    try { await api.delete(`/users/${uid}`); fetchUsers(); }
    catch (e) { setError(e.response?.data?.error || 'Failed'); }
  };

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
      <div>
        <h2 className="text-xl font-bold" style={{ color: 'var(--text-h)' }}>Users</h2>
        <p className="text-sm mt-0.5" style={{ color: 'var(--text)' }}>{users.length} accounts registered</p>
      </div>

      {error && (
        <div className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm"
          style={{ background: 'var(--rose-dim)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.2)' }}>
          <XCircle size={14} />{error}
        </div>
      )}

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl overflow-hidden"
        style={{ background: 'var(--bg-2)', border: '1px solid var(--border)', boxShadow: '0 4px 20px rgba(0,0,0,0.2)' }}>
        <table className="w-full text-left">
          <thead>
            <tr style={{ background: 'var(--surface)', borderBottom: '1px solid var(--border)' }}>
              {['User', 'Email', 'Role', 'Actions'].map((h, i) => (
                <th key={h} className={`px-5 py-3 text-xs font-medium uppercase tracking-wider ${i===3?'text-right':''}`}
                  style={{ color: 'var(--text)' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              [0,1,2].map(i => (
                <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                  {[0,1,2,3].map(j => (
                    <td key={j} className="px-5 py-4">
                      <div className="h-3 rounded-lg animate-pulse" style={{ background: 'var(--surface-2)', width: j===3?60:'70%' }} />
                    </td>
                  ))}
                </tr>
              ))
            ) : users.length === 0 ? (
              <tr><td colSpan={4} className="px-5 py-12 text-center text-sm" style={{ color: 'var(--text)' }}>No users found.</td></tr>
            ) : users.map((u, i) => (
              <motion.tr key={u._id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                style={{ borderBottom: '1px solid var(--border)' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--surface)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                {/* Name */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0"
                      style={{ background: 'var(--accent-dim)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                      {u.name?.[0]?.toUpperCase()}
                    </div>
                    <span className="font-medium text-sm" style={{ color: 'var(--text-h)' }}>{u.name}</span>
                  </div>
                </td>
                {/* Email */}
                <td className="px-5 py-3.5 text-sm" style={{ color: 'var(--text)' }}>{u.email}</td>
                {/* Role */}
                <td className="px-5 py-3.5">
                  <span className="px-2.5 py-1 rounded-lg text-xs font-medium"
                    style={{
                      background: u.role === 'admin' ? 'var(--accent-dim)' : 'var(--surface-2)',
                      color: u.role === 'admin' ? 'var(--accent)' : 'var(--text-2)',
                    }}>
                    {u.role}
                  </span>
                </td>
                {/* Actions */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center justify-end gap-2">
                    <button type="button" onClick={() => updateRole(u._id, u.role === 'admin' ? 'user' : 'admin')}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'var(--surface-2)', color: 'var(--text-2)', border: '1px solid var(--border)' }}
                      onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent)'; e.currentTarget.style.color = 'var(--accent)'; }}
                      onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.color = 'var(--text-2)'; }}>
                      {u.role === 'admin' ? <ShieldOff size={12} /> : <ShieldCheck size={12} />}
                      {u.role === 'admin' ? 'Demote' : 'Promote'}
                    </button>
                    <button type="button" onClick={() => deleteUser(u._id)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all"
                      style={{ background: 'var(--rose-dim)', color: 'var(--rose)', border: '1px solid rgba(244,63,94,0.2)' }}
                      onMouseEnter={e => e.currentTarget.style.opacity = '0.7'}
                      onMouseLeave={e => e.currentTarget.style.opacity = '1'}>
                      <Trash2 size={12} /> Delete
                    </button>
                  </div>
                </td>
              </motion.tr>
            ))}
          </tbody>
        </table>
      </motion.div>
    </div>
  );
}
