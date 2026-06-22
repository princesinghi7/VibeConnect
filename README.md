# VibeConnect

A dark, glassy collaboration platform connecting **content creators** with **brands** — profiles, campaigns, discovery, media kits, analytics, and an AI assistant powered by Claude.

```
vibeconnect/
├── frontend/   React + TypeScript + Vite (the UI)
└── backend/    Express + TypeScript (the API)
```

## 1. Requirements

- Node.js 18+ and npm
- (Optional, for real AI replies) an Anthropic API key from https://console.anthropic.com/settings/keys

## 2. Install

**Backend**
```bash
cd vibeconnect/backend
npm install
```

**Frontend**
```bash
cd vibeconnect/frontend
npm install
```

## 3. (Optional) Enable the AI Assistant

Copy the example env file and add your Anthropic key:
```bash
cd vibeconnect/backend
cp .env.example .env
```
Open `.env` and set:
```
ANTHROPIC_API_KEY=sk-ant-...
```
Without a key, the AI Assistant page still works — it just replies with a placeholder message telling you a key is missing.

## 4. Run it

**Terminal 1 — backend (port 4000)**
```bash
cd vibeconnect/backend
npm run dev
```
You should see:
```
VibeConnect API listening on http://localhost:4000
Demo login -> email: demo@vibeconnect.dev  password: demo1234
```

**Terminal 2 — frontend (port 5173)**
```bash
cd vibeconnect/frontend
npm run dev
```
Open **http://localhost:5173**

The frontend's Vite dev server proxies `/api/...` straight to `http://localhost:4000`, so both halves talk to each other automatically.

## 5. Log in

**Demo creator account** (Prince Singh — pre-loaded with your photo, niche, and socials):
- **Email:** `demo@vibeconnect.dev`
- **Password:** `demo1234`

Or click **Create an account** and choose **Creator** or **Brand** at signup — both create a real account on the backend.

> Backend data is in-memory only — restarting it resets everything to the seed data.

## 6. What's in the app

**For everyone**
- **Dashboard** — overview, stats, suggested connections, latest posts
- **Feed** — post updates, like, comment
- **Connections** — your network, filterable
- **Messages** — chat threads
- **AI Assistant** — chat with Claude for pricing tips, pitch advice, campaign briefs, etc.
- **Profile** — bio, photo upload (click the pencil), niche & social links (creators) or industry & budget (brands)

**Creators only**
- **Discover Brands** — browse brands actively looking for creators
- **Campaigns** — browse open briefs and apply
- **Analytics** — follower growth & engagement charts
- **Media Kit** — editable rate card + portfolio showcase, share-ready for brand outreach

**Brands only**
- **Discover Creators** — browse/filter creators by niche, see follower count, engagement rate, and socials
- **Campaigns** — post new briefs, track applicants, see status (applied/shortlisted/accepted)

## 7. Building for production

**Backend**
```bash
cd backend
npm run build
npm start
```

**Frontend**
```bash
cd frontend
npm run build
npm run preview   # serves the production build locally to sanity-check
```

For a real deployment, point the frontend's `/api` requests at your deployed backend URL (update the proxy in `vite.config.ts` for local dev, or set up a reverse proxy / CORS-enabled backend URL for production). Make sure `ANTHROPIC_API_KEY` is set as an environment variable on your backend host — never commit it to git.

## 8. If something won't connect

- Make sure the backend is running on **port 4000** before you open the frontend — the frontend works without it (using mock data) but real login/signup/AI chat needs it.
- If port 4000 is taken, set `PORT=4001` in `backend/.env` and update the proxy target in `frontend/vite.config.ts` to match.
- If the AI Assistant says "I'm not connected to Claude yet," your `ANTHROPIC_API_KEY` is missing or invalid — check `backend/.env`.

