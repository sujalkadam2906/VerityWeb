# VerityWeb — Final Implementation Plan

**Execution Horizon:** Autonomous End-to-End Implementation & Verification  
**Primary Principle:** "Never invent business facts. Grounded, verified, production-ready."

---

## 1. Execution Phases & Milestones

### Phase 1: Database Schema & Models
- Create migration for `business_evidences`:
  - Columns: `id`, `business_project_id`, `file_path`, `file_name`, `file_type`, `file_size`, `mime_type`, `source_url`, `extracted_text`, `status`, `metadata`, `timestamps`.
- Create migration for `business_facts`:
  - Columns: `id`, `business_project_id`, `business_evidence_id`, `fact_type`, `fact_key`, `fact_value`, `source_label`, `status`, `confidence`, `conflict_with_id`, `conflict_explanation`, `user_confirmed`, `timestamps`.
- Create Eloquent models `BusinessEvidence` and `BusinessFact` with relations on `BusinessProject`.

### Phase 2: Document Processing & Evidence Extraction Service
- Build `app/Services/DocumentProcessingService.php`:
  - Handle safe file upload storage under `storage/app/private/evidence/{project_id}/`.
  - Validate file extension, MIME types (PDF, JPEG, PNG, WEBP), and maximum size (10MB).
  - Implement native pure-PHP text extraction for text-based PDFs (decompression, text stream tokenization).
  - Detect scanned PDFs lacking text streams and flag as `scanned_needs_ocr`.
  - Extract metadata from images (dimensions, type) and prepare inline image buffers for multimodal Gemini inspection.

### Phase 3: SSRF-Protected Business Source Research Service
- Build `app/Services/SourceResearchService.php`:
  - URL normalization and scheme validation (HTTP/HTTPS only).
  - Pre-request DNS resolution checks:
    - Block private IP ranges (RFC 1918: `10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`).
    - Block loopback (`127.0.0.0/8`, `::1`).
    - Block link-local and cloud metadata (`169.254.169.254`, `fe80::/10`).
    - Block multicast and reserved blocks.
  - Safe HTTP fetching with strict 5-second timeouts, maximum 2MB response size cap, user-agent identification, and redirect validation.
  - Extract meta titles, descriptions, and plain text content from target business websites.

### Phase 4: Fact Extraction & Conflict Verification Engine
- Build `app/Services/FactExtractionService.php`:
  - Extract structured facts from user intake fields, uploaded documents, and researched web sources.
  - Detect conflicts (e.g., mismatched telephone numbers, differing operating schedules, divergent addresses).
  - Tag facts with appropriate statuses: `confirmed`, `needs_review`, `conflicting`, `unverified`.
  - Provide resolution methods for users to confirm, reject, or edit individual facts.

### Phase 5: Real Gemini AI Service
- Update `config/services.php` with `gemini` configuration:
  - `api_key` => `env('GEMINI_API_KEY')`
  - `model` => `env('GEMINI_MODEL', 'gemini-1.5-flash')`
  - `timeout` => 30
- Build `app/Services/GeminiService.php`:
  - API call using Laravel's `Http::withHeaders()` to Google Generative Language API v1beta.
  - Structured JSON response mode with strict schema guidance.
  - Retry logic with exponential backoff for transient 429/503 errors.
  - Multimodal support: pass base64 image and PDF data when present.
  - Strict Grounding Rules in system instructions:
    - Never invent phone numbers, addresses, hours, prices, certifications, or reviews.
    - If a detail is missing from provided facts, leave it omitted.
  - Graceful degradation: if Gemini is unavailable, unconfigured, or quota exhausted, fall back seamlessly to deterministic, verified-fact layout assembly.

### Phase 6: Grounded Website Generation & Section Regeneration
- Build `app/Services/WebsiteGenerationService.php`:
  - Synthesize responsive sections dynamically according to available verified facts:
    - Hero (Always present, grounded in name, category, and city).
    - Story / About (Synthesized from owner description and verified background).
    - Services (Only verified services; never fabricated items).
    - Operating Hours (Only if verified/confirmed by owner).
    - Location & Contact (Only if address/phone is verified; never invent numbers).
    - FAQ (Only grounded questions based on verified business details).
  - Section Regeneration endpoint: Allows regenerating individual sections (e.g., Hero headline, About story, Service descriptions) using Gemini with user prompts.

### Phase 7: Controller & Route Integration
- Update `ProjectController`:
  - Update `store` to accept multipart file uploads and process evidence.
  - Update `review` to pass real structured facts and conflicts to `Review.tsx`.
  - Implement `resolveConflict` / `updateFact` endpoints.
  - Update `generateSite` to call `WebsiteGenerationService`.
  - Add `regenerateSection` endpoint for the live editor.

### Phase 8: Frontend Upgrades
- `Create.tsx`: Upgrade to real FormData file upload with progress and file validation error display.
- `Review.tsx`: Wire interactive fact confirmation, conflict resolution cards, and source link previews.
- `Generation.tsx`: Display real synthesis status and handle generation errors gracefully.
- `Editor.tsx`: Connect the AI "Regenerate" button to the real `regenerateSection` backend endpoint.

### Phase 9: Comprehensive Automated Testing & Security Review
- Create `tests/Feature/EvidenceAndFactTest.php`:
  - Tests PDF text extraction.
  - Tests image upload and file restrictions.
  - Tests SSRF blocker against internal IPs and metadata endpoints.
  - Tests fact conflict detection and resolution.
- Create `tests/Feature/GeminiIntegrationTest.php`:
  - Tests Gemini service response handling (mocked).
  - Tests Gemini timeout and rate-limit backoff.
  - Tests graceful fallback when `GEMINI_API_KEY` is null.
  - Tests anti-hallucination grounding (rejecting fabricated phone/reviews).
- Create `tests/Feature/WebsiteGenerationAndEditorTest.php`:
  - Tests full generation with verified facts.
  - Tests single-section regeneration endpoint.
  - Tests editor updates, publishing, and unpublishing.
  - Tests multi-user isolation across all new endpoints.

### Phase 10: Deliverables, Documentation & Git Push
- Create `FINAL_TEST_REPORT.md`.
- Create `FINAL_SECURITY_REPORT.md`.
- Create `FINAL_DEPLOYMENT_GUIDE.md`.
- Update `.env.example`.
- Run all tests and Vite build.
- Commit and push to `origin main`.
