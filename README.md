# 🎯 LeadScout

> **Production-Ready Local Business Lead Finder & Website Analyzer for Web Agencies.**  
> Built with React (Vite) + Tailwind CSS, Node.js + Express, MongoDB, and Universal AI Gateway / Google Gemini.

---

## 🌟 Core Features

1. **Google Places Discovery**
   - Search by city/area or 1-click GPS device location.
   - 1–20 km radius search with category mapping (salons, clinics, gyms, dentists, cafes, etc.).
   - Server-side deduplication by `place_id` and 24h search caching in MongoDB to conserve Google API quotas.

2. **Presence & Website Detection**
   - Accurately classifies leads: `NO_WEBSITE`, `SOCIAL_ONLY` (Instagram/Facebook/WhatsApp/Linktree), `HAS_WEBSITE`, or `BROKEN` (4xx/5xx/SSL errors).
   - Fast server-side HTTP probes with timeout & redirects handling.

3. **AI Website Analyzer (Universal AI Gateway & Gemini)**
   - Cheerio HTML parsing checking 12 core programmatic indicators (HTTPS, mobile viewport, H1, meta tags, click-to-call, WhatsApp direct button, lead forms, Google Maps embeds, image alts).
   - Real-time mobile PageSpeed Insights integration (Performance, SEO, Accessibility).
   - Structured JSON audit: Health Score, Strengths, Weaknesses, Conversion Friction, Quick Wins, and Suggested Pitch Angle.
   - Automatic fallback analysis for `NO_WEBSITE` businesses explaining business growth opportunity.
   - Clean report card with animated score gauge and 1-click **Print / PDF export**.

4. **Configurable Lead Opportunity Scoring**
   - 0–100 opportunity score: businesses without websites or with low-health websites get higher lead priority.
   - Bonuses for established reputation (4.0+ rating and 20+ reviews), phone availability, and high-ticket service categories.
   - Visual Badges: 🔥 **HOT** (≥70), 🌡 **WARM** (≥40), ❄️ **COLD** (<40).

5. **Human-in-the-Loop Outreach Assistant**
   - Tailored message generator in **Hinglish**, **Hindi**, or **English**.
   - Generates WhatsApp pitches (<100 words), formal email subject + body, and a 30-second cold-call script.
   - Direct 1-click `wa.me` WhatsApp web/app link with pre-filled message, `mailto:`, and `tel:` call button.

6. **Pitch Playbook (after every audit)**
   - Built automatically from the full audit: strategy, lead temperature, who to talk to, best channel and time.
   - Opening hook, 3–4 talking points tied to real findings (issue → what it costs them → our fix → a line to say).
   - Objection handling, closing ask, Day 0 / 2 / 5 follow-up plan, things not to say, and a ready-to-send first WhatsApp message.
   - Hinglish, Hindi or English; regenerate without re-running the audit (`POST /api/analyze/:id/pitch`).
   - Optional `.env`: `AGENCY_NAME` and `AGENCY_OFFER` so pitches describe your own offer.

7. **Interactive Dashboard & CRM**
   - High-density table with multi-column sorting, live search, and filter drawers.
   - Interactive Dark-Mode **Leaflet Map** showing geocoded lead markers color-coded by lead temperature.
   - Mini CRM Pipeline: `NEW` → `CONTACTED` → `REPLIED` → `MEETING` → `WON` / `LOST` with notes.
   - Bulk select + CSV data export.
   - Quick-run saved searches.

---

## 🤖 AI Gateway Configuration

LeadScout supports any **OpenAI-compatible AI Gateway** (OpenRouter, Cloudflare AI Gateway, Portkey, LiteLLM, Groq, custom proxies) as well as **direct Google Gemini**.

In `server/.env`:

```env
# If using an AI Gateway:
AI_GATEWAY_URL=https://openrouter.ai/api/v1
AI_API_KEY=your_gateway_key_here
AI_MODEL=google/gemini-2.5-flash   # or gpt-4o-mini, deepseek/deepseek-chat, etc.

# Or if using direct Gemini:
# GEMINI_API_KEY=AIzaSy...
```

---

## 🚀 Quick Start (Local Development)

### 1. Server Setup
```bash
cd server
cp .env.example .env
# Fill in your MONGODB_URI, GOOGLE_PLACES_API_KEY, and AI Gateway details
npm install
npm run dev
```

### 2. Client Setup
```bash
cd client
cp .env.example .env
npm install
npm run dev
```

Open `http://localhost:5173`.
