import axios from 'axios';

// Create a configured Axios instance
const api = axios.create({
  baseURL: import.meta.env.VITE_GATEWAY_URL || 'http://localhost:5000/api',
});

// Interceptor to attach JWT token to every request
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
}, (error) => Promise.reject(error));

// Interceptor to handle 401 errors globally
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

/**
 * Upload a document with real-time progress tracking
 * @param {File} file - The physical file object
 * @param {Object} metadata - Title, description, etc.
 * @param {Function} onProgress - Callback function that receives (percentage)
 */
export const uploadDocument = async (file, metadata, onProgress) => {
  const formData = new FormData();
  formData.append('file', file);
  if (metadata.title) formData.append('title', metadata.title);
  if (metadata.description) formData.append('description', metadata.description);
  if (metadata.visibility) formData.append('visibility', metadata.visibility);

  const response = await api.post('/documents/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
    // The browser automatically tracks the progress of the upload stream 
    // being sent to the Gateway server
    onUploadProgress: (progressEvent) => {
      if (progressEvent.lengthComputable) {
        const percentCompleted = Math.round((progressEvent.loaded * 100) / progressEvent.total);
        if (onProgress) onProgress(percentCompleted);
      }
    }
  });

  return response.data;
};

export default api;
