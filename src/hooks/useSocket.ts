import { useEffect } from 'react';
import { io } from 'socket.io-client';

const socket = io();

export function useSocket(onDataUpdated?: (data: any) => void) {
  useEffect(() => {
    socket.on('data_updated', (data) => {
      console.log('Real-time update received:', data);
      if (onDataUpdated) {
        onDataUpdated(data);
      }
    });

    return () => {
      socket.off('data_updated');
    };
  }, [onDataUpdated]);

  return socket;
}
