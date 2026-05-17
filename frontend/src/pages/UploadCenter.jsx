import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { UploadCloud, File, CheckCircle2, X } from 'lucide-react';
import api, { uploadDocument } from '../services/api';
import { cn } from '../utils/cn';

export default function UploadCenter() {
  const [dragActive, setDragActive] = useState(false);
  const [file, setFile] = useState(null);
  const [progress, setProgress] = useState(0);
  const [status, setStatus] = useState('idle'); // idle, uploading, success, error
  const [metadata, setMetadata] = useState({ title: '', description: '', visibility: 'private' });

  const handleDrag = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") setDragActive(true);
    else if (e.type === "dragleave") setDragActive(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = async () => {
    if (!file) return;
    setStatus('uploading');
    setProgress(0);

    try {
      await uploadDocument(file, metadata, (percent) => {
        setProgress(percent);
      });
      setStatus('success');
    } catch (err) {
      console.error(err);
      setStatus('error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-800 tracking-tight">Upload Center</h1>
        <p className="text-slate-500 mt-1">Upload documents to the distributed network securely.</p>
      </div>

      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8">
          
          <div className="space-y-4 mb-8">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Document Title</label>
              <input 
                type="text" 
                value={metadata.title}
                onChange={e => setMetadata({...metadata, title: e.target.value})}
                placeholder="E.g., Distributed Systems Assignment 1"
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Visibility</label>
              <select
                value={metadata.visibility}
                onChange={e => setMetadata({...metadata, visibility: e.target.value})}
                className="w-full px-4 py-2 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 outline-none transition-all"
              >
                <option value="private">Private (only you and admins)</option>
                <option value="shared">Shared (all logged-in users)</option>
              </select>
            </div>
          </div>

          <div 
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            className={cn(
              "border-2 border-dashed rounded-2xl p-12 text-center transition-all duration-200",
              dragActive ? "border-indigo-500 bg-indigo-50" : "border-slate-300 hover:border-indigo-400 bg-slate-50/50",
              file && "border-emerald-500 bg-emerald-50"
            )}
          >
            {file ? (
              <motion.div initial={{ scale: 0.9 }} animate={{ scale: 1 }} className="flex flex-col items-center">
                <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mb-4">
                  <File size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">{file.name}</h3>
                <p className="text-sm text-slate-500 mt-1">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <button 
                  onClick={() => { setFile(null); setStatus('idle'); }}
                  className="mt-4 text-sm text-rose-500 font-medium hover:text-rose-600 flex items-center"
                >
                  <X size={16} className="mr-1" /> Remove File
                </button>
              </motion.div>
            ) : (
              <div className="flex flex-col items-center pointer-events-none">
                <div className="w-16 h-16 bg-indigo-100 text-indigo-600 rounded-full flex items-center justify-center mb-4">
                  <UploadCloud size={32} />
                </div>
                <h3 className="text-lg font-bold text-slate-800">Drag & Drop your file here</h3>
                <p className="text-sm text-slate-500 mt-1">or click to browse from your computer</p>
                <input 
                  type="file" 
                  className="hidden" 
                  id="file-upload" 
                  onChange={(e) => e.target.files && setFile(e.target.files[0])}
                />
                <label 
                  htmlFor="file-upload" 
                  className="mt-6 px-6 py-2 bg-white border border-slate-200 text-slate-700 rounded-full font-medium hover:bg-slate-50 cursor-pointer pointer-events-auto transition-colors shadow-sm"
                >
                  Browse Files
                </label>
              </div>
            )}
          </div>

          {status === 'uploading' && (
            <div className="mt-8">
              <div className="flex justify-between text-sm font-medium mb-2">
                <span className="text-slate-700">Uploading to Gateway...</span>
                <span className="text-indigo-600">{progress}%</span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-indigo-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  transition={{ duration: 0.1 }}
                />
              </div>
            </div>
          )}

          {status === 'success' && (
            <motion.div 
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              className="mt-8 p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center text-emerald-800"
            >
              <CheckCircle2 className="text-emerald-500 mr-3" />
              <div>
                <p className="font-bold">Upload Successful</p>
                <p className="text-sm text-emerald-600/80">File is being replicated across nodes.</p>
              </div>
            </motion.div>
          )}

          <div className="mt-8 flex justify-end">
            <button 
              onClick={handleUpload}
              disabled={!file || status === 'uploading' || status === 'success'}
              className="px-8 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 focus:ring-4 focus:ring-indigo-500/20 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            >
              Start Upload
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}
