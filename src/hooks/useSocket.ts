import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io();

export function useSocket(onDataUpdated?: (data: any) => void) {
  useEffect(() => {
    if (!onDataUpdated) return;

    const handleDataUpdated = (data: any) => {
      console.log('Real-time update received:', data);
      onDataUpdated(data);
    };

    socket.on('data_updated', handleDataUpdated);

    return () => {
      socket.off('data_updated', handleDataUpdated);
    };
  }, [onDataUpdated]);

  return socket;
}

