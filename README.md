# Simmer — AI Recipe Generator

Turn whatever's in your kitchen into real recipes. Add ingredients by photo, voice,
or typing; pick a diet and cuisine; and Simmer generates recipe options with exact
quantities, step-by-step instructions, nutrition estimates, and a downloadable
shopping list. It can also plan a multi-day meal plan and walk you through cooking
in a full-screen, timer-backed mode.

The whole frontend is a single `index.html` file. AI calls go through one small
Vercel serverless function that keeps your Groq API key on the server, never in
the browser.

---

## Contents

- [Features](#features)
- [Project structure](#project-structure)
- [How it works](#how-it-works)
- [Deploy on Vercel](#deploy-on-vercel)
- [Local development](#local-development)
- [Configuration](#configuration)
- [Known limitations](#known-limitations)
- [Possible next steps](#possible-next-steps)

---

## Features

### Adding ingredients
- **Photo** — upload up to 3 photos at once (fridge, pantry, counter, whatever).
  All photos are analyzed together in a single AI call, and duplicate ingredients
  across photos are merged automatically.
- **Voice** — uses the browser's built-in `SpeechRecognition` API to transcribe
  what you say, then splits it into individual ingredients. Runs entirely
  client-side; no API call involved. Chrome and Edge support this; other browsers
  show a fallback message and you can just type instead.
- **Type** — a tag input. Type an ingredient and press Enter or comma to add it.
  Include a number (e.g. "2 eggs") and it's parsed into a quantity automatically;
  every ingredient tag also has its own +/− stepper to adjust the quantity later.

### Recipe generation
- Generates 3 recipe options per request, each with a title, cuisine, description,
  diet tags, prep/cook time, difficulty, precise ingredient quantities, numbered
  steps, a search link, and a rough per-serving nutrition estimate (calories,
  protein, carbs, fat).
- **Diet filter** — Any, Vegetarian, Vegan, Non-Veg, Eggetarian, Keto, Gluten-Free.
- **Cuisine filter** (optional) — Italian, Indian, Mexican, Chinese, Thai,
  Mediterranean, Japanese, American, or Any.
- **Avoid list** — allergies or dislikes you never want included; enforced as a
  hard constraint in the prompt, separate from the main ingredient list.
- **Regenerate a single recipe** — "↻ Try another" on any card swaps just that one
  recipe out for a different suggestion, without touching the other two.

### Recipe detail view
- **Servings adjuster** — a +/− stepper that rescales every ingredient quantity
  live (including fractions, e.g. ½ tsp → 1 tsp when doubling), and the downloaded
  shopping list respects the adjusted amount.
- **Shopping list** — a receipt-styled, downloadable `.txt` list of ingredients
  and quantities for that recipe at the current serving size.
- **Nutrition pills** — calories, protein, carbs, fat per serving.
- **Find online** — a Google search link built from the recipe's dish name.
- **Share** — uses the native share sheet where available (mobile/supported
  browsers), otherwise copies a formatted plain-text version of the recipe
  (ingredients + steps) to the clipboard.
- **Print** — a dedicated print stylesheet isolates just the recipe card.
- **Cooking mode** — a full-screen, one-step-at-a-time view with Back/Next
  navigation. Steps that involve waiting, simmering, boiling, baking, or resting
  get an automatic countdown timer (start/pause/reset) based on an AI-estimated
  duration; other steps have no timer.

### Save, history, and meal planning
- **Save/favorite** — a heart icon on every card and in the modal; a
  "Recipe ideas / Saved (N)" tab switches between what you just generated and
  everything you've saved.
- **History** — the last 5 generations are kept automatically (ingredients, diet,
  and the resulting recipes) and can be reloaded with one click from the History
  button.
- **Meal plan** — pick 3, 4, or 5 days and generate one main recipe per day from
  your current ingredients/diet/cuisine/avoid list (dishes are varied, not
  repeated). Browse by day tabs, view any day's full recipe, and download one
  combined shopping list covering the whole plan (grouped by day).

### Accounts
- Simple email/password accounts, created and checked entirely in the browser via
  `localStorage` — see [Known limitations](#known-limitations) for what this does
  and doesn't give you.
- Saved recipes and history are stored per account, scoped to that user's email.

---

## Project structure

```
index.html      The entire frontend: markup, styles, and all app logic.
api/chat.js     Vercel serverless function. Proxies chat requests to Groq,
                 keeping GROQ_API_KEY server-side only.
package.json    Minimal project metadata. No build step, no dependencies.
README.md       This file.
```

There is intentionally no build tooling — `index.html` is deployed as a static
file as-is, and `api/chat.js` is picked up automatically by Vercel as a
serverless function because it lives under `/api`.

---

## How it works

1. The browser never talks to Groq directly. Every AI call goes through
   `POST /api/chat` on your own deployment.
2. `api/chat.js` reads `GROQ_API_KEY` from a server-side environment variable,
   forwards the request to Groq's OpenAI-compatible endpoint
   (`https://api.groq.com/openai/v1/chat/completions`), and returns the result.
   This keeps the key out of client-side code and avoids any CORS issues.
3. Two models are used, chosen for a balance of quality and generous free-tier
   rate limits:
   - `openai/gpt-oss-20b` — recipe writing, regenerating a single recipe, and
     meal planning (text-only, JSON mode).
   - `qwen/qwen3.6-27b` — ingredient photo detection (vision + JSON mode).
4. Every AI response is requested as strict JSON (`response_format: json_object`)
   against a fixed schema described in the prompt, then parsed client-side.

---

## Deploy on Vercel

1. Push this project to a GitHub repo (all four files, with `chat.js` inside an
   `api/` folder at the repo root — not loose at the top level).
2. In Vercel, **Add New → Project**, and import that repo. No build command or
   output directory is needed; Vercel serves `index.html` as static and detects
   `api/chat.js` as a serverless function automatically.
3. In the Vercel project, go to **Settings → Environment Variables** and add:
   - `GROQ_API_KEY` = your key from [console.groq.com/keys](https://console.groq.com/keys)
4. Redeploy (environment variables only take effect on a new deployment).
5. Open the deployed URL, create an account, and try it.

### Verifying the backend is live

Visit `https://<your-deployment>.vercel.app/api/chat` directly in a browser
(a plain GET request). You should see:

```json
{"error":"Method not allowed. Use POST."}
```

That's the *correct* response to a GET — it confirms the function is deployed
and reachable. If you instead see Vercel's `404: NOT_FOUND` page, `api/chat.js`
isn't where Vercel expects it (check it's at `api/chat.js` from the repo root).

---

## Local development

You'll need the Vercel CLI so `/api/chat.js` actually runs — opening `index.html`
directly as a file won't execute the serverless function:

```bash
npm i -g vercel
vercel dev
```

Set `GROQ_API_KEY` in a local `.env` file (`vercel dev` reads it automatically),
or run `vercel env pull` if you've already set it in your Vercel project.

---

## Configuration

| Environment variable | Where | Required | Purpose |
|---|---|---|---|
| `GROQ_API_KEY` | Vercel project → Environment Variables (or local `.env`) | Yes | Server-side key used by `api/chat.js` to call Groq. Never exposed to the browser. |

No other configuration is needed. Model names and token limits are set directly
in `index.html` (`MODEL_TEXT`, `MODEL_VISION`) and `api/chat.js` if you want to
change them later.

---

