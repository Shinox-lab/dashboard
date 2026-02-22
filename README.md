# Shinox Dashboard

A real-time monitoring dashboard for the **Decentralized Agentic Mesh** — observe, command, and govern AI agent squads as they work.

## Overview

Shinox Dashboard connects to an API Gateway that manages autonomous AI agent squads. It provides a live chat-style interface for watching agents think and act, a task panel for Human-in-the-Loop (HITL) approvals, and deep visibility into governance signals, RAG context, and Kafka event streams.

## Features

- **Squad Monitoring** — Browse all active squads, their goals, priorities (`LOW` → `CRITICAL`), and statuses (`ACTIVE`, `PAUSED`, `COMPLETED`, `FAILED`).
- **Live Agent Chat** — Watch agent messages (thoughts, tool calls, final answers) stream in real time via WebSocket.
- **Task Management** — View per-squad tasks and approve or reject HITL review requests without leaving the dashboard.
- **RAG Context Panel** — Inspect the knowledge-graph nodes and relationships the agents are reasoning over.
- **Governance Alerts** — Surface blocked or flagged agent actions for review.
- **Kafka Event Log** — Browse raw events from a squad's Kafka topic.
- **API & WebSocket Health Indicators** — Color-coded status badges in the header reflect live connectivity.
- **Customizable UI** — Settings modal lets you switch themes (light / dark / system), fonts, font sizes, message density, timestamps, animations, sounds, and auto-scroll behavior.

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | [Next.js 16](https://nextjs.org) (App Router) |
| UI | [React 19](https://react.dev) + [Tailwind CSS 4](https://tailwindcss.com) |
| Language | TypeScript 5 |
| Real-time | WebSocket (native browser API) |
| Markdown | [react-markdown](https://github.com/remarkjs/react-markdown) + remark-gfm + rehype-highlight |

## Prerequisites

- **Node.js** 18 or later
- **Yarn** (or npm / pnpm / bun)
- A running **Shinox API Gateway** (defaults to `http://localhost:8002`)

## Getting Started

1. **Install dependencies**

   ```bash
   yarn install
   ```

2. **Configure the API endpoint** (optional — defaults shown)

   Create a `.env.local` file in the project root:

   ```env
   NEXT_PUBLIC_API_URL=http://localhost:8002
   NEXT_PUBLIC_WS_URL=ws://localhost:8002/ws
   ```

3. **Start the development server**

   ```bash
   yarn dev
   ```

   Open [http://localhost:3000](http://localhost:3000) in your browser.

## Available Scripts

| Command | Description |
|---|---|
| `yarn dev` | Start development server with hot reload |
| `yarn build` | Create an optimized production build |
| `yarn start` | Serve the production build |
| `yarn lint` | Run ESLint across the project |

## Project Structure

```
app/
├── components/        # UI components (Header, SquadList, ChatArea, RightSidebar, …)
├── context/           # React context providers (SettingsContext, …)
├── hooks/             # Custom React hooks
├── lib/
│   └── api.ts         # Typed API + WebSocket client
├── types/
│   └── index.ts       # Shared TypeScript types (Squad, Agent, Message, Task, …)
├── globals.css        # Global Tailwind styles
├── layout.tsx         # Root layout with font & settings providers
└── page.tsx           # Main dashboard page
```

## API Integration

The dashboard talks to the API Gateway via a thin client in `app/lib/api.ts`:

| Module | Endpoints |
|---|---|
| `squadAPI` | `GET /api/squads`, `GET /api/squads/:id/messages`, `POST /api/governance/halt/:id` |
| `agentAPI` | `GET /api/agents` |
| `taskAPI` | `GET /api/squads/:id/tasks`, `POST /api/tasks/:id/approve` |
| `messageAPI` | `POST /api/squads/:id/messages` |
| `governanceAPI` | `GET /api/governance/alerts` |
| `eventsAPI` | `GET /api/events` |
| `ragAPI` | `GET /api/rag/context` |
| `hitlAPI` | `GET /api/hitl/pending` |
| `kafkaLogAPI` | `GET /api/squads/:id/kafka-log` |
| `healthAPI` | `GET /health` |

WebSocket messages follow the shape `{ type, payload }` with types `MESSAGE`, `SQUAD_UPDATE`, `TASK_UPDATE`, `SUBSCRIBED`, and `PONG`.

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `NEXT_PUBLIC_API_URL` | `http://localhost:8002` | Base URL of the API Gateway |
| `NEXT_PUBLIC_WS_URL` | `ws://localhost:8002/ws` | WebSocket endpoint |

