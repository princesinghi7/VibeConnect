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

Copy the example env file and add your API key(s):
```bash
cd vibeconnect/backend
cp .env.example .env
```
Open `.env` and set whichever you want to use:
```
ANTHROPIC_API_KEY=sk-ant-...
XAI_API_KEY=xai-...
```
The AI Assistant page has a **Claude / Grok** toggle at the top — each provider works independently of the other. Without a key for a given provider, that mode still works, it just replies with a placeholder message telling you a key is missing.

## 4. (Optional) Enable Google Sign-In

1. Go to https://console.cloud.google.com/apis/credentials, create an **OAuth Client ID** of type **Web application**.
2. Add `http://localhost:5173` to **Authorized JavaScript origins**.
3. Copy the Client ID into **both**:
   - `backend/.env` → `GOOGLE_CLIENT_ID=...`
   - `frontend/.env` (copy from `frontend/.env.example`) → `VITE_GOOGLE_CLIENT_ID=...`
4. Restart both servers.

The official "Continue with Google" button will then appear on Login and Signup, and creates/logs in a real account verified server-side. Without a Client ID, the button shows a disabled placeholder instead.

## 5. (Optional) Connect real social data

Copy the frontend env example if you haven't already:
```bash
cd vibeconnect/frontend
cp .env.example .env
```

Your Profile page can show **live** data instead of just links:

- **YouTube** — get a free key at https://console.cloud.google.com/apis/library/youtube.googleapis.com, set `YOUTUBE_API_KEY` in `backend/.env`. Your profile will then show your real, live subscriber and video count (no OAuth needed, it's public data).
- **Instagram** — Instagram's official embed only supports individual public posts, not full profiles. To show a real live post, open your profile's `socials.instagramPostUrl` field in `backend/src/data.ts` (and `frontend/src/api/mock.ts`) and set it to a real post URL, e.g. `https://www.instagram.com/p/XXXXXXX/`.
- **Facebook** — create a free App ID at https://developers.facebook.com/apps (no app review needed for the Page Plugin). Set `VITE_FACEBOOK_APP_ID` in `frontend/.env`. Your profile will then embed your real, live Facebook Page.

Without these set up, each social card gracefully falls back to a plain link to your actual profile — nothing breaks.

## 6. Run it

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

## 7. Log in

**Demo creator account** (Prince Singh — pre-loaded with your photo, niche, and socials):
- **Email:** `demo@vibeconnect.dev`
- **Password:** `demo1234`

Or click **Create an account** and choose **Creator** or **Brand** at signup — both create a real account on the backend. **Continue with Google** also works once configured (see section 4).

> Backend data is in-memory only — restarting it resets everything to the seed data.

## 8. What's in the app

**For everyone**
- **Dashboard** — overview, stats, suggested connections, latest posts
- **Feed** — post updates with optional photo attachments and tags, like/comment, filter by trending tags
- **Connections** — your network, filterable; Connect sends a request, tap again to cancel it
- **Messages** — chat threads
- **AI Assistant** — chat with Claude or Grok (toggle in the header) for pricing tips, pitch advice, campaign briefs, etc.
- **Profile** — bio, photo upload (click the pencil), niche & social links (creators) or industry & budget (brands). Social links show **live** data when configured: real YouTube subscriber count, a real embedded Instagram post, and your real Facebook Page.

**Creators only**
- **Discover Brands** — browse real, recognizable brands (Mamaearth, boAt, Zomato, Swiggy) actively looking for creators — tap a card to open their actual official website
- **Campaigns** — browse open briefs and apply
- **Analytics** — follower growth & engagement charts with area fills, grid lines, and a platform breakdown
- **Media Kit** — editable rate card + portfolio showcase that now saves and survives page reloads

**Brands only**
- **Discover Creators** — browse/filter creators by niche, see follower count, engagement rate, and socials
- **Campaigns** — post new briefs, track applicants, see status (applied/shortlisted/accepted)

## 9. Building for production

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

For a real deployment, point the frontend's `/api` requests at your deployed backend URL (update the proxy in `vite.config.ts` for local dev, or set up a reverse proxy / CORS-enabled backend URL for production). Make sure `ANTHROPIC_API_KEY` and/or `XAI_API_KEY` are set as environment variables on your backend host — never commit them to git.

## 10. If something won't connect

- Make sure the backend is running on **port 4000** before you open the frontend — the frontend works without it (using mock data) but real login/signup/AI chat needs it.
- If port 4000 is taken, set `PORT=4001` in `backend/.env` and update the proxy target in `frontend/vite.config.ts` to match.
- If the AI Assistant says it's "not connected" to Claude or Grok, the matching API key is missing or invalid — check `backend/.env`.
- If "Continue with Google" shows a disabled button, `VITE_GOOGLE_CLIENT_ID` is missing from `frontend/.env` — restart `npm run dev` after adding it (Vite only reads `.env` at startup).
- Google Sign-In **requires the backend running** — it verifies the token server-side and won't fall back to demo mode (faking a Google login would be misleading).
- If social embeds on your profile just show plain links, that's expected without the optional keys from section 5 — nothing is broken.

