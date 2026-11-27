# VERITYWEB — PRODUCTION DEPLOYMENT & OPERATIONS RUNBOOK

**Target Platform**: Render (Web Service, Docker Runtime)  
**Database**: Supabase PostgreSQL  
**AI Service**: Google Gemini Generative Language API (`gemini-2.5-flash` or `gemini-1.5-flash`)  
**URL**: `https://verityweb.onrender.com`  
**Last Updated**: November 27, 2026  

---

## 1. Architecture Overview

```
                      Internet
                         │
                         ▼
             [Render Edge Cloud / TLS Proxy]
                         │ (X-Forwarded-Proto: https, Port $PORT)
                         ▼
        ┌──────────────────────────────────────────────┐
        │ Docker Container (Alpine / Debian Slim)      │
        │                                              │
        │  ┌──────────────┐     FastCGI     ┌────────┐ │
        │  │ Nginx Server │ ──────────────▶ │PHP-FPM │ │
        │  │ (Port $PORT) │ (127.0.0.1:9000)│(PHP8.3)│ │
        │  └──────────────┘                 └───┬────┘ │
        │         │                             │      │
        │         ▼                             │      │
        │    Vite Manifest                      │      │
        │    Compiled Assets                    │      │
        └───────────────────────────────────────┼──────┘
                                                │
                     ┌──────────────────────────┴──────────────────────────┐
                     │                                                     │
                     ▼                                                     ▼
           [Supabase PostgreSQL]                                   [Google Gemini API]
           (Session, Cache, Facts)                                 (Grounded AI Synthesis)
```

---

## 2. Environment Variables Inventory

Configure these variables in the Render Dashboard (**Environment** tab for `verityweb` service) or via `render.yaml`:

| Variable Name | Required | Sensitivity | Default / Example Value | Description |
| :--- | :--- | :--- | :--- | :--- |
| `APP_NAME` | No | Low | `VerityWeb` | Application brand name |
| `APP_ENV` | Yes | Low | `production` | Enables production caching & HTTPS enforcement |
| `APP_KEY` | Yes | **CRITICAL** | `base64:...` (Generate with `php artisan key:generate --show`) | AES-256 session and cookie encryption key |
| `APP_DEBUG` | Yes | Low | `false` | Must remain `false` in production to prevent stack traces |
| `APP_URL` | Yes | Low | `https://verityweb.onrender.com` | Primary canonical URL |
| `DB_CONNECTION` | Yes | Low | `pgsql` | Database driver |
| `DB_HOST` | Yes | Low | `aws-0-ap-south-1.pooler.supabase.com` | Supabase pooler / host |
| `DB_PORT` | Yes | Low | `6543` (or `5432`) | Supabase port |
| `DB_DATABASE` | Yes | Low | `postgres` | Database schema name |
| `DB_USERNAME` | Yes | Low | `postgres.<project_ref>` | Database username |
| `DB_PASSWORD` | Yes | **CRITICAL** | `[SECURE_SUPABASE_PASSWORD]` | Database password |
| `GEMINI_API_KEY` | Optional | **HIGH** | `AIzaSy...` (from Google AI Studio) | Powers AI copywriting. Fallback active if absent |
| `GEMINI_MODEL` | No | Low | `gemini-2.5-flash` | Gemini model slug (e.g. `gemini-1.5-flash`) |
| `GEMINI_TIMEOUT` | No | Low | `30` | Max HTTP timeout in seconds for AI calls |
| `SESSION_DRIVER` | Yes | Low | `database` (or `cookie`) | Session persistence driver |
| `SESSION_SECURE_COOKIE`| No | Low | `true` | Enforces `Secure` flag on session cookies |
| `CACHE_STORE` | Yes | Low | `database` (or `file`) | Application cache store |
| `QUEUE_CONNECTION` | Yes | Low | `sync` (or `database`) | Queue driver |

---

## 3. Step-by-Step Deployment Procedure

### Step 1: Pre-Deployment Build Verification (Local)
Always ensure test suites and frontend builds pass cleanly before pushing:
```bash
# 1. Run all tests
php artisan test

# 2. Build Vite assets
npm run build

# 3. Check git status
git status
```

### Step 2: Push to GitHub Repository
```bash
git push origin main
```
Render is configured to trigger an automatic Docker build upon receiving new commits on `main`.

### Step 3: Container Build Lifecycle
The Dockerfile executes the following sequence during the Render build phase:
1. Installs system dependencies: PHP 8.3, Composer, Node.js 20, Nginx, Supervisor.
2. Runs `composer install --no-dev --optimize-autoloader --no-interaction`.
3. Runs `npm ci && npm run build` to compile Inertia React components into `public/build/`.
4. Copies `docker/nginx.conf`, `docker/supervisord.conf`, and `docker/entrypoint.sh`.

### Step 4: Container Startup & Automated Migrations
On container boot, `docker/entrypoint.sh` executes:
1. Replaces `$PORT` in Nginx configuration with the dynamic port assigned by Render.
2. Executes `php artisan migrate --force` to apply pending database schema changes (e.g. `business_evidences`, `business_facts`).
3. Clears and warms application caches:
   ```bash
   php artisan config:cache
   php artisan route:cache
   php artisan view:cache
   ```
4. Launches `supervisord`, supervising both `php-fpm` and `nginx` in the foreground.

---

## 4. Google Gemini API Integration

### How to obtain and configure the API key:
1. Visit [Google AI Studio](https://aistudio.google.com/).
2. Create or select a Google Cloud project and generate an API Key.
3. Open the Render Dashboard:
   - Go to **VerityWeb** service -> **Environment**.
   - Add `GEMINI_API_KEY` with your key value.
   - Set `GEMINI_MODEL` to `gemini-2.5-flash` or `gemini-1.5-flash`.
   - Click **Save Changes**. Render will automatically redeploy the service with zero downtime.

### Grounding & Zero-Hallucination Behavior:
- VerityWeb strictly passes confirmed facts (`BusinessFact` records confirmed by the user in Step 2 of the workflow) to Gemini's context window.
- If `GEMINI_API_KEY` is not provided, VerityWeb automatically activates its **Deterministic Synthesizer**, formatting verified business information into hero taglines, feature descriptions, and contact sections without throwing 500 errors or failing generation.

---

## 5. Operations & Troubleshooting Runbook

### Issue A: Nginx fails on boot with `server directive is not allowed here`
- **Cause**: Nginx configuration includes `conf.d/*.conf` from outside an `http { ... }` block, or duplicate `http` wrappers exist.
- **Resolution**: `docker/nginx.conf` has been permanently verified with the proper `events { worker_connections 1024; }` and `http { ... server { ... } }` hierarchy. Do not place standalone server blocks in `conf.d/default.conf` without `http` scoping.

### Issue B: Mixed Content Warning or Blank Page on HTTPS
- **Cause**: Application generates internal URLs with `http://` because reverse proxy headers are ignored.
- **Resolution**:
  - `bootstrap/app.php` contains `$middleware->trustProxies(at: '*')`.
  - `app/Providers/AppServiceProvider.php` forces HTTPS: `URL::forceScheme('https')`.
  - Nginx maps `$http_x_forwarded_proto` to `$fastcgi_https`.

### Issue C: Database Connection Timeout / Migration Failures
- **Cause**: Supabase connection pooler port or SSL requirements.
- **Resolution**:
  - Use port `6543` for connection pooling (Transaction mode) or port `5432` for direct connection.
  - In `config/database.php`, ensure `sslmode` is set to `prefer` or `require`.

### Issue D: File Upload Fails with `413 Request Entity Too Large`
- **Cause**: Nginx client body size ceiling.
- **Resolution**:
  `docker/nginx.conf` is configured with `client_max_body_size 20M;` allowing the application-level 10MB document limit to pass through unhindered.

---

## 6. Verification Checklist

- [x] Application boot verified (Nginx + PHP-FPM supervised).
- [x] HTTPS enforced across all Inertia routes and Vite assets.
- [x] Multi-user authentication & registration functioning.
- [x] Evidence upload supporting PDF, JPG, PNG, WEBP (10MB).
- [x] SSRF guardrails active and blocking RFC 1918 / Cloud Metadata.
- [x] Fact verification and conflict resolution pipeline operational.
- [x] Grounded website generation functional with Gemini API and deterministic fallback.
- [x] Inline section regeneration functional in live editor.
- [x] 54 automated feature/unit tests passing locally.
