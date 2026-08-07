import { api } from '../lib/api';

export interface MitraStatusResponse {
  status: string; // 'pending_verification' | 'active' | 'incomplete_profile' | 'rejected'
  statusAkun: string;
  userId: string;
  email?: string;
  hasProfile: boolean;
  reviewNotes?: string;
  updatedAt?: string;
}

/**
  * Service for Mitra Status API fetching & Real-Time Server-Sent Events (SSE)
  */
export const mitraRealtimeService = {
  /**
   * Initial Load API Fetching
   * Always fetches current DB status directly from /api/mitra/status
   */
  async fetchMitraStatus(): Promise<MitraStatusResponse> {
    return await api.get('/mitra/status');
  },

  /**
   * Real-time WebSocket/SSE Event Listener
   * Listens for VERIFICATION_APPROVED events targeted at user_id
   */
  subscribeToVerificationEvents(
    onStatusChange: (eventData: { status: string; notes?: string }) => void
  ): () => void {
    return this.subscribeToRealtimeEvents((event, data) => {
      if (event === 'VERIFICATION_APPROVED') {
        const status = data.status || data.statusAkun || 'active';
        onStatusChange({ status, notes: data.notes });
      }
    });
  },

  /**
   * General Real-time Event Listener for SSE Events
   * Listens for VERIFICATION_APPROVED, data_updated, PACKAGE_MUTATED, SCHEDULE_MUTATED
   */
  subscribeToRealtimeEvents(
    onEvent: (eventName: string, data: any) => void
  ): () => void {
    let eventSource: EventSource | null = null;
    try {
      const token = localStorage.getItem('mitra_token') || localStorage.getItem('token');
      if (token) {
        eventSource = new EventSource(`/api/mitra/live-stream?token=${encodeURIComponent(token)}`);

        const handleEvent = (eventName: string) => (e: MessageEvent) => {
          try {
            const data = e.data ? JSON.parse(e.data) : {};
            onEvent(eventName, data);
          } catch (err) {
            console.error(`[RealtimeService] Error parsing event ${eventName}:`, err);
            onEvent(eventName, {});
          }
        };

        eventSource.addEventListener('VERIFICATION_APPROVED', handleEvent('VERIFICATION_APPROVED'));
        eventSource.addEventListener('data_updated', handleEvent('data_updated'));
        eventSource.addEventListener('PACKAGE_MUTATED', handleEvent('PACKAGE_MUTATED'));
        eventSource.addEventListener('SCHEDULE_MUTATED', handleEvent('SCHEDULE_MUTATED'));

        eventSource.onmessage = (e: MessageEvent) => {
          try {
            const data = e.data ? JSON.parse(e.data) : {};
            onEvent('message', data);
          } catch (err) {
            onEvent('message', {});
          }
        };

        eventSource.onerror = (err) => {
          console.warn('[RealtimeService] SSE connection closed/reconnecting...', err);
        };
      }
    } catch (err) {
      console.warn('[RealtimeService] SSE initialization skipped:', err);
    }

    return () => {
      if (eventSource) {
        eventSource.close();
      }
    };
  }
};
