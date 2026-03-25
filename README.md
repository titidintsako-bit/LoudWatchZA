# LoudWatch ZA

**Real-time South Africa intelligence dashboard**

LoudWatch ZA is an open-source, cyberpunk-styled situational awareness platform for South Africa. It aggregates live loadshedding schedules, dam levels, municipal audit outcomes, crime heatmaps, unemployment rates, protest activity, news geo-pins, live aircraft (ADS-B), and live vessel (AIS) data onto an interactive map — with an AI-generated daily intelligence brief.

---

## Features

| Layer | Icon | Data Source | Frequency | Description |
|---|---|---|---|---|
| Loadshedding | Zap | EskomSePush / RapidAPI | Live | Current loadshedding stage and schedules by area. Color-coded Stage 0–6 badges with pulse animation. |
| Pain Index | AlertTriangle | Computed | Daily | Composite municipal distress score combining audit outcome, unemployment, loadshedding days, water shortage, and Blue/Green Drop failure. Ranked leaderboard of worst 5. |
| Dam Levels | Droplets | DWS / scraped | Weekly | National and per-dam storage percentages as horizontal gauge bars. Critical (<30%) shown in red. |
| Crime Heatmap | Skull | SAPS annual crime stats | Quarterly | Kernel-density heatmap of reported crime incidents by category. |
| Municipal Audits | ClipboardCheck | AGSA | Annual | AGSA audit outcome per municipality: Clean Audit, Unqualified with Findings, Qualified, Adverse, Disclaimer. |
| Unemployment | TrendingDown | StatsSA QLFS | Quarterly | Official unemployment rate per province / municipality from the Quarterly Labour Force Survey. |
| Protests | Megaphone | Scraped / reported | Daily | Geo-tagged protest and service-delivery demonstration events. |
| News Pins | Newspaper | RSS / scraped | 5 minutes | NLP-geolocated South African news articles pinned to the map with sentiment indicators. |
| ADS-B Aircraft | Plane | OpenSky Network | Live | Real-time commercial and general aviation positions over South Africa. |
| AIS Ships | Ship | MarineTraffic / OpenSky | Live | Real-time vessel positions in South African waters (Cape Town, Durban, Richards Bay). |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js 14 (App Router), React 18, TypeScript |
| Mapping | react-map-gl + Mapbox GL JS (or MapLibre GL JS) |
| Animations | Framer Motion |
| Styling | Tailwind CSS + custom glassmorphism |
| UI Components | shadcn/ui (Radix UI) |
| Icons | lucide-react |
| Fonts | Orbitron (headings), Fira Code (data) |
| Backend | FastAPI (Python 3.12) |
| NLP | spaCy (en_core_web_sm) for geo-tagging news |
| AI Briefs | Groq API (Llama 3) |
| Database | Supabase (PostgreSQL + PostGIS) |
| Cache | Upstash Redis (REST API) |
| Deploy (FE) | Vercel |
| Deploy (BE) | Railway |
| CI/CD | GitHub Actions (cron data refresh) |

---

## Quick Start

### Prerequisites

- Node.js 18+
- Python 3.12+
- Docker and Docker Compose (optional, for containerised setup)

### 1. Clone and install

```bash
git clone https://github.com/your-org/loudwatch-za.git
cd loudwatch-za
cp .env.example .env
# Edit .env and fill in your API keys (see API Keys Guide below)
```

### 2. Backend setup

```bash
cd backend
python -m venv venv
source venv/bin/activate       # Windows: venv\Scripts\activate
pip install -r requirements.txt
python -m spacy download en_core_web_sm
uvicorn main:app --reload --port 8000
```

The backend will be available at `http://localhost:8000`. Visit `http://localhost:8000/docs` for the auto-generated Swagger UI.

### 3. Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend will be available at `http://localhost:3000`.

### 4. Docker (recommended for production-like local setup)

```bash
docker-compose up -d
```

This starts both the FastAPI backend (port 8000) and Next.js frontend (port 3000) with a shared volume for persistent data.

---

## API Keys Guide

| Service | Where to Get | Required? | Free Tier? |
|---|---|---|---|
| RapidAPI / EskomSePush | https://rapidapi.com/eskomsepush/api/eskom-se-push | **Yes** | 50 req/day free |
| OpenSky Network | https://opensky-network.org/apidoc/ | No (anonymous fallback) | Yes, anonymous (lower rate limits) |
| Groq | https://console.groq.com | No (AI brief disabled without it) | Yes (generous free tier) |
| Supabase | https://supabase.com/dashboard | **Yes** | Yes (500 MB free) |
| Upstash Redis | https://console.upstash.com | **Yes** | Yes (10k req/day free) |

Without `GROQ_API_KEY`, the AI Intel Brief panel will show "Brief unavailable" — all other features work normally.

Without `OPENSKY_USERNAME`/`OPENSKY_PASSWORD`, ADS-B data is fetched anonymously at a lower rate limit.

---

## Environment Variables

| Variable | Description | Required |
|---|---|---|
| `RAPIDAPI_KEY` | RapidAPI key for EskomSePush loadshedding data | Yes |
| `OPENSKY_USERNAME` | OpenSky Network username for higher rate limits | No |
| `OPENSKY_PASSWORD` | OpenSky Network password | No |
| `GROQ_API_KEY` | Groq API key for AI intelligence briefs | No |
| `SUPABASE_URL` | Supabase project URL (e.g. `https://xxx.supabase.co`) | Yes |
| `SUPABASE_SERVICE_KEY` | Supabase service role key (backend only, never expose to browser) | Yes |
| `SUPABASE_ANON_KEY` | Supabase anon public key | Yes |
| `UPSTASH_REDIS_REST_URL` | Upstash Redis REST endpoint URL | Yes |
| `UPSTASH_REDIS_REST_TOKEN` | Upstash Redis REST token | Yes |
| `NEXT_PUBLIC_SUPABASE_URL` | Same as `SUPABASE_URL`, exposed to browser | Yes |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Same as `SUPABASE_ANON_KEY`, exposed to browser | Yes |
| `BACKEND_URL` | URL of FastAPI backend (used by Next.js API routes to proxy) | Yes |
| `CORS_ORIGINS` | Comma-separated allowed CORS origins for the backend | Yes |

---

## Supabase Setup

1. Create a project at https://supabase.com/dashboard
2. Navigate to **SQL Editor**
3. Run the contents of `migrations/001_initial.sql`
4. Enable the **PostGIS** extension (Database → Extensions → search "postgis" → enable)
5. Copy your project URL and keys to `.env`:
   - `SUPABASE_URL` = your project URL
   - `SUPABASE_SERVICE_KEY` = Settings → API → service_role key
   - `SUPABASE_ANON_KEY` = Settings → API → anon public key

---

## Spatial Data Files

The following GeoJSON files must be placed manually (they are too large to include in the repository):

```
frontend/public/geojson/sa-municipalities.geojson   # Municipal boundaries
frontend/public/geojson/sa-provinces.geojson         # Provincial boundaries
```

**Sources:**
- South Africa municipalities: https://data.humdata.org/dataset/cod-ab-zaf
- South Africa provinces: https://www.gadm.org/download_country.html (ZAF, level 1)

**GeoJSON property requirements:**
- Each feature must have a `properties.name` field matching the municipality or province names used in the database
- Municipality features should also have `properties.province` for filtering

---

## Architecture

```
┌─────────────────────────────────────────────────┐
│              Browser / Client                   │
│  Next.js 14 App (Vercel)                        │
│  ┌──────────┐  ┌──────────┐  ┌──────────────┐  │
│  │ Map      │  │ HUD      │  │ Panels       │  │
│  │ Layers   │  │ Widgets  │  │ Dossier      │  │
│  └──────────┘  └──────────┘  └──────────────┘  │
└────────────────────┬────────────────────────────┘
                     │ API Routes (/api/*)
                     │ (proxy + cache layer)
┌────────────────────▼────────────────────────────┐
│          FastAPI Backend (Railway)              │
│  ┌──────────────────────────────────────────┐  │
│  │  /loadshedding  /dams  /municipalities   │  │
│  │  /news          /ai-brief  /search       │  │
│  │  /aircraft      /ships     /report       │  │
│  └──────────────────────────────────────────┘  │
│       │              │              │           │
│  Supabase       Upstash Redis   External APIs  │
│  (PostgreSQL    (6h/5min/live   EskomSePush    │
│  + PostGIS)      caching)       OpenSky        │
│                                  Groq           │
└─────────────────────────────────────────────────┘
         │
         ▼
  GitHub Actions
  Cron jobs: dams (weekly), crime (quarterly),
  audits (annual), unemployment (quarterly)
```

---

## Deployment

### Frontend — Vercel

1. Push the repository to GitHub
2. Go to https://vercel.com/new and import the repository
3. Set the **Root Directory** to `frontend`
4. Set the **Build Command** to `npm run build`
5. Add all `NEXT_PUBLIC_*` environment variables plus `BACKEND_URL` in the Vercel dashboard
6. Set `BACKEND_URL` to your Railway backend URL (e.g. `https://loudwatch-backend.up.railway.app`)
7. Deploy

### Backend — Railway

1. Go to https://railway.app/new and connect your GitHub repository
2. Set the **Root Directory** to `backend`
3. Railway auto-detects the `Dockerfile`; if not, add a `railway.toml` with `[build] builder = "DOCKERFILE"`
4. Add all backend environment variables in the Railway dashboard
5. Expose the service on port 8000
6. Copy the Railway-generated URL to Vercel's `BACKEND_URL`

### GitHub Actions secrets required

Set these in your repository Settings → Secrets → Actions:

| Secret | Value |
|---|---|
| `BACKEND_URL` | Your Railway backend URL |
| `ADMIN_TOKEN` | A secret token checked by your backend's admin endpoints |

---

## Layer Details

### Loadshedding
- **Source:** EskomSePush API via RapidAPI
- **Frequency:** Live (polled every 5 minutes, cached in Redis)
- **Click action:** Shows area-level schedule in DossierPanel
- **Color coding:** Stage 0 = green, 1–2 = amber pulse, 3 = orange pulse, 4–6 = red urgent pulse

### Pain Index
- **Source:** Computed from municipal data in Supabase
- **Frequency:** Recalculated daily
- **Click action:** Zooms map to municipality, opens DossierPanel
- **Formula:** See Pain Index Formula section below

### Dam Levels
- **Source:** Department of Water and Sanitation (DWS) weekly reports
- **Frequency:** Updated every Monday via GitHub Actions cron
- **Click action:** Opens DossierPanel with dam details and historical trend

### Crime Heatmap
- **Source:** SAPS Annual Crime Statistics (scraped from saps.gov.za)
- **Frequency:** Updated quarterly (new data typically released September)
- **Click action:** Shows crime category breakdown for the area

### Municipal Audits
- **Source:** Auditor-General South Africa (AGSA) annual report
- **Frequency:** Updated annually (November, after AGSA release)
- **Click action:** Opens DossierPanel with full audit outcome and key findings

### Unemployment
- **Source:** StatsSA Quarterly Labour Force Survey (QLFS)
- **Frequency:** Updated quarterly (February, May, August, November)
- **Click action:** Shows provincial unemployment breakdown

### Protests
- **Source:** Scraped from news sources and ACLED Africa
- **Frequency:** Daily
- **Click action:** Shows protest title, date, description

### News Pins
- **Source:** RSS feeds from major SA news outlets, NLP-geolocated with spaCy
- **Frequency:** Every 5 minutes
- **Click action:** Opens article URL; sentiment shown as color (green = positive, red = negative)

### ADS-B Aircraft
- **Source:** OpenSky Network REST API
- **Frequency:** Live (30-second refresh)
- **Click action:** Shows callsign, origin/destination, altitude, speed

### AIS Ships
- **Source:** OpenSky Network / MarineTraffic
- **Frequency:** Live (60-second refresh)
- **Click action:** Shows vessel name, type, speed, destination port

---

## Pain Index Formula

The Pain Index is a composite score from 0 to 5 measuring municipal distress:

```
pain_score = (5 - audit_score)         × 0.30
           + unemployment_rate / 100    × 0.25   (normalized)
           + loadshedding_days / 365    × 0.20   (normalized)
           + water_shortage             × 0.15   (0 or 1 boolean)
           + blue_green_drop_fail       × 0.10   (0 or 1 boolean)
```

| Component | Weight | Source | Description |
|---|---|---|---|
| Audit Score | 30% | AGSA | Clean Audit = 5, Unqualified with Findings = 3, Qualified = 2, Adverse/Disclaimer = 0 |
| Unemployment Rate | 25% | StatsSA QLFS | Official unemployment rate (%) normalised to 0–1 |
| Loadshedding Days | 20% | EskomSePush | Number of days in past year with loadshedding > Stage 1 |
| Water Shortage | 15% | DWS / municipal reports | Binary: 1 if municipality is under water restriction or shortage |
| Blue/Green Drop Fail | 10% | DWS Blue/Green Drop | Binary: 1 if municipality failed the latest Blue Drop or Green Drop assessment |

Scores above 3.5 are considered critical (red). Scores below 1.5 are considered low distress (green).

---

## Contributing

Contributions are welcome. To contribute:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/your-feature-name`
3. Make your changes with clear, focused commits
4. Ensure the frontend builds without errors: `cd frontend && npm run build`
5. Ensure the backend starts without errors: `cd backend && uvicorn main:app`
6. Open a Pull Request against `main` with a clear description of the changes

### Code style

- Frontend: ESLint + Prettier (configured in `frontend/.eslintrc.json`)
- Backend: `ruff` for linting, `black` for formatting
- Commit messages: conventional commits format (`feat:`, `fix:`, `chore:`, `docs:`)

### Reporting issues

Please use GitHub Issues. Include:
- Browser and OS version (for frontend bugs)
- Python version and pip freeze output (for backend bugs)
- Steps to reproduce
- Expected vs actual behaviour

---

## License

MIT License

Copyright (c) 2025 LoudWatch ZA Contributors

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
