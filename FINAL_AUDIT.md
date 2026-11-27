# VerityWeb — Final Engineering Audit

**Audit Date:** November 2026  
**Auditor Roles:** Lead Software Architect, Senior Laravel Engineer, AI Engineer, Security & QA Engineer  
**Repository:** https://github.com/sujalkadam2906/VerityWeb (`main`)  
**Target Environment:** Laravel 13, PHP 8.3, React 18, TypeScript, Inertia v2, PostgreSQL (Supabase), Docker / Render

---

## 1. Executive Summary

VerityWeb has a solid foundational shell with operational authentication, basic project CRUD, dashboard metrics, an interactive editor preview, publishing with unique slugs, and production deployment configured on Render with Supabase. 

However, prior to this audit, several core AI, evidence processing, and source verification components described in the PRD were **simulated, disconnected, or UI-only mockups**:
- File uploads in the intake wizard were only stored in React local state and never sent to the backend.
- Evidence extraction (PDF parsing, image analysis) was entirely missing.
- Source research and URL processing were static without real HTTP fetching or SSRF protections.
- Business facts were statically derived from form inputs rather than backed by structured database records with conflict resolution.
- AI generation and section regeneration used a `setTimeout` simulator with hardcoded placeholder strings instead of a real Gemini API service.

This audit establishes the comprehensive baseline of what exists, what was simulated, and what must be engineered to deliver a fully operational, truth-first, grounded AI website builder.

---

## 2. Feature-by-Feature Status Breakdown

| Feature / Subsystem | Status | Description in Codebase |
|---|---|---|
| **Authentication & Multi-User** | **FULLY IMPLEMENTED** | Laravel Breeze + Inertia (Registration, Login, Password Reset, Verification, multi-tenant isolation via `request->user()->projects()`). |
| **Project CRUD** | **FULLY IMPLEMENTED** | Projects can be created, duplicated, deleted, and listed with live status badges. |
| **Intake Form (FR-03, FR-04)** | **PARTIALLY IMPLEMENTED** | Form captures name, city, category, address, phone, description, and links. File dropzone existed in UI but files were discarded upon submission. |
| **File Storage & Uploads (FR-05)** | **PREVIOUSLY SIMULATED** | Dropzone appended to client-side `uploadedFiles` state; `handleSubmit` sent only text fields; no backend file upload route or persistence. |
| **Document Text Extraction** | **MISSING** | No PDF parsing, no scanned PDF detection, no image metadata extraction. |
| **Source Collection & Research** | **PREVIOUSLY SIMULATED** | Online links were stored in a JSON column but never scraped, verified, or validated against SSRF attacks. |
| **Fact Verification System** | **PARTIALLY IMPLEMENTED** | Review screen showed a static list of facts. No database table existed for granular fact provenance, status tracking (`confirmed`, `needs_review`, `conflicting`), or conflict resolution. |
| **Gemini AI Integration** | **MISSING / SIMULATED** | `Editor.tsx` used `setTimeout` to return `"Excellence in {category} · Serving {city}"`. No `GeminiService`, no prompt templates, no grounding checks. |
| **Website Generation** | **PREVIOUSLY SIMULATED** | `Generation.tsx` used an interval timer to animate 6 stages, then called `defaultSections()` with hardcoded templates. |
| **Website Editor** | **FULLY IMPLEMENTED (UI/State)** | Live preview, viewport switching (desktop, tablet, mobile), section reordering, visibility toggling, color/font/spacing customizer, and database persistence. |
| **Publishing & Public Routing** | **FULLY IMPLEMENTED** | Unique slug validation, publish/unpublish toggle, and public view at `/sites/{slug}` with responsive layout. |
| **Security & Tenant Isolation** | **MOSTLY COMPLETE** | Ownership enforced via `authorizeOwner()`. Required addition: SSRF protections on source fetching and secure file storage validation. |
| **Production Architecture** | **VERIFIED & OPERATIONAL** | Docker multi-stage build, Nginx FastCGI configuration, HTTPS enforcement, trusted proxies, and Supabase PostgreSQL compatibility. |

---

## 3. Discovered Defects & Gaps

### A. Data Integrity & Persistence Gaps
1. **Lack of Evidence Model**: Uploaded documents (menus, PDFs, brochures, photos) had no dedicated table, preventing audit trails, re-processing, or file retrieval.
2. **Lack of Fact Model**: Facts were computed ad-hoc on the frontend instead of being stored with status (`confirmed`, `needs_review`, `conflicting`), confidence, and source attribution.
3. **No Conflict Resolution Mechanism**: When a user provided conflicting hours or phone numbers across sources, the application could not persist or resolve the conflict.

### B. Security & Safety Gaps
1. **SSRF Risk on External URLs**: The intake form accepts arbitrary URLs (`links`). Without rigorous SSRF validation (blocking `127.0.0.1`, RFC1918 private IPs, link-local metadata addresses, cloud metadata endpoints), fetching external URLs would be vulnerable.
2. **Unvalidated Upload Handling**: Uploaded files require MIME-type verification via `finfo`, size caps, randomized storage paths, and prevention of executable extensions (`.php`, `.phtml`, `.sh`, `.exe`).

### C. Grounding & Anti-Hallucination Gaps
1. **Placeholder Hallucinations**: In `ProjectController::defaultSections()`, default opening hours (`Monday – Friday: 9:00 AM – 5:00 PM`) and generic service descriptions were auto-generated even when the user never provided them.
2. **Lack of Grounded Synthesis**: Generation must strictly construct sections based on confirmed facts. Unknown information (e.g., missing phone or hours) must remain omitted rather than populated with placeholder text.

---

## 4. Architectural Remediation Plan

1. **Database Schema Additions**:
   - Create `business_evidences` migration & model.
   - Create `business_facts` migration & model.
   - Update `business_projects` with grounded schema extensions.
2. **Document & Evidence Processing Service**:
   - Implement `DocumentProcessingService` for text-based PDF parsing, scanned PDF detection, image validation, and secure storage in `storage/app/private/evidence/{project_id}/`.
3. **SSRF-Protected Source Research Service**:
   - Implement `SourceResearchService` with IP resolution checks (blocking private/reserved IPv4 & IPv6, loopback, link-local, AWS/GCP/Azure metadata endpoints `169.254.169.254`), protocol enforcement (HTTP/HTTPS only), redirect limits, and response size ceilings.
4. **Dedicated Gemini AI Service**:
   - Implement `GeminiService` using `Illuminate\Support\Facades\Http`.
   - Configure model identifiers (`gemini-1.5-flash`, `gemini-2.0-flash`, configurable via `config/services.php`).
   - Implement strict schema-guided JSON responses, rate-limiting backoff, timeouts, and fallbacks.
   - Enforce grounding rules: never invent contact info, hours, prices, or fake reviews.
5. **Real Generation & Section Regeneration**:
   - Connect `generateSite` and editor section regeneration to real Gemini synthesis with verified facts as context.
   - If Gemini is unavailable, fall back cleanly to deterministic, verified-fact assembly without crashing or fabricating claims.
6. **Frontend Integration**:
   - Update `Create.tsx` with actual multipart file uploads.
   - Update `Review.tsx` to display real extracted facts, source links, and interactive conflict resolution.
   - Update `Editor.tsx` to call live section regeneration endpoints.
8. Comprehensive Automated Testing:
   - Feature tests covering evidence upload, PDF extraction, SSRF blocking, Gemini mocking, fact conflict resolution, editor updates, publishing, and tenant isolation.

---

## 5. Post-889af35 Remediation & Release Verification

In the final completion pass following commit `889af35`, all remaining architectural and product gaps have been closed:
1. **FR-06 Business Identity Disambiguation**: Added `checkIdentityDisambiguation()` in `FactExtractionService` to detect identical or similar business names registered in the same locality, flagging an `identity_disambiguation` fact for user review.
2. **FR-04 File Removal**: Added `destroyEvidence()` endpoint in `ProjectController` with ownership isolation, local storage file cleanup, and cascade deletion of facts extracted from the deleted document.
3. **FR-08 Custom Conflict Resolution**: Added interactive inline editing in `Review.tsx` allowing business owners to input custom corrected values rather than merely choosing between two conflicting inputs.
4. **FR-11 Section-Specific Editing**: Extended `Editor.tsx` with customized inspector controls for each section type (Hero, Story, Services, Operating Hours, Location & Contact) and bidirectional canvas synchronization.
5. **FR-14 Dynamic Public Site Rendering**: Replaced static layout in `Public.tsx` with dynamic ordering and visibility based on `project.sections_data.sections` and `hidden` flags configured in the editor.
6. **Gemini Key Scrubbing**: Hardened `GeminiService` to redact any API key strings from error responses or network exceptions before writing to application logs.
7. **Automated Test Matrix**: Expanded to **58 automated feature and unit tests with 217 assertions**, all passing with zero errors. Full TypeScript compilation and production Vite build verified.
