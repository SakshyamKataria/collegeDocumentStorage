import React from 'react';
import { NavLink } from 'react-router-dom';
import { motion } from 'framer-motion';
import { 
  LayoutDashboard, 
  HardDrive, 
  UploadCloud, 
  Files, 
  Settings 
} from 'lucide-react';
import { cn } from '../../utils/cn';

const navItems = [
  { name: 'Dashboard', icon: LayoutDashboard, path: '/' },
  { name: 'Upload Center', icon: UploadCloud, path: '/upload' },
  { name: 'Documents', icon: Files, path: '/documents' },
];

const adminItems = [
  { name: 'Node Monitor', icon: HardDrive, path: '/nodes' },
  { name: 'User Management', icon: Settings, path: '/users' },
];

export default function Sidebar() {
  let user = null;
  try {
    user = JSON.parse(localStorage.getItem('user') || 'null');
  } catch (err) {
    user = null;
  }

  const items = [...navItems, ...(user && user.role === 'admin' ? adminItems : [])];

  return (
    <motion.aside 
      initial={{ x: -250 }}
      animate={{ x: 0 }}
      className="w-64 h-screen bg-slate-900 border-r border-slate-800 text-slate-300 flex flex-col"
    >
      <div className="h-16 flex items-center px-6 border-b border-slate-800">
        <div className="flex items-center gap-3 text-white font-bold text-lg tracking-tight">
          <div className="w-8 h-8 rounded-lg bg-indigo-500 flex items-center justify-center">
            <HardDrive size={18} className="text-white" />
          </div>
          DistriDoc
        </div>
      </div>

      <div className="flex-1 overflow-y-auto py-6 px-4 space-y-1 text-sm font-medium">
        <div className="px-2 mb-4 text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Main Menu
        </div>
        {items.map((item) => (
          <NavLink
            key={item.name}
            to={item.path}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200",
                isActive 
                  ? "bg-indigo-500/10 text-indigo-400" 
                  : "hover:bg-slate-800 hover:text-white"
              )
            }
          >
            {({ isActive }) => (
              <>
                <item.icon size={18} className={isActive ? "text-indigo-400" : "text-slate-400"} />
                {item.name}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="p-4 border-t border-slate-800">
        <button className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg hover:bg-slate-800 transition-colors text-sm font-medium">
          <Settings size={18} className="text-slate-400" />
          Settings
        </button>
      </div>
    </motion.aside>
  );
}
