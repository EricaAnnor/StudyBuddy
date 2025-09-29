#  StudyBuddy

**StudyBuddy**  is a full-stack learning platform combining a FastAPI backend and a Next.js frontend. It enables students to collaborate through real-time messaging, user groups, friendships, and a rich social layer, all in a seamless and responsive interface.

---

##  Technical Overview

###  Authentication & RBAC
- JWT-based authentication for secure session management using access and refresh tokens.
- Role-Based Access Control (RBAC) governs permissions across user groups, friendships, and administrative actions.
- Passwords hashed securely with bcrypt.

###  Social Features
- Comprehensive friendship system: send, accept, reject, and remove requests.
- Group management with clear ownership, membership validation, and protected role-specific actions.

###  Real-Time Messaging
- WebSocket-based live chat system.
- Redis Pub/Sub enables multi-instance scalability, ensuring real-time delivery across distributed deployments.
- **Online presence tracking via periodic heartbeats** sent over WebSockets.
- Each client sends heartbeats at fixed intervals to signal activity.
- Users are marked "offline" automatically if no heartbeat is received within a timeout window.
- Redis handles temporary presence state for fast access across instances.

###  Asynchronous Task Processing
- Celery + RabbitMQ for background tasks like sending notifications or reminders.
- Redis used as a durable result backend.
- Built-in `NotificationLog` model guarantees reliable delivery and auditing of all async events.

###  File Uploads
- Users can upload files (e.g., avatars, documents) via FastAPI endpoints.
- Local disk storage is used to keep the platform cost-effective in early development.
- Easily extendable to cloud solutions like Amazon S3 or Google Cloud Storage.

###  Storage Architecture
- **PostgreSQL**: used for relational data (users, groups, friendships, etc.).
- **MongoDB**: stores flexible and high-volume chat messages with indexing support.
- Follows **polyglot persistence** principles for performance and flexibility.

###  Containerized DevOps
- Fully Dockerized setup with `docker-compose` for consistent local development and deployment.
- Includes services for FastAPI, PostgreSQL, MongoDB, Redis, and RabbitMQ.
- Health checks and service-level dependencies ensure clean startup and operation.

---

##  Functional Highlights
- Authentication, RBAC
- Friends & Groups
- Live chat
- File uploads
- Async notifications

##  Non-Functional Strengths
- Secure
- Scalable
- Modular
- Cost-conscious
- Real-time ready
