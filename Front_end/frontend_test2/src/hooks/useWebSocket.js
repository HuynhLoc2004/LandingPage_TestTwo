import { useState, useEffect, useCallback } from 'react';
import { Client } from '@stomp/stompjs';
import SockJS from 'sockjs-client';

// Usually from env var, e.g., import.meta.env.VITE_API_BASE_URL
const WS_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';

export function useWebSocket() {
  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      onConnect: () => {
        console.log('Connected to STOMP WebSocket');
        setIsConnected(true);
        
        // Subscribe to the topic configured in backend
        client.subscribe('/topic/subscription', (message) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            setMessages((prev) => [...prev, data]);
          }
        });
      },
      onDisconnect: () => {
        console.log('Disconnected from STOMP WebSocket');
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error('Broker reported error: ' + frame.headers['message']);
        console.error('Additional details: ' + frame.body);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.activate();
    setStompClient(client);

    return () => {
      client.deactivate();
    };
  }, []);

  return { isConnected, messages, stompClient };
}
