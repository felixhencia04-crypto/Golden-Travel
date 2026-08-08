import { useEffect, useRef } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

function getSocket(): Socket | null {
  if (typeof window === 'undefined') return null;
  if (!socket) {
    socket = io({
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionDelay: 3000,
      reconnectionDelayMax: 10000,
      reconnectionAttempts: 10,
      timeout: 15000,
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

