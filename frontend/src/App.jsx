import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import UploadCenter from './pages/UploadCenter';
import NodeMonitor from './pages/NodeMonitor';
import DocumentsList from './pages/DocumentsList';
import UserManagement from './pages/UserManagement';
import Login from './pages/Login';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="upload" element={<UploadCenter />} />
          <Route path="documents" element={<DocumentsList />} />
          <Route path="nodes" element={<NodeMonitor />} />
          <Route path="users" element={<UserManagement />} />
          <Route path="analytics" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="/login" element={<Login />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
