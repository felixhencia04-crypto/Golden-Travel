import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    socket = io({
      transports: ['websocket'], // Disable polling to avoid Rate exceeded errors in preview
      reconnection: true,
      reconnectionDelay: 5000,
      reconnectionDelayMax: 15000,
      reconnectionAttempts: 5,
      timeout: 20000,
    });
  }
  return socket;
}

export function useSocket(onDataUpdated?: (data: any) => void) {
  const callbackRef = useRef(onDataUpdated);
  callbackRef.current = onDataUpdated;

  useEffect(() => {
    const s = getSocket();
    if (!s) return;

    const handleDataUpdated = (data: any) => {
      if (callbackRef.current) {
        callbackRef.current(data);
      }
    };

    s.on('data_updated', handleDataUpdated);

    return () => {
      s.off('data_updated', handleDataUpdated);
    };
  }, []);

  return getSocket();
}

