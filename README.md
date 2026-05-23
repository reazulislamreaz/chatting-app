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
| Realtime | Socket.IO                           |
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
| CLIENT_URL     | Frontend origin for CORS             | `http://localhost:3000`              |
| UPLOAD_DIR     | Local folder for profile images      | `uploads`                            |

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
| user_online      | Broadcast | `{ userId }`                       |
| user_offline     | Broadcast | `{ userId, lastSeen }`             |

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
- Replace local uploads with Cloudinary (update `user.service` and multer config)
- Set `NODE_ENV=production` for secure cookies
- Build: `npm run build`

## Optional Features Included

- Online/offline status
- Typing indicator
- Message read receipts (✓ / ✓✓)
- Message pagination
- User search/filter
