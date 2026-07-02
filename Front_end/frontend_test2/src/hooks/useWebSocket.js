import { useState, useEffect } from "react";

// Usually from env var, e.g., import.meta.env.VITE_API_BASE_URL
const WS_URL = import.meta.env.VITE_WS_BASE_URL || (window.location.protocol === "https:" ? "https://localhost:8080" : "http://localhost:8080");

export function useWebSocket({ enabled = true } = {}) {
  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled) return;

    let isUnmounted = false;
    let client;

    const connect = async () => {
      const [{ Client }, { default: SockJS }] = await Promise.all([
        import("@stomp/stompjs"),
        import("sockjs-client"),
      ]);

      if (isUnmounted) return;

      client = new Client({
        webSocketFactory: () => new SockJS(`${WS_URL}/ws`),
        onConnect: () => {
          if (isUnmounted) return;
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
    };

    const timer = window.setTimeout(connect, 1000);

    const disconnectBeforeUnload = () => {
      isUnmounted = true;
      if (client) {
        client.reconnectDelay = 0;
        client.deactivate({ force: true });
      }
    };

    window.addEventListener("beforeunload", disconnectBeforeUnload);
    window.addEventListener("pagehide", disconnectBeforeUnload);

    return () => {
      isUnmounted = true;
      window.clearTimeout(timer);
      window.removeEventListener("beforeunload", disconnectBeforeUnload);
      window.removeEventListener("pagehide", disconnectBeforeUnload);
      if (client) {
        client.reconnectDelay = 0;
        client.deactivate({ force: true });
      }
    };
  }, [enabled]);

  return { isConnected, messages, stompClient };
}
