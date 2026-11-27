# VERITYWEB — FINAL RELEASE CHECKLIST & VERIFICATION MATRIX

**Project**: VerityWeb — Truth-First Grounded AI Website Builder  
**Audit & Verification Date**: November 27, 2026  
**Status**: RELEASE CANDIDATE (RC-1)  

---

## 1. Classification & Status Matrix

### Category 1: Fully Implemented & In Production Code
- [x] **FR-01: Authentication & Tenant Isolation**:
  - Full registration, authentication, email verification, password resets.
  - Ownership gates (`$project->user_id !== Auth::id()`) across projects, facts, evidences, publishing, unpublishing, and section regeneration.
- [x] **FR-02: Project Dashboard**:
  - Dynamic project cards, thumbnails, published/draft status badges, duplication, and cascade deletion.
- [x] **FR-03: Business Information Collection**:
  - Flexible multi-field intake (name, city, category, address, phone, description).
  - Validation supporting partial/incomplete inputs without blocking progress.
- [x] **FR-04: File Uploads & Evidence Extraction**:
  - Real multipart uploads accepting PDF, JPG, PNG, WEBP (up to 10MB).
  - Secure private file storage (`storage/app/private/evidence/{project_id}/`).
  - Pure-PHP stream decompressor (`gzuncompress`/`gzinflate`) and tokenized operator parser (`Tj`, `TJ`) for PDFs without external CLI dependencies.
  - Scanned PDF detection flagging `scanned_needs_ocr`.
  - Evidence source deletion endpoint (`DELETE /projects/{project}/evidences/{evidence}`) removing both storage files and associated extracted facts.
- [x] **FR-05: Source Discovery & Research**:
  - Online presence URL harvesting (`SourceResearchService`).
  - Strict SSRF defense blocking RFC 1918 private ranges, loopback (`127.0.0.1`), link-local, multicast, IPv6, and Cloud Metadata (`169.254.169.254`).
  - 5-second timeout, 2MB size cap, and safe redirect validation.
- [x] **FR-06: Business Identity Disambiguation**:
  - Locality-based duplicate detection matching similar business names in the same city.
  - Automatically flags ambiguous entities as `needs_review` facts with explicit conflict explanation.
- [x] **FR-07 & FR-08: Fact Verification & Conflict Resolution**:
  - Ingestion of baseline intake facts.
  - Automated extraction of phone numbers and operating schedules from documents and online sources.
  - Automated discrepancy detection linking conflicting facts with `conflict_with_id` and explanations.
  - Interactive decision studio supporting "Use this value", "Reject", and inline "Edit & Use" custom value correction.
- [x] **FR-09: Fact-Grounded AI Website Generation**:
  - Anti-hallucination prompting injecting only confirmed facts as ground truth.
  - Strict JSON schema enforcement via Google Gemini API (`gemini-1.5-flash` / `gemini-2.5-flash`).
  - Grounded deterministic fallback when Gemini is offline or unconfigured.
- [x] **FR-10 & FR-11: Website Preview & Interactive Editor**:
  - Multi-viewport switcher (Desktop, Tablet, Mobile) with responsive rendering.
  - Reordering of sections (Move up / Move down).
  - Toggling section visibility (`hidden` sections).
  - Section-specific inspector controls:
    - Hero: Headline, Subheadline, CTA button.
    - Story: Story Heading, Story Text.
    - Services: Add, edit title/description, or remove service cards.
    - Operating Hours: Schedule editor.
    - Location & Contact: Address and phone editor.
  - Design tokens: 4 brand color palettes, 3 typography presets (Editorial, Modern, Classic), and spacing sliders (24px–72px).
- [x] **FR-12: Inline Section Regeneration**:
  - Real asynchronous AI section regeneration (`POST /projects/{project}/regenerate-section`).
  - Grounded against confirmed facts with accept/reject staging.
- [x] **FR-13 & FR-14: Versioning, Publishing & Unpublishing**:
  - Custom public slug assignment with regex validation (`^[a-z0-9]+(?:-[a-z0-9]+)*$`) and collision checks.
  - Public route `/sites/{slug}` accessible without authentication.
  - Unpublishing endpoint (`POST /projects/{project}/unpublish`) resetting status to draft and immediately disabling public access (404).
  - Dynamic public site layout honoring user-defined section order and hidden flags.

---

### Category 2: Locally Tested (Automated Suite)
- **60 Feature & Unit Tests (221 assertions) passing with 0 failures**:
  - `EvidenceAndFactTest`:
    - PDF text stream extraction.
    - Scanned PDF detection.
    - Safe file upload and storage with project association.
    - Document processing rejection of disallowed file types (`malicious.exe`).
    - Project intake validation rejecting disallowed file extensions (`malicious.sh`).
    - SSRF firewall blocking private IPs, loopback, and metadata endpoints.
    - Intake fact synchronization.
    - Automated conflict detection and resolution.
    - Owner-authorized evidence deletion with storage cleanup and cascade fact deletion.
    - Business identity disambiguation in same locality.
    - Conflict resolution with custom edited values.
  - `GeminiIntegrationTest`:
    - Safe handling of unconfigured API key (returns null / deterministic fallback).
    - Grounded copy generation from confirmed facts.
    - Non-grounded phone hallucination stripping.
    - Section-specific regeneration with custom user prompt.
  - `WebsiteGenerationAndEditorTest`:
    - Omission of unconfirmed contact and schedule details.
    - Multi-user tenant isolation across resolve, regenerate, publish, unpublish, and evidence delete endpoints.
    - Public website accessibility without authentication.
    - Unpublished website returning 404.
    - Section updates persistence and unpublishing lifecycle.
  - Core Auth & Profile Suites:
    - Registration, Login, Password Reset, Email Verification, Profile Update.
  - Production Nginx context validation:
    - `NginxConfigContextTest` confirming valid `events` and `http { ... server { ... } }` hierarchy.

---

### Category 3: Mock-Tested
- **Google Gemini API**:
  - Mocked in automated test suites (`GeminiIntegrationTest`, `WebsiteGenerationAndEditorTest`) using `Http::fake` and PHPUnit mocks to ensure deterministic, zero-network test execution.
  - Real integration verified against the official Google Generative Language API v1beta specification (`models/{model}:generateContent`).
- **External Web Scraping**:
  - Mocked with safe mock data and DNS validation checks to prevent unpredictable external network failures during testing.

---

### Category 4: Deployed to Production (Render + Supabase)
- **Live URL**: `https://verityweb.onrender.com`
- **Container Pipeline**: Dockerfile (PHP 8.3 + Node 20 + Nginx + Supervisord).
- **Automated Startup Hook**: `docker/entrypoint.sh` executes `php artisan migrate --force`, cache warming, and dynamic `$PORT` substitution.
- **Database**: Supabase PostgreSQL with pooled connections, session/cache tables, and new `business_evidences` and `business_facts` migrations.
- **SSL / Reverse Proxy Termination**: Configured with `$middleware->trustProxies(at: '*')`, `URL::forceScheme('https')`, and Nginx `$fastcgi_https` header mapping.

---

### Category 5: Not Yet Live-Verified (Requires Production User Run)
- [ ] End-to-end user session creating a live business on `verityweb.onrender.com` with real Gemini API key and validating live Gemini copywriting in Render container logs.
- [ ] Verification of real PDF upload on production with subsequent public site publication on live Render URL.
- [ ] Confirmation that manual live production testing is intentionally pending user authorization.

---

## 2. Accurate Claims, Boundaries & Technical Limitations

1. **OCR Boundaries**:
   - Pure-PHP PDF stream extraction decompresses and parses digital font and text operator streams (`BT ... ET`, `Tj`, `TJ`). It does **not** execute optical character recognition on scanned pixel raster images.
   - When a PDF is scanned or image-only, the system detects this (`is_scanned: true`), flags the evidence as `scanned_needs_ocr`, and prompts the user to enter and confirm their business schedule and details directly during review.
2. **Image Processing Boundaries**:
   - The engine validates image uploads (JPEG, PNG, WEBP) and extracts dimensional metadata (`width`, `height`, `channels` via `getimagesize`). It does not run automated image background removal, vectorization, or computer-vision object recognition.
3. **Render Web Service Ephemeral Disk Storage**:
   - Standard Render web services run on ephemeral container filesystems. Physical binary uploads saved in `storage/app/private/evidence/` will reset upon container redeployments unless a Render Persistent Disk is attached.
   - **Crucial Architecture Safeguard**: Extracted text, structured metadata, and confirmed business facts are permanently stored in the Supabase PostgreSQL database (`business_evidences.extracted_text`, `business_evidences.metadata`, `business_facts.fact_value`). Grounded generation, editing, and publishing continue to function across container restarts without data loss.
4. **Source Research & Web Scraping Scope**:
   - `SourceResearchService` safely extracts public meta tags, titles, and body text with strict SSRF defense. It does **not** solve CAPTCHAs, bypass anti-bot challenges (Cloudflare Turnstile), or access login-protected portals.
5. **Email Delivery Scope**:
   - Email verification and password resets are fully implemented and automated-tested. In default Render deployment, `MAIL_MAILER=log` writes email payloads to the application log rather than dispatching via an SMTP relay, unless an external service (Postmark/Resend/SES) credentials are configured.
6. **Gemini Live Integration & Release Gate Status**:
   - The Gemini integration has been tested via comprehensive unit and mock feature tests. The live production API key is configured on Render, but manual production verification is intentionally pending user execution.
   - The application is a **verified Release Candidate**, not proclaimed "production-verified" ahead of manual user verification.

---

## 3. Verification Commands Summary

```bash
# 1. Run full PHPUnit test suite (60 passed, 221 assertions)
php artisan test

# 2. Run TypeScript type check (0 errors)
npx tsc --noEmit

# 3. Run production Vite asset build (clean compilation)
npm run build
```
