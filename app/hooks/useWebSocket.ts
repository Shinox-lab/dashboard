'use client';

import { useEffect, useRef, useCallback, useState } from 'react';
import { WebSocketMessage, Message, Squad, Task } from '../types';

interface UseWebSocketOptions {
  url: string;
  onMessage?: (message: Message) => void;
  onSquadUpdate?: (squad: Squad) => void;
  onTaskUpdate?: (task: Task) => void;
  onConnectionChange?: (connected: boolean) => void;
  reconnectInterval?: number;
  maxReconnectAttempts?: number;
}

interface UseWebSocketReturn {
  isConnected: boolean;
  sendMessage: (content: string, squadId: string) => void;
  subscribeToSquad: (squadId: string) => void;
  unsubscribeFromSquad: (squadId: string) => void;
}

export function useWebSocket({
  url,
  onMessage,
  onSquadUpdate,
  onTaskUpdate,
  onConnectionChange,
  reconnectInterval = 3000,
  maxReconnectAttempts = 10,
}: UseWebSocketOptions): UseWebSocketReturn {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      return;
    }

    try {
      wsRef.current = new WebSocket(url);

      wsRef.current.onopen = () => {
        console.log('[WebSocket] Connected to', url);
        setIsConnected(true);
        onConnectionChange?.(true);
        reconnectAttemptsRef.current = 0;
      };

      wsRef.current.onclose = (event) => {
        console.log('[WebSocket] Disconnected:', event.code, event.reason);
        setIsConnected(false);
        onConnectionChange?.(false);

        // Attempt reconnection
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current++;
          console.log(
            `[WebSocket] Reconnecting in ${reconnectInterval}ms (attempt ${reconnectAttemptsRef.current}/${maxReconnectAttempts})`
          );
          reconnectTimeoutRef.current = setTimeout(connect, reconnectInterval);
        }
      };

      wsRef.current.onerror = (error) => {
        console.error('[WebSocket] Error:', error);
      };

      wsRef.current.onmessage = (event) => {
        try {
          const data: WebSocketMessage = JSON.parse(event.data);

          switch (data.type) {
            case 'MESSAGE':
              onMessage?.(data.payload as Message);
              break;
            case 'SQUAD_UPDATE':
              onSquadUpdate?.(data.payload as Squad);
              break;
            case 'TASK_UPDATE':
              onTaskUpdate?.(data.payload as Task);
              break;
            case 'GOVERNANCE_ALERT':
              console.log('[WebSocket] Governance alert:', data.payload);
              break;
            default:
              console.log('[WebSocket] Unknown message type:', data.type);
          }
        } catch (error) {
          console.error('[WebSocket] Failed to parse message:', error);
        }
      };
    } catch (error) {
      console.error('[WebSocket] Failed to connect:', error);
    }
  }, [url, onMessage, onSquadUpdate, onTaskUpdate, onConnectionChange, reconnectInterval, maxReconnectAttempts]);

  const disconnect = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  const sendMessage = useCallback((content: string, squadId: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot send message: not connected');
      return;
    }

    const payload = {
      type: 'HUMAN_MESSAGE',
      payload: {
        content,
        squadId,
        timestamp: new Date().toISOString(),
      },
    };

    wsRef.current.send(JSON.stringify(payload));
  }, []);

  const subscribeToSquad = useCallback((squadId: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      console.error('[WebSocket] Cannot subscribe: not connected');
      return;
    }

    const payload = {
      type: 'SUBSCRIBE',
      payload: { squadId },
    };

    wsRef.current.send(JSON.stringify(payload));
    console.log('[WebSocket] Subscribed to squad:', squadId);
  }, []);

  const unsubscribeFromSquad = useCallback((squadId: string) => {
    if (wsRef.current?.readyState !== WebSocket.OPEN) {
      return;
    }

    const payload = {
      type: 'UNSUBSCRIBE',
      payload: { squadId },
    };

    wsRef.current.send(JSON.stringify(payload));
    console.log('[WebSocket] Unsubscribed from squad:', squadId);
  }, []);

  useEffect(() => {
    connect();
    return () => disconnect();
  }, [connect, disconnect]);

  return {
    isConnected,
    sendMessage,
    subscribeToSquad,
    unsubscribeFromSquad,
  };
}
