import React, { useEffect, useState } from 'react';
import { Trash2, ShieldCheck, ShieldOff } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [user, setUser] = useState(null);

  useEffect(() => {
    const storedUser = JSON.parse(localStorage.getItem('user') || 'null');
    setUser(storedUser);
    if (storedUser?.role === 'admin') {
      fetchUsers();

      const socket = getSocket();
      const refreshUsers = () => fetchUsers();
      socket.on('user:roleUpdated', refreshUsers);
      socket.on('user:deleted', refreshUsers);

      return () => {
        socket.off('user:roleUpdated', refreshUsers);
        socket.off('user:deleted', refreshUsers);
      };
    } else {
      setLoading(false);
    }
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const res = await api.get('/users');
      setUsers(res.data.data);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  };

  const updateRole = async (userId, role) => {
    try {
      const res = await api.put(`/users/${userId}/role`, { role });
      const updatedUser = res.data.data;
      setUsers((prev) => prev.map((u) => (u._id === userId ? { ...u, role: updatedUser.role } : u)));
      await fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Failed to update user role');
    }
  };

  const deleteUser = async (userId) => {
    if (!window.confirm('Delete this user account? This cannot be undone.')) return;
    try {
      await api.delete(`/users/${userId}`);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to delete user');
    }
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="max-w-4xl mx-auto py-12 px-6 text-center">
        <h1 className="text-2xl font-bold text-slate-800">Access Denied</h1>
        <p className="mt-4 text-slate-500">Only admins can manage users in the system.</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">User Management</h1>
        <p className="text-slate-500">Admins can promote, demote, and remove accounts from the system.</p>
      </div>

      {error && (
        <div className="p-4 rounded-2xl bg-rose-50 text-rose-700 border border-rose-200">
          {error}
        </div>
      )}

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Name</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Email</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Role</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {loading ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">Loading users...</td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan="4" className="px-6 py-8 text-center text-slate-500">No users found.</td>
                </tr>
              ) : (
                users.map((managedUser) => (
                  <tr key={managedUser._id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 font-medium text-slate-700">{managedUser.name}</td>
                    <td className="px-6 py-4 text-slate-500">{managedUser.email}</td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold ${managedUser.role === 'admin' ? 'bg-indigo-50 text-indigo-700 border border-indigo-100' : 'bg-slate-50 text-slate-700 border border-slate-200'}`}>
                        {managedUser.role}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right space-x-2">
                      <button
                        type="button"
                        onClick={() => updateRole(managedUser._id, managedUser.role === 'admin' ? 'user' : 'admin')}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 transition-colors"
                      >
                        {user.role === 'admin' ? <ShieldOff size={16} /> : <ShieldCheck size={16} />}
                        {user.role === 'admin' ? 'Demote' : 'Promote'}
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteUser(user._id)}
                        className="inline-flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold text-rose-700 bg-rose-50 hover:bg-rose-100 transition-colors"
                      >
                        <Trash2 size={16} />
                        Delete
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
