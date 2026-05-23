# Real-Time Chat Application

Production-ready monorepo chat app with Next.js frontend, Express backend, MongoDB, and Socket.IO.

## Project Structure

```
chatting-app/
├── chatting-app-backend/     # Express + TypeScript API + Socket.IO
├── chatting-app-frontend/    # Next.js App Router + Tailwind
├── postman/                  # API collection for testing
└── package.json              # Monorepo scripts
```

## Tech Stack

| Layer    | Technology                          |
|----------|-------------------------------------|
| Frontend | Next.js 15, TypeScript, Tailwind    |
| Backend  | Express.js, TypeScript              |
| Database | MongoDB (Mongoose)                  |
| Cache    | Redis (optional — HTTP cache + Socket.IO adapter) |
| Realtime | Socket.IO (+ Redis adapter for multi-instance) |
| Media    | AWS S3                              |
| Auth     | JWT (Bearer token + httpOnly cookie)|

## Prerequisites

- Node.js 18+
- MongoDB running locally or MongoDB Atlas URI
- npm

## Quick Start

### 1. Install dependencies

```bash
npm run install:all
```

### 2. Configure environment

**Backend** — copy and edit `chatting-app-backend/.env`:

```bash
cp chatting-app-backend/.env.example chatting-app-backend/.env
```

| Variable       | Description                          | Example                              |
|----------------|--------------------------------------|--------------------------------------|
| PORT           | API server port                      | `5001`                               |
| MONGODB_URI    | MongoDB connection string            | `mongodb://localhost:27017/chatting-app` |
| JWT_SECRET     | Secret key (min 16 chars)            | `your-super-secret-jwt-key-change-in-production` |
| JWT_EXPIRES_IN | Token expiry                         | `7d`                                 |
| CLIENT_URL     | Comma-separated CORS origins         | `http://localhost:3000`              |
| UPLOAD_DIR     | Local folder for profile images      | `uploads`                            |
| REDIS_URL      | Redis connection (Upstash, etc.)     | `rediss://...`                       |
| REDIS_ENABLED  | Enable Redis cache + socket adapter  | `true`                               |
| SOCKET_REDIS_ADAPTER | Fan-out Socket.IO across replicas | `true` (requires Redis)        |
| MONGODB_MAX_POOL_SIZE | Mongo connections per replica   | `50`                                 |
| MONGODB_MIN_POOL_SIZE | Mongo pool minimum              | `5`                                  |

**Frontend** — copy and edit `chatting-app-frontend/.env.local`:

```bash
cp chatting-app-frontend/.env.example chatting-app-frontend/.env.local
```

| Variable               | Description        | Example                    |
|------------------------|--------------------|----------------------------|
| NEXT_PUBLIC_API_URL    | REST API base URL  | `http://localhost:5001/api`|
| NEXT_PUBLIC_SOCKET_URL | Socket.IO server   | `http://localhost:5001`    |
| NEXT_PUBLIC_UPLOADS_URL| Static uploads URL | `http://localhost:5001`    |

### 3. Start MongoDB

```bash
# Local MongoDB
mongod

# Or use Docker
docker run -d -p 27017:27017 --name mongo mongo:7
```

### 4. Run the application

```bash
# Run both frontend and backend
npm run dev

# Or separately
npm run dev:backend   # http://localhost:5001
npm run dev:frontend  # http://localhost:3000
```

## API Endpoints

### Auth (`/api/auth`)
| Method | Endpoint    | Auth | Description        |
|--------|-------------|------|--------------------|
| POST   | /register   | No   | Register user      |
| POST   | /login      | No   | Login user         |
| POST   | /logout     | No   | Clear auth cookie  |
| GET    | /me         | Yes  | Get current user   |

### Users (`/api/users`)
| Method | Endpoint  | Auth | Description              |
|--------|-----------|------|--------------------------|
| GET    | /profile  | Yes  | Get own profile          |
| PATCH  | /profile  | Yes  | Update name & avatar     |
| GET    | /         | Yes  | List users (search)      |
| GET    | /:id      | Yes  | Get user by ID           |

### Friend Requests (`/api/friend-requests`)
| Method | Endpoint       | Auth | Description           |
|--------|----------------|------|-----------------------|
| POST   | /              | Yes  | Send friend request   |
| GET    | /received      | Yes  | Pending received      |
| GET    | /sent          | Yes  | Pending sent          |
| GET    | /friends       | Yes  | List friends          |
| PATCH  | /:id/respond   | Yes  | Accept/reject request |

### Messages (`/api/messages`)
| Method | Endpoint   | Auth | Description              |
|--------|------------|------|--------------------------|
| POST   | /          | Yes  | Send message (REST)      |
| GET    | /:userId   | Yes  | Get conversation         |
| PATCH  | /read      | Yes  | Mark messages as read    |

### Chats (`/api/chats`)
| Method | Endpoint | Auth | Description                    |
|--------|----------|------|--------------------------------|
| GET    | /        | Yes  | Chat list with last message    |

## Socket.IO Events

Connect with JWT: `auth: { token: "<jwt>" }`

| Event            | Direction | Payload                              |
|------------------|-----------|--------------------------------------|
| send_message     | Client→Server | `{ receiverId, content }`        |
| receive_message  | Server→Client | Message object                     |
| message_read     | Client→Server | `{ senderId }`                     |
| messages_read    | Server→Client | `{ readerId, modifiedCount }`      |
| typing           | Both      | `{ receiverId, isTyping }` / `{ userId, isTyping }` |
| message_updated  | Server→Client | Message object                   |
| message_deleted  | Server→Client | Message object                   |

Socket events are rate-limited per connection (send, typing, read). Presence is stored in Redis when enabled (no global online/offline broadcast).

## Frontend Pages

| Route            | Description                    |
|------------------|--------------------------------|
| /login           | User login                     |
| /register        | User registration              |
| /dashboard       | Profile management             |
| /users           | Browse & add users             |
| /friends         | Friends & friend requests      |
| /chat            | Conversation list              |
| /chat/[userId]   | 1-to-1 real-time chat          |

## Architecture

### Backend (Clean Architecture)
```
router → controller → service → model
```
Each module includes Zod validation, error handling, and async wrappers.

### Frontend
- **AuthContext** — JWT auth state, login/logout
- **ChatContext** — Chat list, real-time updates
- **Socket.IO client** — Authenticated real-time messaging

## Testing with Postman

Import `postman/ChatApp.postman_collection.json`.

1. Run **Register** or **Login** — token is saved automatically
2. Use protected endpoints with Bearer auth
3. Test friend requests, messages, and chat list

## Production Notes

- Set strong `JWT_SECRET` and use HTTPS
- Use MongoDB Atlas for managed database
- Configure AWS S3 env vars for image/voice uploads (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `AWS_BUCKET_NAME`)
- Enable Redis in production: `REDIS_ENABLED=true`, `REDIS_URL=...`, `SOCKET_REDIS_ADAPTER=true`
- Set `NODE_ENV=production` for secure cookies
- Set `NEXT_PUBLIC_SOCKET_URL` and `NEXT_PUBLIC_API_URL` to your production API host
- Build: `npm run build`

## Scaling (up to ~10,000 concurrent users)

The app is designed for **horizontal scaling**: multiple backend replicas behind a load balancer, with Redis synchronizing Socket.IO rooms across instances.

### Capacity overview

| Setup | Approx. concurrent WebSocket users |
|-------|-----------------------------------|
| Single Node process (dev / one VM) | ~2,000–5,000 |
| 4–6 replicas + Redis adapter + Atlas + LB | ~10,000+ |

“Concurrent users” means active WebSocket connections at the same time, not total registered accounts.

### What the codebase provides

- **Socket.IO Redis adapter** — messages reach users on any replica (`SOCKET_REDIS_ADAPTER=true`)
- **Redis-backed presence** — avoids a MongoDB write on every connect when Redis is enabled
- **MongoDB connection pooling** — `MONGODB_MAX_POOL_SIZE` / `MONGODB_MIN_POOL_SIZE` per replica
- **HTTP rate limiting** — 300 req/min per IP on `/api`; stricter limits on `/api/auth`
- **Socket rate limiting** — caps on `send_message`, `typing`, and `message_read`
- **Client optimizations** — debounced prefetch, smaller message pages, websocket-only transport in production

### Recommended production topology

```
Browsers → CDN (Next.js) + Load Balancer (WebSocket upgrade)
              → API/Socket replicas (×4–6)
              → Redis (adapter + cache + presence)
              → MongoDB Atlas
              → S3 (+ CloudFront for media)
```

### Deployment checklist

1. Run **4–6 backend replicas** (PM2 cluster, Docker, or Kubernetes).
2. Put **nginx / ALB / Cloudflare** in front with WebSocket support (`Upgrade` headers).
3. Use **MongoDB Atlas** (M10+ recommended); keep `replicas × MONGODB_MAX_POOL_SIZE` under your cluster connection limit.
4. Use **managed Redis** (Upstash, ElastiCache) with `REDIS_ENABLED=true`.
5. Verify `/health` reports `"redis": "connected"`.
6. Test multi-instance delivery: two users on different replicas should still receive real-time messages.

### Example: PM2 on one host

```bash
cd chatting-app-backend
npm run build
pm2 start dist/index.js -i 4 --name chat-api
```

### Example: nginx WebSocket upstream

```nginx
upstream chat_backend {
  least_conn;
  server 10.0.1.10:5001;
  server 10.0.1.11:5001;
}

location /socket.io/ {
  proxy_pass http://chat_backend;
  proxy_http_version 1.1;
  proxy_set_header Upgrade $http_upgrade;
  proxy_set_header Connection "upgrade";
  proxy_read_timeout 86400;
}
```

### Further optimizations (optional)

- Lazy-load the chat list query only on `/chat` routes
- Paginate messages in the UI (backend supports `page` / `limit`)
- Serve uploads via CDN (`NEXT_PUBLIC_UPLOADS_URL`)
- Add Docker Compose / Kubernetes manifests for reproducible deploys

## Optional Features Included

- Online/offline status (Redis when enabled, MongoDB fallback)
- Typing indicator
- Message read receipts (✓ / ✓✓)
- Message pagination
- User search/filter
