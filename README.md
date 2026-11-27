# VerityWeb

> **"Your business information. A website that gets it right."**

VerityWeb is an evidence-grounded AI website builder designed for local businesses. Unlike generic AI site generators that hallucinate business details, VerityWeb operates under a non-negotiable core principle: **it must never invent business facts**.

- **Live Production URL:** [https://verityweb.onrender.com](https://verityweb.onrender.com)
- **GitHub Repository:** [https://github.com/sujalkadam2906/VerityWeb](https://github.com/sujalkadam2906/VerityWeb)

---

## 1. Problem Statement

Small and local business owners (bakeries, auto repair shops, dental practices, specialty cafés) face a chronic dilemma when building a web presence:

1. **Traditional website builders** (Wix, WordPress, Squarespace) require substantial time, manual data entry, layout tuning, and design skills.
2. **Generative AI site builders** (prompt-to-website tools) frequently fabricate critical operational facts—hallucinating menus, inventing trading hours, generating fictitious phone numbers, or creating fake customer testimonials. A single hallucinated fact (such as incorrect operating hours or fictitious pricing) damages trust and causes operational disruption.

VerityWeb solves this by grounding website generation entirely in verifiable evidence provided by the business owner.

---

## 2. Core Principle: Grounded Truth

```
[ Business Evidence ] ──▶ [ Extraction & Disambiguation ] ──▶ [ Fact Review & Conflict Resolution ] ──▶ [ Grounded Site Generation ]
```

VerityWeb enforces strict boundaries on business data:

- **Verified Information:** Facts extracted directly from authentic sources (digital PDFs, verified websites, explicit owner input) that have been confirmed by the business owner.
- **Conflicting Information:** Divergent data detected across multiple sources (e.g., website states closing at 9 PM, but menu PDF states 10 PM). The system highlights conflicts and requires the owner to choose the canonical truth.
- **Unverified Information:** Heuristic or lower-confidence extractions flagged with visual badges for owner review before inclusion.
- **Missing Information:** If an operational detail (e.g., email address, Sunday trading hours, or certifications) is absent from the evidence, **VerityWeb deliberately leaves it omitted**. It will never fabricate placeholder contact details or generic reviews.

---

## 3. Core Features

- **Multi-Source Evidence Intake:**
  - Ingest public business website URLs with automated metadata, contact, and text parsing.
  - Upload digital PDF documents (menus, price lists, brochures).
  - Upload brand assets (logos, photography, banners) with validation.
  - Manual business profile entry (identity disambiguation: legal name, trading name, category, address, phone).
- **Security-First Ingestion & Anti-SSRF:**
  - Automated DNS verification, private IP filtering (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.0/8`), link-local / cloud metadata blocking (`169.254.169.254`), and payload size limits on URL ingestion.
  - Controlled redirect following to prevent SSRF redirect-bypass vulnerabilities.
  - Strict MIME-type and extension validation on document uploads.
- **Fact Verification & Conflict Resolution Engine:**
  - Automatic extraction of key business attributes (name, category, tagline, city, address, phone, email, hours, services).
  - Visual review screen displaying confidence levels, source attribution links, and conflict badges.
  - Granular owner controls: accept facts, resolve conflicts, edit values, or reject unverified items.
- **Grounded AI Website Generation:**
  - Powered by Google Gemini API (`gemini-1.5-flash` or `gemini-2.5-flash`) with structured JSON schema output and strict system instructions enforcing zero-hallucination copy.
  - Deterministic fallback generation: if Gemini is unavailable, unconfigured, or rate-limited, the application generates a complete, clean, professional website deterministically using verified facts.
- **Interactive Live Editor:**
  - Live side-by-side preview and section-by-section editing (Hero, Story, Services, Menu/Products, Operating Hours, Contact/Location, Footer).
  - Individual section regeneration using natural language prompts while retaining grounded facts.
  - Reordering, visibility toggles, and instant updates.
- **Public Publishing & Sharing:**
  - One-click publishing to unique public slugs (`/sites/{slug}`).
  - Instant unpublishing capability.
  - Accessible, fully responsive public layout supporting mobile, tablet, and desktop viewports.
- **Multi-Tenant Security & Ownership:**
  - Complete user isolation: projects, evidence, and facts are strictly bound to authenticated user accounts via Eloquent ownership scopes.
  - Guests visiting the root route are redirected to `/login`, while authenticated users route to `/dashboard`.

---

## 4. Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Backend Framework** | Laravel 11 / PHP 8.3 |
| **Frontend Architecture** | Inertia.js v2 + React 18 + TypeScript |
| **Styling & Design** | Tailwind CSS + Headless UI + Lucide React |
| **Database** | PostgreSQL (Supabase / local PostgreSQL / SQLite for tests) |
| **AI Integration** | Google Gemini Generative Language API (`gemini-1.5-flash`) |
| **Container & Runtime** | Docker (Alpine Linux) + Nginx + PHP-FPM + Supervisord |
| **Hosting & Cloud** | Render Web Service (Docker Environment) |
| **Build Tooling** | Vite 6 + Composer + npm |
| **Testing** | PHPUnit (Feature & Unit Test Suites) |

---

## 5. System Architecture

```
                                  [ Browser / Client ]
                                            │
                                            ▼
                               [ Render Cloud Edge / TLS ]
                                            │
                                            ▼
                    ┌───────────────────────────────────────────────┐
                    │ Docker Container (Alpine Linux)               │
                    │                                               │
                    │  ┌──────────────┐     FastCGI    ┌──────────┐ │
                    │  │ Nginx        │ ─────────────▶ │ PHP-FPM  │ │
                    │  │ (Reverse     │ (127.0.0.1:    │ (PHP 8.3)│ │
                    │  │  Proxy)      │        9000)   │          │ │
                    │  └──────┬───────┘                └────┬─────┘ │
                    │         │                             │       │
                    │         ▼                             │       │
                    │   Vite Manifest                       │       │
                    │   Static Assets                       │       │
                    └───────────────────────────────────────┼───────┘
                                                            │
                     ┌──────────────────────────────────────┴──────────────────────────────────────┐
                     │                                                                             │
                     ▼                                                                             ▼
           [ Supabase PostgreSQL ]                                                       [ Google Gemini API ]
      (Users, Projects, Evidences, Facts,                                           (Structured JSON Copywriting,
             Sessions, Cache)                                                          Zero-Hallucination Copy)
```

---

## 6. Application Workflow

```
1. Authenticate / Register ──▶ 2. Create Project (Intake URL, PDFs, Images)
                                      │
                                      ▼
                               3. Evidence Extraction & Safety Checks (SSRF Filter, PDF Text Parsing)
                                      │
                                      ▼
                               4. Fact Review & Conflict Resolution (Owner Confirms Canonical Facts)
                                      │
                                      ▼
                               5. Website Generation (Gemini AI or Deterministic Fallback)
                                      │
                                      ▼
                               6. Live Editor (Tune Copy, Toggle Sections, Per-Section AI Regenerate)
                                      │
                                      ▼
                               7. Publish Site (Live public URL at /sites/{slug})
```

---

## 7. Local Development Setup

### Prerequisites

- **PHP 8.2 or 8.3** with extensions: `pdo`, `pdo_pgsql` or `pdo_sqlite`, `curl`, `mbstring`, `xml`, `zip`.
- **Composer** (v2.x)
- **Node.js** (v18.x or v20.x) and **npm**
- **Git**

### Step-by-Step Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/sujalkadam2906/VerityWeb.git
   cd VerityWeb
   ```

2. **Install PHP dependencies:**
   ```bash
   composer install
   ```

3. **Install JavaScript dependencies:**
   ```bash
   npm install
   ```

4. **Configure environment:**
   ```bash
   cp .env.example .env
   php artisan key:generate
   ```

5. **Configure Database in `.env`:**
   For quick local testing, you can use SQLite:
   ```env
   DB_CONNECTION=sqlite
   ```
   Or connect to a local or Supabase PostgreSQL instance:
   ```env
   DB_CONNECTION=pgsql
   DB_HOST=127.0.0.1
   DB_PORT=5432
   DB_DATABASE=verityweb
   DB_USERNAME=postgres
   DB_PASSWORD=your_password
   ```

6. **Run Database Migrations:**
   ```bash
   php artisan migrate
   ```

7. **Optional: Configure Gemini AI:**
   Add your Google Gemini API key to `.env` (obtainable from [Google AI Studio](https://aistudio.google.com/)):
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   GEMINI_MODEL=gemini-1.5-flash
   ```
   *Note: If no API key is set, VerityWeb runs seamlessly using its built-in deterministic generation engine.*

8. **Start Development Servers:**
   Terminal 1 (Vite Dev Server):
   ```bash
   npm run dev
   ```
   Terminal 2 (Laravel Server):
   ```bash
   php artisan serve
   ```
   Visit `http://localhost:8000` in your browser.

---

## 8. Environment Variables Reference

| Variable | Required | Description |
| :--- | :--- | :--- |
| `APP_NAME` | No | Application display name (`VerityWeb`) |
| `APP_ENV` | Yes | Environment (`local` or `production`) |
| `APP_KEY` | Yes | 32-character encryption key (`base64:...`) |
| `APP_DEBUG` | Yes | Debug mode (`false` in production) |
| `APP_URL` | Yes | Base URL (`https://verityweb.onrender.com`) |
| `DB_CONNECTION` | Yes | Database driver (`pgsql` or `sqlite`) |
| `DB_HOST` / `DB_PORT` | If pgsql | PostgreSQL host and port |
| `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD` | If pgsql | Database credentials |
| `DB_SSLMODE` | No | Set to `require` for Supabase pooled connections |
| `SESSION_DRIVER` | Yes | Session storage driver (`database` recommended) |
| `CACHE_STORE` | Yes | Cache store (`database` or `file`) |
| `GEMINI_API_KEY` | Optional | Google Gemini API key for AI generation |
| `GEMINI_MODEL` | No | Model slug (`gemini-1.5-flash` or `gemini-2.5-flash`) |
| `GEMINI_TIMEOUT` | No | Timeout in seconds for AI calls (default: `30`) |

---

## 9. Testing & Build Instructions

### Running Backend Tests

The test suite covers Authentication, Security Isolation, Evidence Processing, Fact Resolution, AI Generation, Editor Updates, and Public Slugs:

```bash
# Run the full automated test suite
php artisan test
```

*Expected baseline:* **61 tests passed, 223 assertions, 0 failures**.

### Running TypeScript & Frontend Verification

```bash
# Run TypeScript compilation check
npx tsc --noEmit

# Run production Vite build
npm run build
```

---

## 10. Docker & Production Deployment (Render)

The application is deployed on **Render** via a multi-stage Docker container managed by Supervisord.

### Container Architecture

- **Base Image:** Alpine Linux with PHP 8.3 (`php83-fpm`, `php83-pgsql`, `php83-mbstring`, `php83-xml`, `php83-curl`, etc.)
- **Web Server:** Nginx configured for FastCGI proxying, HTTPS detection, and reverse-proxy header preservation.
- **Process Manager:** Supervisord orchestrating Nginx and PHP-FPM simultaneously.
- **Entrypoint:** `docker/entrypoint.sh` automatically runs database migrations (`php artisan migrate --force`), warms route/config caches, and launches Supervisord.

### Health Check

Render monitors container health via the Laravel `/up` endpoint:
- **Health Check Path:** `/up`
- Returns HTTP 200 when database, cache, and framework bootstrap are healthy.

---

## 11. Security Considerations

- **Strict Multi-User Isolation:** Every project query is constrained by `auth()->id()`. Cross-user access attempts return HTTP 403 / 404.
- **SSRF Defenses:** External URL fetching inspects host IP resolutions against private RFC 1918 blocks, link-local addresses, and cloud metadata endpoints (`169.254.169.254`). Redirect chains are inspected manually.
- **Secret Redaction:** `GeminiService` actively redacts API keys from log files and exception messages.
- **Zero Client-Side Secret Exposure:** The Gemini API key is never exposed to the frontend or bundled into Vite assets.
- **CSRF & Cookie Protection:** All state-changing endpoints are protected by Laravel's CSRF middleware with encrypted, `SameSite=Lax`, `Secure` session cookies.

---

## 12. Known Limitations & Honest Boundaries

To maintain technical accuracy, the following boundaries and limitations are documented:

1. **Optical Character Recognition (OCR):** OCR is not implemented. Scanned PDFs (pure images without selectable text) cannot be automatically parsed and require manual fact entry.
2. **Ephemeral Storage on Render:** Render free-tier instances run an ephemeral filesystem. Uploaded evidence PDFs and images do not persist across redeployments unless backed by persistent S3-compatible cloud storage.
3. **Anti-Bot Gated Websites:** External URL extraction respects public HTTP endpoints. Websites protected by Cloudflare Turnstile, CAPTCHAs, or authentication walls cannot be crawled automatically.
4. **Email Delivery:** Production password resets and email verification require configuring production SMTP credentials in environment variables (`MAIL_*`).
5. **Gemini API Limits:** AI features depend on Google AI Studio availability and rate limits. VerityWeb gracefully falls back to deterministic rule-based synthesis whenever the API is unavailable or unconfigured.

---

## 13. License

Open-source software licensed under the [MIT License](LICENSE).
