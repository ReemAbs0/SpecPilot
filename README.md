# SpecPilot

Turn a plain-English software idea into a complete, structured software specification. SpecPilot
runs the idea through a sequence of AI agent stages (understand → requirements → user stories →
milestones → format) and streams live progress to the UI, then presents a structured document with
project summary, target users, roles, functional & non-functional requirements, user stories,
milestones, and technical considerations.

Optionally, users can **create an account and sign in**. When signed in, every generated
specification is automatically **saved to their account**, and they can browse and reopen their
previously generated specifications. Generation itself stays open to everyone — signing in only
adds persistence.

## Tech stack

- **Frontend**: React 18 + TypeScript + Vite + Tailwind CSS (`frontend/`)
- **Backend**: Node.js + Express + TypeScript (`backend/`)
- **AI**: Fetch.ai / ASI:One hosted inference endpoint (OpenAI-compatible chat completions)
- **Auth & storage**: Firebase Authentication (Email/Password) + Cloud Firestore. The frontend
  uses Firebase only for authentication; all Firestore access goes through the backend via the
  Firebase Admin SDK (see [Firebase setup](#firebase-authentication--saved-specifications) below).

## Prerequisites

- Node.js 20 LTS or newer
- A Fetch.ai / ASI:One API key (for real generation)
- A Firebase project (only if you want authentication + saved specifications; generation works
  without it) — see [Firebase setup](#firebase-authentication--saved-specifications)

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
set `VITE_API_BASE_URL` in `frontend/.env` (see `frontend/.env.example`). The frontend also
reads `VITE_FIREBASE_*` values for authentication — see
[Firebase setup](#firebase-authentication--saved-specifications).

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

## Firebase (authentication & saved specifications)

Authentication and saved specifications are **optional**. Without any Firebase configuration the
app still generates specifications for everyone (anonymously); the backend simply returns
`auth_unavailable` for the `/api/me/*` persistence endpoints, and the UI's sign-in features are
inert. To enable accounts + saved specifications, set up a Firebase project:

### 1. Create the project & enable services

1. In the [Firebase console](https://console.firebase.google.com), create a project (this app was
   developed against project id `specpilot-ad3ba` — use your own).
2. **Authentication → Sign-in method → enable Email/Password.**
3. **Firestore Database → create a database** (production mode is fine — the rules below lock out
   direct client access).

### 2. Frontend — Web app config

Register a **Web app** in Project settings and copy its config into `frontend/.env`
(see `frontend/.env.example`). These values are public by design for a web client:

```
VITE_FIREBASE_API_KEY=...
VITE_FIREBASE_AUTH_DOMAIN=your-project-id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your-project-id
VITE_FIREBASE_APP_ID=...
```

The frontend uses Firebase **for authentication only** — it never talks to Firestore directly.

### 3. Backend — service account

Generate a service account key (**Project settings → Service accounts → Generate new private
key**) and save it as `backend/firebase-service-account.json` (git-ignored). Then in `backend/.env`
(see `backend/.env.example`):

```
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_SERVICE_ACCOUNT_PATH=./firebase-service-account.json
```

Alternatively, set `FIREBASE_SERVICE_ACCOUNT` to the service-account JSON inlined as a string
(handy for hosted deployments). The backend verifies each request's Firebase ID token and performs
all Firestore reads/writes with the Admin SDK. On startup it logs whether Firebase Admin
initialized (`[firebase-admin] initialized for project "…"`), so misconfiguration is visible
immediately.

> Both the service-account path and `backend/.env` are resolved relative to the backend directory,
> so the backend can be started from any working directory.

### 4. Deploy Firestore Security Rules

Because all persistence goes through the Admin SDK (which bypasses Security Rules), the rules in
[`firestore.rules`](firestore.rules) **deny all direct client access** — the backend's ID-token
verification is the sole authorization boundary. Deploy them with the
[Firebase CLI](https://firebase.google.com/docs/cli):

```sh
firebase deploy --only firestore:rules
```

The project is pinned in [`.firebaserc`](.firebaserc); update it to your own project id.

### How it works

- **Data model**: saved specifications live at `users/{uid}/specifications/{id}` — each user's
  records are naturally isolated by their auth uid.
- **Save**: when a signed-in user's generation succeeds, the specification is saved to their
  account automatically (best-effort — a save failure never interrupts the result view).
- **Browse / reopen**: **My Specifications** (`/library`) lists a user's saved specifications
  newest-first; opening one (`/library/:id`) renders it with the same view as a fresh result.
- Auth-only routes (`/library`, `/library/:id`) are guarded and redirect to `/login` when signed
  out.

## Deployment

Production runs the **frontend on Vercel** and the **backend on Render** (a long-running Node
web service — not serverless). The two are on different origins, so the frontend calls the
backend at `VITE_API_BASE_URL` and the backend enables CORS for the frontend origin
(`CORS_ORIGIN`).

### Backend → Render

Uses [`render.yaml`](render.yaml) (Blueprint). In the Render dashboard: **New + → Blueprint**,
point at this repo. It creates a web service with:

- **Root directory:** `backend`
- **Build:** `npm install && npm run build`
- **Start:** `npm start` (`node dist/server.js`)
- **Health check:** `/api/health`

Set these environment variables in the Render dashboard (do **not** commit them):

| Variable | Notes |
|---|---|
| `FETCH_AI_API_KEY` | secret |
| `FETCH_AI_ENDPOINT_URL` | e.g. `https://api.asi1.ai/v1` |
| `FETCH_AI_MODEL` | e.g. `asi1-mini` |
| `GENERATION_TIMEOUT_MS`, `IDEA_MIN_LENGTH`, `IDEA_MAX_LENGTH` | defaults in `render.yaml` |
| `FIREBASE_PROJECT_ID` | your Firebase project id |
| `FIREBASE_SERVICE_ACCOUNT` | the service-account JSON **inlined as one string** (use this on Render; `FIREBASE_SERVICE_ACCOUNT_PATH` is for local dev) |
| `CORS_ORIGIN` | the deployed frontend origin, e.g. `https://your-app.vercel.app` |

> `PORT` is injected by Render automatically — do not set it. The server reads `process.env.PORT`.

### Frontend → Vercel

Uses [`frontend/vercel.json`](frontend/vercel.json) (SPA rewrite so React routes survive a
refresh). In the Vercel dashboard: **Add New → Project**, import this repo, and set:

- **Root directory:** `frontend`
- **Build command:** `npm run build` · **Output directory:** `dist` (auto-detected via `vercel.json`)

Set these environment variables:

| Variable | Value |
|---|---|
| `VITE_API_BASE_URL` | the deployed backend URL, e.g. `https://specpilot-backend.onrender.com` |
| `VITE_FIREBASE_API_KEY`, `VITE_FIREBASE_AUTH_DOMAIN`, `VITE_FIREBASE_PROJECT_ID`, `VITE_FIREBASE_APP_ID` | from your Firebase Web app config |

### Order & final wiring

1. Deploy the backend first to get its Render URL.
2. Deploy the frontend with `VITE_API_BASE_URL` = that Render URL.
3. Set the backend's `CORS_ORIGIN` to the Vercel URL and redeploy the backend.
4. Deploy the Firestore rules once: `firebase deploy --only firestore:rules`.

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
