# Simmer — AI Recipe Generator

A small recipe app: log in, add ingredients by photo / voice / typing, pick a diet,
and get AI-generated recipes with a downloadable shopping list and a link to search
for the recipe online.

## Project structure

```
index.html      the entire frontend (UI, login, recipe logic)
api/chat.js      Vercel serverless function — proxies requests to Groq
package.json     minimal metadata, no build step
```

## How it works

The browser never talks to Groq directly. `index.html` calls your own `/api/chat`
endpoint, which is a Vercel serverless function. That function reads your Groq API
key from a server-side environment variable and forwards the request to
`https://api.groq.com/openai/v1/chat/completions`. This keeps the key out of the
browser entirely and avoids any CORS issues.

Two models are used:
- `openai/gpt-oss-120b` — writes the recipes (text only)
- `qwen/qwen3.6-27b` — reads the ingredient photo (vision + JSON mode)

## Deploy on Vercel

1. Push this folder to a GitHub repo (or drag-and-drop it into the Vercel dashboard).
2. In Vercel, "Import Project" from that repo. No build command or output directory
   is needed — Vercel will serve `index.html` as a static file and `api/chat.js` as
   a serverless function automatically.
3. In your Vercel project, go to **Settings → Environment Variables** and add:
   - `GROQ_API_KEY` = your key from [console.groq.com](https://console.groq.com/keys)
4. Redeploy. That's it — open the deployed URL and log in.

## Local testing

You'll need the Vercel CLI so `/api/chat.js` actually runs (opening `index.html`
directly as a file won't execute the serverless function):

```bash
npm i -g vercel
vercel dev
```

Then set `GROQ_API_KEY` either in a local `.env` file (`vercel dev` reads it) or via
`vercel env pull`.

## Notes on the login system

Accounts are created and checked entirely in the browser's `localStorage` — there's
no real backend user database. This is fine for a demo or prototype, but it is **not**
secure account storage: passwords are stored in plain text in the browser and there's
no server-side verification. For a real deployment with real users, replace this with
a proper auth provider (e.g. Vercel's own auth integrations, Clerk, Auth0, or a small
database-backed API route).

## Voice input

Ingredient dictation uses the browser's built-in Web Speech API (`SpeechRecognition`),
which works in Chrome and Edge. It runs entirely client-side and doesn't call Groq.
Browsers without support (e.g. Firefox, Safari on some versions) will show a notice
and fall back to typing.
