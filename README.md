# Debugging Frontend-Backend Communication

This document outlines the steps taken to debug and fix communication issues between a React + Vite frontend and a Spring Boot backend.

## Problem Description

The frontend, deployed on Vercel, and the backend were unable to communicate after recent refactors. This manifested as failed SockJS requests in the browser's Network tab and a lack of logs on the backend, indicating requests were not reaching it.

## Debugging and Fixes Implemented

### Frontend Tasks

1.  **Centralized Configuration (`src/config/env.js`):**
    A new file, `src/config/env.js`, was created to centralize API and WebSocket base URLs and an `IS_PRODUCTION` flag.

    ```javascript
    // src/config/env.js
    export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL;
    export const WS_BASE_URL = import.meta.env.VITE_WS_BASE_URL;
    export const IS_PRODUCTION = import.meta.env.PROD; // Vite's built-in production flag
    export const DEBUG_API = import.meta.env.DEV; // Vite's built-in development flag
    ```

2.  **Axios Configuration (`src/api/axios.js`):**
    -   Axios now uses `import.meta.env.VITE_API_BASE_URL` for its `baseURL`.
    -   Added debug logging for every Axios request and on Axios response errors.

3.  **WebSocket Configuration (`src/hooks/useWebSocket.js`):**
    -   SockJS now uses `import.meta.env.VITE_WS_BASE_URL`.
    -   Ensured SockJS URL uses `http://` or `https://` (not `ws://` or `wss://`).
    -   Added debug logging for WebSocket connection status (connecting, connected, error, closed).
    -   Implemented safeguards to ensure the app renders even if WebSocket fails and does not initialize WebSocket before config is loaded or block page rendering.

4.  **Hardcoded URL Removal:**
    All hardcoded URLs (localhost, 127.0.0.1, http://, https://, ws://, wss://) were replaced with references to `API_BASE_URL` or `WS_BASE_URL` from the central config.

5.  **Environment Variable Usage:**
    -   `VITE_API_BASE_URL` and `VITE_WS_BASE_URL` are now correctly used via `import.meta.env`.

### Backend Tasks (Spring Boot)

1.  **CORS Configuration (`SecurityConfig.java`):**
    -   CORS now allows local frontend (`http://localhost:5173`) and production frontend (`https://landing-page-test-two-git-main-huynhtanloc.vercel.app`).
    -   CORS allows credentials.
    -   CORS allows headers: `Authorization`, `Content-Type`, `Accept`, `X-Requested-With`, `Origin`.
    -   CORS allows methods: `GET`, `POST`, `PUT`, `DELETE`, `OPTIONS`.
    -   Added `https://*.vercel.app` and `http://localhost:*`, `http://127.0.0.1:*` to allowed origins for flexibility.

2.  **WebSocket Configuration (`WebSocketConfig.java`):**
    -   WebSocket endpoint `/ws` now allows frontend origins.
    -   Security permits SockJS handshake endpoints: `/ws/**`, `/ws/info/**`.
    -   Added WebSocket handshake logging to track origin and endpoint.

3.  **Security Configuration (`SecurityConfig.java`):**
    -   Updated `requestMatchers` to permit `/ws`, `/ws/**`, `/ws/info/**`, `/api/chat/**`, `/api/subscribe/**` for WebSocket and related endpoints.

4.  **Request Logging Filter (`RequestLoggingFilter.java`):**
    -   A new filter was implemented to log every incoming request, including method, URI, Origin header, Authorization header presence, and response status.

## Verification Steps

After these changes, when opening the frontend, you should observe the following:

1.  **Console Logs (Frontend):**
    -   On app startup: `[ENV] MODE`, `[ENV] API_BASE_URL`, `[ENV] WS_BASE_URL`.
    -   Before every Axios request: `[API REQUEST] method + full URL`.
    -   On Axios response error: `[API ERROR] status, url, message, response body if available`.
    -   Before WebSocket connects: `[WS CONNECTING] WS_BASE_URL`.
    -   On SockJS/STOMP connect success: `[WS CONNECTED]`.
    -   On SockJS/STOMP error or close: `[WS ERROR]` or `[WS CLOSED]` with details.

2.  **Backend Logs:**
    -   For every incoming request: `method`, `URI`, `Origin header`, `Authorization header exists or not`, `response status`.
    -   When a WebSocket handshake happens: `[WS HANDSHAKE] endpoint=...`, `origin=...`.

3.  **Browser Network Tab:**
    -   Observe successful API calls and WebSocket connections.
    -   If failures occur, the detailed logs (frontend console and backend server logs) will help pinpoint the exact cause (CORS, network, mixed content, security, or wrong URL).

## Environment Variable Configuration

### Local `.env` file (in `Front_end/frontend_test2/.env`)

```
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=http://localhost:8080/ws
```

### Vercel Environment Variables

Configure these variables in your Vercel project settings:

```
VITE_API_BASE_URL=https://YOUR_BACKEND_DOMAIN
VITE_WS_BASE_URL=https://YOUR_BACKEND_DOMAIN/ws
```
(Replace `YOUR_BACKEND_DOMAIN` with your actual backend domain, e.g., `api.example.com`)

### Backend CORS Origins

The backend CORS configuration in `SecurityConfig.java` now allows the following origins:

-   `http://localhost:5173`
-   `https://landing-page-test-two-git-main-huynhtanloc.vercel.app`
-   `https://*.vercel.app`
-   `http://localhost:*`
-   `http://127.0.0.1:*`
-   Any origins specified in the `FRONTEND_URL` environment variable (comma-separated).