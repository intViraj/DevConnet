# DevConnect

A full-stack developer networking/matchmaking platform — "Tinder for developers." Built with the MERN stack, DevConnect lets developers create profiles, browse a feed of other devs, send/review connection requests, and build their network.

**Live:** [DevConnect.quest](https://DevConnect.quest) [currently instance is off]

---

## Features

- **Authentication** — Signup/Login/Logout with JWT (stored in HTTP-only cookies) and bcrypt password hashing
- **Profile Management** — Users can view and update their profile, with built-in checks that only allow safe, approved fields to be changed — blocking anyone from tampering with sensitive account data.
- **Connection Requests** — Send requests (`interested` / `ignored`) and review incoming ones (`accepted` / `rejected`)
- **Feed API** — Paginated feed that excludes already-connected/requested users using efficient Set-based filtering
- **Connections & Requests** — View accepted connections and pending incoming requests
- **Real-Time One-to-One Chat** — Instant private messaging between developers powered by Socket.IO and permanent MongoDB message persistence with chat history
- **Email Notifications** — Daily cron job (via `node-cron`) that emails users about new interested requests, powered by AWS SES
- **Security** — Password field exclusion (`select: false`), input validation with `validator`, schema-level enum validation, compound indexing on connection requests, and duplicate-request prevention

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React.js, Tailwind CSS, React Router DOM, Axios, Socket.IO Client, Lucide Icons, Vite |
| Runtime | Node.js, Express.js, Socket.IO |
| Database | MongoDB with Mongoose |
| Auth | JWT, bcrypt, cookie-parser |
| Validation | validator.js |
| Email | AWS SES (`@aws-sdk/client-ses`) |
| Scheduling | node-cron, date-fns |
| Deployment | AWS EC2, Nginx (reverse proxy), PM2, Cloudflare (SSL/CDN/DNS proxy), GoDaddy (domain) |

---

## 📁 Project Structure

```
DevConnect/
├── backend/ (DevConnect-backend)
│   ├── config/
│   │   └── database.js          # MongoDB connection
│   ├── middlewares/
│   │   └── auth.js               # JWT verification middleware
│   ├── model/
│   │   ├── user.js                # User schema + JWT instance method
│   │   ├── connectionRequest.js   # Connection request schema + pre-save hook
│   │   ├── conversation.js        # One-to-one conversation schema
│   │   └── message.js             # Chat message schema with conversationId ref
│   ├── routes/
│   │   ├── auth.js                # Signup / Login / Logout
│   │   ├── profile.js             # Profile view / edit / password update
│   │   ├── request.js             # Send / review connection requests
│   │   ├── user.js                # Feed, connections, received requests
│   │   └── chat.js                # Conversations & message history APIs
│   ├── utils/
│   │   ├── validation.js          # Signup & profile edit validators
│   │   ├── sendEmail.js           # SES email sender
│   │   ├── sesClient.js           # SES client config
│   │   ├── cronJobs.js            # Daily notification cron job
│   │   └── seed.js                # Database seed script with sample devs
│   ├── socket.js                  # Socket.IO configuration & JWT auth
│   ├── test-backend.js            # Core backend automated tests
│   ├── test-chat.js               # Real-time chat & socket automated test suite
│   ├── .env                       # Backend environment configuration
│   └── app.js                     # Express + Socket.IO HTTP server entry point
│
└── frontend/
    ├── src/
    │   ├── components/            # Reusable UI (Navbar, DeveloperCard, Footer, Spinner, etc.)
    │   ├── context/               # AuthContext & ToastContext providers
    │   ├── pages/                 # Feed, Requests, Connections, Chat, Profile, Auth, 404
    │   ├── services/
    │   │   ├── api.js             # Centralized Axios API client
    │   │   └── socket.js          # Centralized Socket.IO client manager
    │   ├── App.jsx                # Main application routes & layout
    │   └── main.jsx               # React entry point
    ├── index.html                 # HTML5 template
    ├── vite.config.js             # Vite configuration with proxy
    └── tailwind.config.js         # Tailwind styling system
```

---

## 📡 API Endpoints

### Auth
| Method | Endpoint | Description |
|---|---|---|
| POST | `/signup` | Register a new user |
| POST | `/Login` | Log in and receive JWT cookie |
| POST | `/Logout` | Clear auth cookie |

### Profile
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/profile/view` | Get logged-in user's profile | 
| PATCH | `/profile/edit` | Edit allowed profile fields | 

### Connection Requests
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/request/send/:status/:toUserId` | Send a request (`interested`/`ignored`) |
| POST | `/request/review/:status/:requestId` | Review a request (`accepted`/`rejected`) |

### User
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| GET | `/user/requests/received` | Get pending incoming requests |
| GET | `/user/connections` | Get all accepted connections | 
| GET | `/user/feed` | Paginated feed of discoverable users |

### Chat & Messaging
| Method | Endpoint | Description | Auth |
|---|---|---|---|
| POST | `/chat/conversation` | Create or retrieve a 1-to-1 conversation | ✓ |
| GET | `/chat/conversations` | Get all conversations of logged-in user | ✓ |
| GET | `/chat/messages/:conversationId` | Fetch message history for conversation | ✓ |

### Socket.IO Real-Time Events
| Event Name | Direction | Payload | Description |
|---|---|---|---|
| `join_conversation` | Client ➔ Server | `{ conversationId }` | Authenticated participant joins conversation room |
| `send_message` | Client ➔ Server | `{ conversationId, content }` | Sender posts a message to be saved and broadcast |
| `receive_message` | Server ➔ Client | `{ _id, conversationId, sender, content, createdAt }` | Real-time broadcast to room participants |
| `message_error` | Server ➔ Client | `{ message }` | Real-time validation / authorization error alert |

---

## ⚙️ Environment Variables

Create a `.env` file in the root directory:

```env
PORT=7777
DB_CONNECTION_SECRET=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret
AWS_REGION=your_aws_region
AWS_ACCESS_KEY=your_aws_access_key
AWS_SECRET=your_aws_secret_key
```

---

## 🚀 Getting Started

### 1. Prerequisites
- **Node.js**: v18+ (tested on v22)
- **MongoDB**: MongoDB Community Server running locally or MongoDB Atlas URI

### 2. Quick Start from Root

```bash
# 1. Install dependencies for both backend and frontend
npm run install:all

# 2. Seed database with realistic developer profiles
npm run seed

# 3. Run automated backend integration verification
npm run test:backend

# 4. Run automated real-time chat & Socket.IO test suite
npm run test:chat

# 5. Start Backend Server (runs on http://localhost:7777)
npm run start:backend

# 6. In a separate terminal, start Frontend Dev Server (runs on http://localhost:5173)
npm run start:frontend
```

### 3. Individual Service Startup

#### Backend
```bash
cd backend
npm install
npm start        # Starts on http://localhost:7777
```

#### Frontend
```bash
cd frontend
npm install
npm run dev      # Starts on http://localhost:5173
```

---

##  Deployment

Deployed on **AWS EC2 (Ubuntu)** with:
- **Nginx** as a reverse proxy
- **PM2** for process management and auto-restart on reboot
- **Elastic IP** for a stable public address
- **Custom domain** (`DevConnect.quest`) via GoDaddy
- **SSL/TLS** via  Cloudflare (SSL/CDN/DNS proxy)

---

##  Roadmap

-  OTP-based email verification 
-  Razorpay payment integration (premium membership)
-  Rate limiting & `mongo-sanitize` for NoSQL injection protection
-  live chat via websocket
