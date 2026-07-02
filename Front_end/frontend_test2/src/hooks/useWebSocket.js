import { useState, useEffect } from "react";
import { WS_BASE_URL } from "../config/env";

export function useWebSocket({ enabled = true } = {}) {
  const [stompClient, setStompClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    if (!enabled || !WS_BASE_URL) {
      return;
    }

    let isUnmounted = false;
    let client;

    const connect = async () => {
      try {
        console.log("[WS CONNECTING]", WS_BASE_URL);

        const [{ Client }, { default: SockJS }] = await Promise.all([
          import("@stomp/stompjs"),
          import("sockjs-client"),
        ]);

        if (isUnmounted) return;

        client = new Client({
          webSocketFactory: () => new SockJS(WS_BASE_URL),
          onConnect: () => {
            if (isUnmounted) return;

            console.log("[WS CONNECTED]");
            setIsConnected(true);

            client.subscribe("/topic/subscription", (message) => {
              if (!message.body || isUnmounted) {
                return;
              }

              try {
                const data = JSON.parse(message.body);
                setMessages((prev) => [...prev, data]);
              } catch (parseError) {
                console.error("[WS ERROR]", {
                  message: "Failed to parse STOMP message body",
                  error: parseError,
                  rawBody: message.body,
                });
              }
            });
          },
          onDisconnect: () => {
            if (isUnmounted) return;

            console.warn("[WS CLOSED]", {
              reason: "STOMP client disconnected",
            });
            setIsConnected(false);
          },
          onStompError: (frame) => {
            console.error("[WS ERROR]", {
              type: "STOMP",
              message: frame.headers["message"],
              details: frame.body,
            });
            if (!isUnmounted) {
              setIsConnected(false);
            }
          },
          onWebSocketClose: (event) => {
            if (isUnmounted) return;

            console.warn("[WS CLOSED]", {
              code: event.code,
              reason: event.reason,
              wasClean: event.wasClean,
              url: WS_BASE_URL,
            });
            setIsConnected(false);
          },
          onWebSocketError: (event) => {
            console.error("[WS ERROR]", {
              type: "SOCKJS",
              url: WS_BASE_URL,
              event,
            });
            if (!isUnmounted) {
              setIsConnected(false);
            }
          },
          reconnectDelay: 5000,
          heartbeatIncoming: 4000,
          heartbeatOutgoing: 4000,
        });

        client.activate();
        setStompClient(client);
      } catch (error) {
        console.error("[WS ERROR]", {
          type: "INITIALIZATION",
          url: WS_BASE_URL,
          error,
        });
        if (!isUnmounted) {
          setIsConnected(false);
        }
      }
    };

    const timer = window.setTimeout(connect, 0);

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
