# Signal → Story

**A live demo built for Flam's Software Engineering internship application.**

Flam builds AI-native content formats that turn passive customer touchpoints into
human-like, interactive visual experiences. This demo applies that exact idea to a
plain dataset: 1,500 raw XY readings that assemble themselves on screen, reveal a
hidden saturation curve, and then narrate their own shape in plain language —
generated live by Claude, never pre-written.

---

## Live Demo

> Deploy with Vercel (instructions below) and paste the URL in your application.

---

## What it does

| Act | What happens |
|-----|--------------|
| **1 — Assemble** | 1,500 particles burst from the canvas centre and ease into their true positions over ~3.6 s |
| **2 — Reveal** | A smooth Catmull-Rom spline traces the trend; a labelled pin marks the inflection point |
| **3 — Narrate** | A 24-point statistical summary is sent to Claude via a server-side proxy; the response typewriters onto the screen |

### Key technical details

- **Particle animation** — each point starts at a deterministic burst position (seeded PRNG) and eases in with a cubic in-out curve.
- **Colour gradient** — points are coloured cool-to-warm by X-value so the saturation shape is visible before the spline appears.
- **Catmull-Rom spline** — 30-point moving average bucketed into a smooth curve; visually cleaner than straight line segments.
- **Inflection detection** — computed as the point of maximum second derivative in the smoothed signal (~x = 85).
- **Hover tooltip** — nearest-neighbour search on `mousemove` shows exact XY values once the animation completes.
- **Server-side proxy** — `/api/narrate.js` is a Vercel Edge Function that forwards requests to Anthropic, keeping the API key out of the browser.
- **No build step** — the front-end is a single self-contained HTML file. Zero npm dependencies on the client.

---

## Project structure

```
signal-to-story/
├── signal-to-story.html   # Single-file front-end (open directly or serve)
├── xy_data.csv            # Source dataset (1,500 rows, x and y columns)
├── api/
│   └── narrate.js         # Vercel Edge Function — Anthropic proxy
├── vercel.json            # Vercel routing + security headers
└── README.md
```

---

## Running locally

### Option A — open directly (no AI narration)
Just double-click `signal-to-story.html`. The animation and chart work fully offline.
The AI button requires a valid Anthropic key and a running proxy.

### Option B — local dev server (AI narration enabled)

```bash
# Install Vercel CLI once
npm i -g vercel

# Start local dev server (auto-starts the Edge Function)
vercel dev
```

Then open `http://localhost:3000` and paste your Anthropic key into the key input.

---

## Deploying to Vercel (recommended)

```bash
# 1. Push this folder to a GitHub repo

# 2. Import the repo at vercel.com/new — Vercel auto-detects the config

# 3. Add your API key as an environment variable (optional but safer):
#    Settings → Environment Variables → ANTHROPIC_API_KEY = sk-ant-…

# 4. Deploy — you get a live HTTPS URL in ~30 seconds
```

When `ANTHROPIC_API_KEY` is set as an environment variable, the proxy uses it
and ignores the key sent from the browser entirely — so you can share the live
URL without anyone needing their own key.

---

## Architecture diagram

```
Browser                         Vercel Edge (api/narrate.js)       Anthropic
───────                         ────────────────────────────       ─────────
POST /api/narrate  ──────────►  validates key                 ──►  claude-sonnet-4-5
{ prompt, apiKey }              forwards to Anthropic              returns JSON
                   ◄──────────  returns { content: [...] }   ◄──
typewriter renders text
```

The front-end never talks to Anthropic directly. The key is resolved server-side
(env var takes priority over the value sent in the request body).

---

## Data notes

`xy_data.csv` contains 1,500 rows with columns `x` and `y`. The data follows a
saturating growth curve — rapid increase in y for lower x values that plateaus
around x ≈ 108–109. The inflection (steepest slope change) occurs near x ≈ 85,
consistent with a logistic or diminishing-returns process (e.g. learning curves,
market saturation, biological growth).

---

## Built with

- Vanilla JavaScript + Canvas 2D API
- [Fraunces](https://fonts.google.com/specimen/Fraunces) + [Inter](https://fonts.google.com/specimen/Inter) (Google Fonts)
- [Claude](https://www.anthropic.com) (claude-sonnet-4-5) via Anthropic Messages API
- [Vercel](https://vercel.com) Edge Functions for the server-side proxy

---

*Built as a portfolio demo for [Flam](https://flam.app)'s Software Engineering internship (Bangalore).*
