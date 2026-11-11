// apps/frontend/src/hooks/useSSE.js
import { useEffect, useRef } from 'react';
import { API_BASE } from '../lib/api.js';

export function useSSE(token, onEvent) {
  const callbackRef = useRef(onEvent);
  callbackRef.current = onEvent;

  useEffect(() => {
    if (!token) return;

    let aborted = false;
    let retryTimeout = null;
    let retryDelay = 1000;
    const controller = new AbortController();

    async function connect() {
      if (aborted) return;

      try {
        const response = await fetch(`${API_BASE}/events`, {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: 'text/event-stream',
          },
          signal: controller.signal,
        });

        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let buffer = '';
        retryDelay = 1000;

        while (true) {
          const { done, value } = await reader.read();
          if (done || aborted) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              try {
                const event = JSON.parse(line.slice(6));
                callbackRef.current(event);
              } catch {
                // ignore malformed events
              }
            }
          }
        }
      } catch (err) {
        if (aborted) return;
        console.warn('SSE connection lost, reconnecting in', retryDelay, 'ms');
        retryTimeout = setTimeout(connect, retryDelay);
        retryDelay = Math.min(retryDelay * 2, 30000);
      }
    }

    connect();

    return () => {
      aborted = true;
      controller.abort();
      if (retryTimeout) clearTimeout(retryTimeout);
    };
  }, [token]);
}