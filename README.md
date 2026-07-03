# LandingPage TestTwo

LandingPage TestTwo is a full-stack smart commerce landing page. The frontend is a React + Vite experience with a responsive video hero, product configurator, cart, favorites, OTP email subscription, WebSocket updates, SEO metadata, and an AI chat box. The backend is a Spring Boot API with JWT authentication, PostgreSQL persistence, SockJS/STOMP WebSocket support, Resend/Gmail email delivery, and a Gemini-powered chat service that can read product, cart, and favorite data through backend tool queries.

## Live URLs

- Frontend: `https://landing-page-test-two-git-main-huynhtanloc.vercel.app`
- Backend: `https://landingpage-test2-deploy-backend.onrender.com`
- Backend health check: `https://landingpage-test2-deploy-backend.onrender.com/health`

## Project Structure

```txt
.
├── Front_end/
│   └── frontend_test2/        # React + Vite frontend
├── back_end/
│   └── Back_end/              # Spring Boot backend
└── README.md
```

## Main Features

- Responsive landing page with SEO metadata, `robots.txt`, `sitemap.xml`, and web manifest.
- Video banner hero with lightweight image fallback and delayed video loading for better mobile performance.
- JWT login, registration, refresh token handling, and logout.
- Product listing, product details, cart, and favorite products.
- Email subscription with OTP verification and unsubscribe flow.
- WebSocket subscription updates through `/ws` and `/topic/subscription`.
- AI chat endpoint at `/api/chat`; the backend queries DB tools for products, cart, and favorites, then sends context to Gemini.
- Local fallback answer for chat when Gemini quota/model/key/network fails, so the chat UI does not crash with a raw `502`.
- Public health endpoints at `/`, `/health`, and `/api/health`.

## Frontend

Path:

```txt
Front_end/frontend_test2
```

Important files:

- `src/LandingPage/LandingPage.jsx`: main user experience, product UI, cart, favorites, chat box, hero banner.
- `src/api/axios.js`: API client with JWT Authorization header and refresh-token retry.
- `src/hooks/useWebSocket.js`: SockJS/STOMP client using `VITE_WS_BASE_URL`.
- `src/components/NewsletterSubscribe.jsx`: OTP email subscription UI.
- `public/robots.txt`, `public/sitemap.xml`, `public/site.webmanifest`: SEO/support files.

### Frontend Environment Variables

Create `Front_end/frontend_test2/.env` for local development:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=http://localhost:8080
VITE_APP_URL=http://localhost:5173
```

For Vercel production:

```env
VITE_API_BASE_URL=https://landingpage-test2-deploy-backend.onrender.com
VITE_WS_BASE_URL=https://landingpage-test2-deploy-backend.onrender.com
VITE_APP_URL=https://landing-page-test-two-git-main-huynhtanloc.vercel.app
```

`VITE_WS_BASE_URL` can be either the backend root URL or the full `/ws` URL. The frontend normalizes it automatically.

### Frontend Commands

```powershell
cd Front_end/frontend_test2
npm install
npm run dev
npm run build
npm run preview
```

## Backend

Path:

```txt
back_end/Back_end
```

Important files:

- `src/main/java/com/example/back_end/config/SecurityConfig.java`: CORS, public routes, JWT-secured routes.
- `src/main/java/com/example/back_end/config/WebSocketConfig.java`: SockJS/STOMP endpoint.
- `src/main/java/com/example/back_end/config/RequestLoggingFilter.java`: request logs for deployment debugging.
- `src/main/java/com/example/back_end/controller/ChatController.java`: `POST /api/chat`.
- `src/main/java/com/example/back_end/service/GeminiChatService.java`: Gemini call plus DB tool results and fallback answer.
- `src/main/java/com/example/back_end/service/EmailService.java`: SMTP or Resend email delivery.
- `src/main/resources/application.yml`: Spring configuration through environment variables.

### Backend Environment Variables

Create `back_end/Back_end/.env` locally. Do not commit real secrets.

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...

JWT_SECRET_KEY=...
JWT_ACCESS_TOKEN_EXPIRATION=1h
JWT_REFRESH_TOKEN_EXPIRATION=7d

FRONTEND_URL=http://localhost:5173

MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_PROVIDER=resend
MAIL_FROM=onboarding@resend.dev
RESEND_API_KEY=...
RESEND_API_URL=https://api.resend.com/emails

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta

PORT=8080
```

For Render production, set the same variables in the Render Environment tab. `PORT` is optional on Render because the app reads `${PORT:8080}`.

### Backend Commands

```powershell
cd back_end/Back_end
.\mvnw.cmd spring-boot:run
.\mvnw.cmd -DskipTests package
```

### Docker Build

The backend includes a Dockerfile:

```powershell
cd back_end/Back_end
docker build -t landingpage-testtwo-backend .
docker run -p 8080:8080 --env-file .env landingpage-testtwo-backend
```

## API Overview

Public endpoints:

- `GET /`, `GET /health`, `GET /api/health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `GET /products`
- `POST /api/chat`
- `POST /api/subscribe/request`
- `POST /api/subscribe/verify`
- `GET /api/subscribe/status`
- `DELETE /api/subscribe/unsubscribe`
- `GET /ws/info`, `/ws/**`

Authenticated endpoints:

- `GET /favorites`
- `POST /favorites/add?productId=...`
- `POST /favorites/remove?productId=...`
- `GET /cart`
- `POST /cart/add`
- `PUT /cart/items/{cartItemId}`
- `DELETE /cart/items/{cartItemId}`
- `POST /auth/logout`

## Deployment Notes

### Vercel Frontend

- Root directory: `Front_end/frontend_test2`
- Build command: `npm run build`
- Output directory: `dist`
- Add the frontend environment variables listed above.
- If visitors are asked to log in to Vercel/GitHub, disable Vercel Deployment Protection or Password Protection. `Protected Sourcemaps` can stay enabled.

### Render Backend

- Root directory: `back_end/Back_end`
- Dockerfile path: `Dockerfile`
- Build context: `back_end/Back_end`
- Add all backend environment variables in Render.
- Health URL after deploy: `/health`

## Verification Checklist

Run these before submitting:

```powershell
cd Front_end/frontend_test2
npm run build
```

```powershell
cd back_end/Back_end
.\mvnw.cmd -DskipTests package
```

Check after deploy:

- Frontend opens in an incognito window without Vercel login.
- Backend health returns JSON at `/health`.
- Login/register works.
- Products load.
- Cart and favorites work after login.
- Email OTP sends through Resend.
- WebSocket `/ws/info` returns `200`.
- Chat box answers; if Gemini is unavailable, fallback still summarizes backend data.

## Current Production Domains

```txt
Frontend:
https://landing-page-test-two-git-main-huynhtanloc.vercel.app

Backend:
https://landingpage-test2-deploy-backend.onrender.com
```
