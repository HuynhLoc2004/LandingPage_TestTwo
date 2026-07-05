# LandingPage TestTwo

LandingPage TestTwo is a full-stack smart commerce landing page. It combines a React/Vite frontend with a Spring Boot backend, PostgreSQL persistence, JWT authentication, email OTP subscription, SockJS/STOMP realtime updates, and a Gemini-powered AI assistant that can use backend data such as products, cart items, and favorites.

## Live Deployments

- Frontend: `https://landing-page-test-two-git-main-huynhtanloc.vercel.app`
- Backend: `https://landingpage-test2-deploy-backend.onrender.com`
- Health check: `https://landingpage-test2-deploy-backend.onrender.com/health`

## Tech Stack

Frontend:

- React 19
- Vite 8
- Tailwind CSS 4
- Framer Motion
- Lucide React
- Axios
- SockJS + STOMP

Backend:

- Java 21
- Spring Boot 3.2
- Spring Security + JWT
- Spring Data JPA
- PostgreSQL
- Liquibase
- Spring WebSocket
- Spring Mail and Resend HTTP email delivery
- Gemini API integration
- Docker

## Repository Structure

```txt
.
├── Front_end/
│   └── frontend_test2/
│       ├── src/
│       │   ├── LandingPage/
│       │   ├── api/
│       │   ├── components/
│       │   ├── hooks/
│       │   └── OrderDashboard/
│       ├── public/
│       ├── package.json
│       └── vite.config.js
├── back_end/
│   └── Back_end/
│       ├── src/main/java/com/example/back_end/
│       │   ├── config/
│       │   ├── controller/
│       │   ├── dto/
│       │   ├── entity/
│       │   ├── repository/
│       │   └── service/
│       ├── src/main/resources/application.yml
│       ├── Dockerfile
│       └── pom.xml
└── README.md
```

## Main Features

- English-only responsive commerce landing page.
- SEO metadata, canonical URL, Open Graph/Twitter metadata, `robots.txt`, `sitemap.xml`, and web manifest.
- Optimized hero area with image fallback and deferred video loading.
- Product display and interactive product configuration.
- JWT login, registration, refresh token, and logout flow.
- Authenticated cart and favorite products.
- Email event subscription with OTP verification, duplicate-email handling, unsubscribe flow, and fast cached UI rendering.
- SockJS/STOMP endpoint at `/ws` with subscription updates through `/topic/subscription`.
- AI chat box backed by `/api/chat`; the backend can enrich answers with database context.
- Public health endpoints for Render and uptime checks.
- Environment-driven configuration for deployment safety.

## Frontend

Path:

```txt
Front_end/frontend_test2
```

Important files:

- `src/LandingPage/LandingPage.jsx`: main landing page, auth modal, cart, favorites, product UI, chat box.
- `src/components/NewsletterSubscribe.jsx`: email OTP subscription UI.
- `src/components/OtpModal.jsx`: OTP verification dialog.
- `src/hooks/useWebSocket.js`: SockJS/STOMP client.
- `src/api/axios.js`: Axios instance with JWT and refresh-token retry.
- `index.html`: SEO and social metadata.
- `public/robots.txt`, `public/sitemap.xml`, `public/site.webmanifest`: crawler and PWA metadata.

### Frontend Environment

Create `Front_end/frontend_test2/.env` locally:

```env
VITE_API_BASE_URL=http://localhost:8080
VITE_WS_BASE_URL=http://localhost:8080
VITE_APP_URL=http://localhost:5173
```

Production values for Vercel:

```env
VITE_API_BASE_URL=https://landingpage-test2-deploy-backend.onrender.com
VITE_WS_BASE_URL=https://landingpage-test2-deploy-backend.onrender.com
VITE_APP_URL=https://landing-page-test-two-git-main-huynhtanloc.vercel.app
```

`VITE_WS_BASE_URL` can be the backend root URL or the full `/ws` URL. The frontend normalizes it automatically.

### Frontend Commands

```powershell
cd Front_end/frontend_test2
npm install
npm run dev
npm run lint
npm run build
npm run preview
```

## Backend

Path:

```txt
back_end/Back_end
```

Important files:

- `config/SecurityConfig.java`: CORS, public endpoints, JWT-secured endpoints.
- `config/WebSocketConfig.java`: SockJS/STOMP endpoint configuration.
- `config/JwtAuthenticationFilter.java`: JWT extraction and authentication.
- `config/RequestLoggingFilter.java`: deployment request logs.
- `controller/AuthController.java`: register, login, logout, refresh token.
- `controller/ProductController.java`: public product endpoints.
- `controller/CartController.java`: authenticated cart endpoints.
- `controller/FavoriteController.java`: authenticated favorite endpoints.
- `controller/SubscriptionController.java`: OTP request, verify, status, unsubscribe.
- `controller/ChatController.java`: Gemini chat endpoint.
- `service/EmailService.java`: Resend or SMTP email delivery.
- `service/GeminiChatService.java`: AI request handling and backend data context.
- `src/main/resources/application.yml`: Spring configuration through environment variables.

### Backend Environment

Create `back_end/Back_end/.env` locally. Do not commit real production secrets.

```env
SPRING_DATASOURCE_URL=jdbc:postgresql://...
SPRING_DATASOURCE_USERNAME=...
SPRING_DATASOURCE_PASSWORD=...

JWT_SECRET_KEY=...
JWT_ACCESS_TOKEN_EXPIRATION=1h
JWT_REFRESH_TOKEN_EXPIRATION=7d

FRONTEND_URL=http://localhost:5173

KEEP_ALIVE_ENABLED=false
KEEP_ALIVE_URL=https://landingpage-test2-deploy-backend.onrender.com/api/keep-alive
KEEP_ALIVE_FIXED_DELAY_MS=240000

MAIL_PROVIDER=resend
MAIL_FROM=onboarding@resend.dev
RESEND_API_KEY=...
RESEND_API_URL=https://api.resend.com/emails

MAIL_USERNAME=...
MAIL_PASSWORD=...
MAIL_HOST=smtp.gmail.com
MAIL_PORT=465
MAIL_SSL_ENABLE=true
MAIL_STARTTLS_ENABLE=false

GEMINI_API_KEY=...
GEMINI_MODEL=gemini-2.5-flash-lite
GEMINI_API_URL=https://generativelanguage.googleapis.com/v1beta

PORT=8080
```

Notes:

- For Render, set the same backend variables in the Render Environment tab.
- Do not wrap `SPRING_DATASOURCE_URL` in quotes on Render.
- `FRONTEND_URL` should be the deployed Vercel URL without a trailing slash.
- To reduce Render free-tier sleeping, set `KEEP_ALIVE_ENABLED=true` and point `KEEP_ALIVE_URL` to the deployed `/api/keep-alive` URL. `KEEP_ALIVE_FIXED_DELAY_MS=240000` pings every 4 minutes.
- `MAIL_PROVIDER=resend` avoids SMTP timeout issues on free hosting platforms that restrict SMTP connections.
- Rotate any API keys, database passwords, and JWT secrets that have ever been shared publicly.

### Backend Commands

```powershell
cd back_end/Back_end
.\mvnw.cmd spring-boot:run
.\mvnw.cmd -DskipTests package
```

If the Maven wrapper has trouble in a restricted shell, use an installed Maven binary with the same goals.

### Docker

```powershell
cd back_end/Back_end
docker build -t landingpage-testtwo-backend .
docker run -p 8080:8080 --env-file .env landingpage-testtwo-backend
```

## API Overview

Public endpoints:

- `GET /`
- `GET /health`
- `GET /api/health`
- `POST /auth/register`
- `POST /auth/login`
- `POST /auth/refresh-token`
- `GET /products`
- `GET /products/{id}`
- `POST /api/subscribe/request`
- `GET /ws/info`

Authenticated endpoints:

- `POST /auth/logout`
- `GET /cart`
- `POST /cart/add`
- `PUT /cart/items/{cartItemId}`
- `DELETE /cart/items/{cartItemId}`
- `GET /favorites`
- `POST /favorites/add?productId=...`
- `POST /favorites/remove?productId=...`
- `POST /api/subscribe/verify`
- `GET /api/subscribe/status`
- `DELETE /api/subscribe/unsubscribe`
- `POST /api/chat`

WebSocket:

- SockJS endpoint: `/ws`
- Broker topic: `/topic/subscription`
- Application destination prefix: `/app`

## Deployment

### Vercel Frontend

Recommended settings:

- Root directory: `Front_end/frontend_test2`
- Install command: `npm install`
- Build command: `npm run build`
- Output directory: `dist`

Required Vercel environment variables:

```env
VITE_API_BASE_URL=https://landingpage-test2-deploy-backend.onrender.com
VITE_WS_BASE_URL=https://landingpage-test2-deploy-backend.onrender.com
VITE_APP_URL=https://landing-page-test-two-git-main-huynhtanloc.vercel.app
```

If public visitors are asked to log in with Vercel or GitHub, disable Deployment Protection or Password Protection. Protected Sourcemaps do not need to be disabled for normal visitors.

### Render Backend

Recommended settings:

- Root directory: `back_end/Back_end`
- Dockerfile path: `Dockerfile`
- Docker build context: `back_end/Back_end`
- Health check path: `/health`

Required Render environment variables:

- Database variables: `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
- JWT variables: `JWT_SECRET_KEY`, `JWT_ACCESS_TOKEN_EXPIRATION`, `JWT_REFRESH_TOKEN_EXPIRATION`
- Frontend origin: `FRONTEND_URL`
- Email variables: `MAIL_PROVIDER`, `MAIL_FROM`, `RESEND_API_KEY`
- Gemini variables: `GEMINI_API_KEY`, `GEMINI_MODEL`, `GEMINI_API_URL`

Render provides `PORT`; the backend reads it through `${PORT:8080}`.

## Verification Checklist

Before pushing:

```powershell
cd Front_end/frontend_test2
npm run lint
npm run build
```

```powershell
cd back_end/Back_end
.\mvnw.cmd -DskipTests package
```

After deployment:

- Open the Vercel URL in an incognito window.
- Confirm the backend returns JSON at `/health`.
- Register and log in.
- Load products.
- Add/remove cart items.
- Add/remove favorite products.
- Request an email OTP.
- Verify the OTP and confirm subscription status.
- Unsubscribe and confirm the UI updates quickly.
- Open the chat box and ask about products, cart, or favorites.
- Check browser console for CORS, WebSocket, or network errors.

## Common Troubleshooting

`AxiosError: Network Error`

- Usually CORS, wrong API URL, backend sleeping, or HTTPS mismatch.
- Check `VITE_API_BASE_URL` on Vercel.
- Check `FRONTEND_URL` on Render.
- Confirm `/health` is live.

`SMTP_CONNECT_TIMEOUT`

- Free hosts may block SMTP.
- Use `MAIL_PROVIDER=resend` with `RESEND_API_KEY`.

`duplicate key value violates unique constraint notification_emails.email`

- The subscription flow now reuses an existing email for the same user and returns `409` if the email belongs to another account.

`Gemini request failed with status 429`

- Gemini quota/rate limit was reached.
- Wait for quota reset or switch `GEMINI_MODEL` to a lower-cost model.

`Gemini model was not found`

- Check `GEMINI_MODEL`.
- Current expected value: `gemini-2.5-flash-lite`.

`An insecure SockJS connection may not be initiated from a page loaded over HTTPS`

- Make sure `VITE_WS_BASE_URL` uses `https://` in production.

## Security Notes

- Never commit `.env` files with real secrets.
- Rotate keys that have been exposed in chats, screenshots, commits, or logs.
- Keep production secrets in Vercel and Render environment settings.
- JWT secret, database password, Resend key, Gemini key, and mail app passwords should be treated as sensitive credentials.
