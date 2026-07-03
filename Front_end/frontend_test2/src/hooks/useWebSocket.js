import { useState, useEffect, useRef } from "react";
import SockJS from "sockjs-client";
import { Client } from "@stomp/stompjs";

const WS_ENDPOINT = "/ws";

const trimTrailingSlash = (value) => value.replace(/\/+$/, "");

const buildSockJsUrl = () => {
  const apiBaseUrl = import.meta.env.VITE_API_BASE_URL || "http://localhost:8080";
  const wsBaseUrl = import.meta.env.VITE_WS_BASE_URL || apiBaseUrl;
  const rawUrl = trimTrailingSlash(wsBaseUrl);
  const urlWithEndpoint = rawUrl.endsWith(WS_ENDPOINT) ? rawUrl : `${rawUrl}${WS_ENDPOINT}`;

  try {
    const url = new URL(urlWithEndpoint);
    if (window.location.protocol === "https:" && url.protocol === "http:") {
      url.protocol = "https:";
    }
    return trimTrailingSlash(url.toString());
  } catch {
    return urlWithEndpoint;
  }
};

export function useWebSocket() {
  const stompClientRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = new SockJS(buildSockJsUrl());
    const client = new Client({
      webSocketFactory: () => socket,
      onConnect: () => {
        setIsConnected(true);
        client.subscribe("/topic/subscription", (message) => {
          setMessages((prev) => [...prev, JSON.parse(message.body)]);
        });
      },
      onDisconnect: () => {
        setIsConnected(false);
      },
      reconnectDelay: 5000,
      heartbeatIncoming: 4000,
      heartbeatOutgoing: 4000,
    });

    client.activate();
    stompClientRef.current = client;

    return () => {
      stompClientRef.current = null;
      client.deactivate();
    };
  }, []);

  return { isConnected, messages };
}
