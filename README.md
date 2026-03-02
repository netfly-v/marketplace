# Marketplace

A fullstack mini marketplace application built with NestJS, Next.js 16, Prisma, and PostgreSQL.

## Tech Stack

### Backend
- **NestJS** — Node.js framework with modular architecture and dependency injection
- **Prisma** — Type-safe ORM for PostgreSQL
- **PostgreSQL 16** — Primary database
- **Redis 7** — Caching and pub/sub for real-time features
- **Stripe** — Payment processing

### Frontend
- **Next.js 16** — React framework with App Router and Turbopack
- **React 19** — UI library with React Compiler
- **Tailwind CSS** — Utility-first CSS framework
- **shadcn/ui** — Component library
- **Zustand** — State management
- **React Query** — Server state management
- **Axios** — HTTP client
- **React Hook Form + Yup** — Form handling and validation

## Prerequisites

- Node.js >= 20.9.0
- Docker and Docker Compose
- npm

## Getting Started

### 1. Start infrastructure

```bash
npm run docker:up
```

This starts PostgreSQL and Redis containers.

### 2. Install dependencies

```bash
cd backend && npm install
cd ../frontend && npm install
```

### 3. Set up environment

```bash
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env.local
```

### 4. Run database migrations

```bash
npm run db:migrate
```

### 5. Seed the database (optional)

```bash
npm run db:seed
```

### 6. Start development

```bash
npm run dev
```

- Backend runs on `http://localhost:4000`
- Frontend runs on `http://localhost:3000`

## Project Structure

```
├── backend/          # NestJS API server
├── frontend/         # Next.js 16 web application
├── docker-compose.yml
└── package.json      # Root scripts
```

## Available Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start both backend and frontend in dev mode |
| `npm run docker:up` | Start PostgreSQL and Redis containers |
| `npm run docker:down` | Stop containers |
| `npm run docker:reset` | Reset containers and volumes |
| `npm run db:migrate` | Run Prisma migrations |
| `npm run db:seed` | Seed database with sample data |
| `npm run db:studio` | Open Prisma Studio |
