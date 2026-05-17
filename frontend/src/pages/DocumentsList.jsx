import React, { useState, useEffect, useCallback } from 'react';
import { Download, FileText, CheckCircle2, Clock, XCircle, Edit3, Trash2 } from 'lucide-react';
import api from '../services/api';
import { getSocket } from '../services/socket';

const StatusBadge = ({ status }) => {
  switch (status) {
    case 'completed':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200"><CheckCircle2 size={12}/> Replicated</span>;
    case 'pending':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200"><Clock size={12}/> Syncing</span>;
    case 'failed':
      return <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-rose-50 text-rose-700 border border-rose-200"><XCircle size={12}/> Failed</span>;
    default:
      return null;
  }
};

export default function DocumentsList() {
  const [documents, setDocuments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState(null);

  const fetchDocs = useCallback(async () => {
    try {
      const res = await api.get('/documents');
      setDocuments(res.data.data);
    } catch (err) {
      console.error('Failed to fetch documents', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      setUser(JSON.parse(localStorage.getItem('user') || 'null'));
    } catch (error) {
      setUser(null);
    }

    fetchDocs();

    const socket = getSocket();
    const userId = user?._id || user?.id;
    const getOwnerId = (doc) => (doc?.uploadedBy?._id ? doc.uploadedBy._id : doc?.uploadedBy);
    const handleCreated = (doc) => {
      if (!doc) return;
      const ownerId = getOwnerId(doc);
      if (user?.role === 'admin' || ownerId === userId || doc.visibility === 'shared') {
        setDocuments((prev) => [doc, ...prev.filter((item) => item._id !== doc._id)]);
      }
    };
    const handleDeleted = ({ id }) => {
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    };
    const handleUpdated = (updatedDoc) => {
      setDocuments((prev) => prev.map((doc) => doc._id === updatedDoc._id ? updatedDoc : doc));
    };

    socket.on('document:created', handleCreated);
    socket.on('document:deleted', handleDeleted);
    socket.on('document:updated', handleUpdated);

    return () => {
      socket.off('document:created', handleCreated);
      socket.off('document:deleted', handleDeleted);
      socket.off('document:updated', handleUpdated);
    };
  }, [fetchDocs, user]);

  const handleDownload = async (id, filename) => {
    try {
      const response = await api.get(`/documents/${id}/download`, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (err) {
      alert("Failed to download document");
    }
  };

  const handleRename = async (id, currentTitle) => {
    const newTitle = window.prompt('Enter a new title for this document', currentTitle);
    if (!newTitle || newTitle.trim() === '') return;
    try {
      await api.put(`/documents/${id}`, { title: newTitle.trim() });
      setDocuments((prev) => prev.map((doc) => doc._id === id ? { ...doc, title: newTitle.trim() } : doc));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to rename document');
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this document? This action cannot be undone.')) return;
    try {
      await api.delete(`/documents/${id}`);
      setDocuments((prev) => prev.filter((doc) => doc._id !== id));
    } catch (err) {
      alert(err.response?.data?.error || 'Failed to delete document');
    }
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex justify-between items-end mb-8">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Documents Repository</h1>
          <p className="text-slate-500 mt-1">Manage and access your distributed files.</p>
        </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500">
              <tr>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Document</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Primary Node</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Visibility</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Replication</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Size</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs">Date</th>
                <th className="px-6 py-4 font-semibold uppercase tracking-wider text-xs text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {documents.map((doc) => (
                <tr key={doc._id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-600">
                        <FileText size={20} />
                      </div>
                      <div>
                        <p className="font-bold text-slate-800">{doc.title}</p>
                        <p className="text-xs text-slate-500">{doc.originalName}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 font-medium text-slate-700">{doc.primaryNode}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold ${doc.visibility === 'shared' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 text-slate-700 border border-slate-200'}`}>
                      {doc.visibility}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <StatusBadge status={doc.replicationStatus} />
                  </td>
                  <td className="px-6 py-4 text-slate-500">{(doc.size / 1024 / 1024).toFixed(2)} MB</td>
                  <td className="px-6 py-4 text-slate-500">
                    {new Date(doc.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 text-right flex justify-end items-center gap-2">
                    <button 
                      onClick={() => handleDownload(doc._id, doc.originalName)}
                      className="p-2 text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 rounded-lg transition-colors inline-flex"
                    >
                      <Download size={18} />
                    </button>
                    {(user?.role === 'admin' || (doc.uploadedBy?._id ? doc.uploadedBy._id : doc.uploadedBy) === (user?._id || user?.id)) && (
                      <>
                        <button
                          onClick={() => handleRename(doc._id, doc.title)}
                          className="p-2 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors inline-flex"
                        >
                          <Edit3 size={18} />
                        </button>
                        <button
                          onClick={() => handleDelete(doc._id)}
                          className="p-2 text-rose-500 hover:text-white hover:bg-rose-500 rounded-lg transition-colors inline-flex"
                        >
                          <Trash2 size={18} />
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
