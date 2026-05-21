import { io } from 'socket.io-client';

const GATEWAY_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000';

let socket;

export const getSocket = () => {
  if (!socket) {
    socket = io(GATEWAY_URL, {
      transports: ['websocket'],
      autoConnect: true,
    });
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
