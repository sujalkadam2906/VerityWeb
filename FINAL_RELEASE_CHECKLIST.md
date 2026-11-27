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
  - Strict JSON schema enforcement via Google Gemini API (`gemini-2.5-flash` / `gemini-1.5-flash`).
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
- **58 Feature & Unit Tests (217 assertions) passing with 0 failures**:
  - `EvidenceAndFactTest`:
    - PDF text stream extraction.
    - Scanned PDF detection.
    - Safe upload storage and project association.
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

---

## 2. Known Limitations & Architecture Constraints

1. **Render Web Service Ephemeral Disk Storage**:
   - **Constraint**: Standard Render web services run in ephemeral Docker containers. If the service restarts or redeploys, files saved to the local filesystem (`storage/app/private/evidence/`) are reset unless a persistent Render Disk is mounted.
   - **Mitigation Implemented**: VerityWeb extracts all critical text and structured metadata into the persistent Supabase database (`business_evidences.extracted_text`, `business_evidences.metadata`, `business_facts.fact_value`) immediately during intake. Fact verification, AI generation, and website rendering remain 100% operational across restarts. For permanent binary file archiving (e.g. original PDF downloads), an S3/R2 storage adapter (`league/flysystem-aws-s3-v3`) can be configured.
2. **Scanned PDF / Image-Only Menus (OCR)**:
   - **Constraint**: Pure-PHP PDF stream extraction parses digital text objects (`BT ... ET`, `Tj`, `TJ`). Image-only scanned PDFs have no font/text streams.
   - **Mitigation Implemented**: The engine detects scanned PDFs (`is_scanned: true`), flags them as `scanned_needs_ocr`, and alerts the user to confirm their business schedule and details manually during review.
3. **Gemini API Rate Limiting (Free Tier)**:
   - **Constraint**: Google AI Studio free tier enforces rate limits (e.g., 15 RPM).
   - **Mitigation Implemented**: `GeminiService` implements exponential backoff on 429/503 responses and seamlessly falls back to the deterministic generation engine so user workflows never crash.

---

## 3. Verification Commands Summary

```bash
# 1. Run full PHPUnit test suite (58 passed, 217 assertions)
php artisan test

# 2. Run TypeScript type check (0 errors)
npx tsc --noEmit

# 3. Run production Vite asset build (clean compilation)
npm run build
```
