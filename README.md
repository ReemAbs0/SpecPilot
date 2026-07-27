# SpecPilot

Turn a plain-English software idea into a complete, structured software specification. SpecPilot
runs the idea through a sequence of AI agent stages (understand → requirements → user stories →
milestones → format) and streams live progress to the UI, then presents a structured document with
project summary, target users, roles, functional & non-functional requirements, user stories,
milestones, and technical considerations.

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (`frontend/`)
- **Backend**: Node.js + Express + TypeScript (`backend/`)
- **AI**: Fetch.ai / ASI:One hosted inference endpoint (OpenAI-compatible chat completions)

## Prerequisites

- Node.js 20 LTS or newer
- A Fetch.ai / ASI:One API key (for real generation)

## Setup

```sh
# Backend
cd backend
npm install
cp .env.example .env        # then edit .env and set FETCH_AI_API_KEY (see below)

# Frontend
cd ../frontend
npm install
```

### Environment variables

Backend configuration lives in `backend/.env` (git-ignored). Copy it from
`backend/.env.example` and set your real values — most importantly `FETCH_AI_API_KEY`.
Every variable is documented in `backend/.env.example` and in
[`specs/001-specpilot/quickstart.md`](specs/001-specpilot/quickstart.md).

> The backend reads `.env` only at startup. After editing it, restart the backend.

The frontend defaults to proxying `/api` to `http://localhost:4000`. To point it elsewhere,
set `VITE_API_BASE_URL` in `frontend/.env` (see `frontend/.env.example`).

## Running (development)

```sh
# Terminal 1 — backend (http://localhost:4000)
cd backend
npm run dev

# Terminal 2 — frontend (http://localhost:5173, proxies /api → backend)
cd frontend
npm run dev
```

Open http://localhost:5173.

## Scripts

Both projects expose the same scripts:

| Script | What it does |
|---|---|
| `npm run dev` | Start in watch mode |
| `npm run build` | Type-check and build |
| `npm run typecheck` | Type-check only |
| `npm run lint` | ESLint |
| `npm run format` / `npm run format:check` | Prettier write / check |
| `npm test` | Run the test suite (Vitest) |

The backend also has `npm start` to run the compiled server from `dist/`.

## Testing

```sh
cd backend && npm test     # unit, contract, and integration tests
cd frontend && npm test    # component and flow tests
```

## Validation

End-to-end run and validation steps for every user flow (generate, progress, result, download,
copy, generate-again, cancel, and the failure/timeout path) are in
[`specs/001-specpilot/quickstart.md`](specs/001-specpilot/quickstart.md).

## Project documentation

The full specification and design live under [`specs/001-specpilot/`](specs/001-specpilot/):
`spec.md` (requirements), `plan.md` (architecture), `data-model.md`, `contracts/api.md`,
`research.md`, and `quickstart.md`. Project principles are in
[`.specify/memory/constitution.md`](.specify/memory/constitution.md).
