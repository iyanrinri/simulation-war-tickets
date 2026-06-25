# Simulation War Tickets

A high-performance ticket war (flash sale) simulation system that implements a **Slot Pool** architecture to handle massive traffic spikes efficiently. Rather than using conventional queuing which leaves inactive sessions dangling, this system strictly limits the maximum concurrent allocations at the Redis level, ensuring 100% capacity utilization.

## Key Features

- **Strict Slot Pool Engine**: Built on Redis with atomic Lua scripts for bulletproof concurrency.
- **True Real-time Dashboard**: Powered by WebSockets (Socket.io) to broadcast live load capacities directly to thousands of clients without HTTP polling overhead.
- **Premium Frontend Aesthetics**: Dark-mode glassmorphism interface built with Vue 3 and Tailwind CSS v4.
- **Automated Expiry**: Redis TTL gracefully handles abandoned checkout sessions.

## Tech Stack

- **Backend**: NestJS, Socket.io, ioredis
- **Frontend**: Vue 3, Vite, Tailwind CSS v4, Vue Router, Socket.io-client
- **Infrastructure**: Redis, Docker & Docker Compose

## Getting Started

### Prerequisites
- Docker and Docker Compose installed.

### Installation & Run

1. Configure your environment (optional, default ports are 8080 and 3000):
   ```bash
   cp .env.example .env
   # Modify ports in .env if needed
   ```

2. Start the entire system in the background:
   ```bash
   docker compose up -d --build
   ```

3. Access the interfaces via browser:
   - **User Simulation**: `http://localhost:8080/`
   - **Admin Control Panel**: `http://localhost:8080/admin`

*(Note: Replace 8080 with your `FRONTEND_PORT` if changed in `.env`)*

## Architecture Highlights

- **Atomic Allocation**: Redis `INCR` handles counter validation in zero time.
- **Hot-Reloading**: Docker volumes are mapped to allow seamless local development.
