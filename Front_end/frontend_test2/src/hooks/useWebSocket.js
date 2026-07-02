import { useState, useEffect } from "react";
import { Client } from "@stomp/stompjs";
import SockJS from "sockjs-client";

// Usually from env var, e.g., import.meta.env.VITE_API_BASE_URL
const WS_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";

export function useWebSocket() {
  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    let isUnmounted = false;

    const client = new Client({
      webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
      onConnect: () => {
        if (isUnmounted) return;
        console.log("Connected to STOMP WebSocket");
        setIsConnected(true);

        // Subscribe to the topic configured in backend
        client.subscribe("/topic/subscription", (message) => {
          if (message.body) {
            const data = JSON.parse(message.body);
            if (isUnmounted) return;
            setMessages((prev) => [...prev, data]);
          }
        });
      },
      onDisconnect: () => {
        if (isUnmounted) return;
        console.log("Disconnected from STOMP WebSocket");
        setIsConnected(false);
      },
      onStompError: (frame) => {
        console.error("Broker reported error: " + frame.headers["message"]);
        console.error("Additional details: " + frame.body);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.activate();
    setStompClient(client);

    const disconnectBeforeUnload = () => {
      isUnmounted = true;
      client.reconnectDelay = 0;
      client.deactivate({ force: true });
    };

    window.addEventListener("beforeunload", disconnectBeforeUnload);
    window.addEventListener("pagehide", disconnectBeforeUnload);

    return () => {
      isUnmounted = true;
      client.reconnectDelay = 0;
      window.removeEventListener("beforeunload", disconnectBeforeUnload);
      window.removeEventListener("pagehide", disconnectBeforeUnload);
      client.deactivate({ force: true });
    };
  }, []);

  return { isConnected, messages, stompClient };
}
