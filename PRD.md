# VerityWeb — Product Requirements Document (PRD)

**Version:** 1.0  
**Status:** MVP Development Specification  
**Product Category:** AI-Powered Website Builder  
**Target Platform:** Web Application  
**Primary Technology:** Laravel, React, TypeScript, MySQL

---

# 1. Product Overview

## 1.1 Product Name

**VerityWeb**

## 1.2 Product Vision

VerityWeb enables business owners to transform scattered business information into professional, editable and publishable websites using AI.

Business owners may provide their information through text, links, social media profiles, Google Business listings, PDFs, price lists, menus, photographs and other documents.

VerityWeb collects, researches, extracts, verifies and organizes this information before using AI to generate a website.

The generated website can be previewed, edited, selectively regenerated and published to a public URL.

## 1.3 Problem Statement

Many small and local businesses lack a professional website because:

- Website development is expensive.
- Business owners lack technical knowledge.
- Their business information is scattered across social media, documents and online listings.
- Website builders require time and design knowledge.
- Existing AI website generators may invent business details.
- Updating websites after creation can be difficult.

VerityWeb addresses these problems by automating information collection, research, verification, website generation and publishing.

## 1.4 Product Objective

Enable a non-technical business owner to create a professional website using their existing business information with minimal manual effort.

The application must prioritize:

1. Accuracy
2. Ease of use
3. Professional website quality
4. Editability
5. Reliability
6. Transparency
7. Safe publishing

---

# 2. Target Users

## Primary User — Small Business Owner

Examples:

- Restaurants and cafés
- Salons and barbers
- Clinics
- Local shops
- Consultants
- Fitness businesses
- Repair services
- Freelancers
- Small service businesses

Characteristics:

- Limited technical knowledge
- No dedicated web development team
- Existing business information may be scattered
- Wants a website quickly
- Prefers minimal manual design work

## Secondary User — Independent Professional

Examples:

- Freelancers
- Coaches
- Consultants
- Independent service providers

Needs:

- Professional portfolio or business website
- Services and contact information
- Simple editing
- Fast publishing

---

# 3. Core User Journey

1. User creates an account or enters the application.
2. User creates a new website project.
3. User provides business identity information.
4. User adds social media links, Google Business listing or existing website.
5. User uploads files and images.
6. Application processes available sources.
7. Application extracts business facts.
8. Application detects duplicate business identities, missing information and conflicting facts.
9. User reviews and resolves uncertainties.
10. AI generates the website.
11. User previews the website.
12. User edits content, layout, images or sections.
13. User regenerates individual sections using AI.
14. User publishes the website.
15. Website becomes accessible through a public URL.

---

# 4. Functional Requirements

## FR-01: Authentication and User Management

Users must be able to:

- Register
- Log in
- Log out
- Reset passwords
- Access only their own projects and businesses

Business data must be isolated between users.

## FR-02: Project Dashboard

The dashboard must provide:

- Project overview
- Website project cards
- Business name
- Website thumbnail or preview
- Current project status
- Last updated date
- Published/draft status
- Create website button
- Recent activity
- Empty state for new users

Project statuses may include:

- Draft
- Collecting information
- Researching
- Needs review
- Generating
- Ready to edit
- Published
- Failed

## FR-03: Business Information Collection

Users must be able to enter any combination of:

- Business name
- City
- Address
- Business category
- Description
- Phone number
- Email
- Existing website
- Instagram
- Facebook
- Other social media links
- Google Business listing URL

The application must support incomplete information.

Users must not be forced to provide every field before proceeding.

## FR-04: File Uploads

Supported initial file types:

- PDF
- JPG
- JPEG
- PNG
- WebP

Use cases:

- Menus
- Price lists
- Business brochures
- Logos
- Product photographs
- Service photographs
- Business documents

Requirements:

- File validation
- File-size limits
- Upload progress
- File status
- Processing status
- Error reporting
- Secure storage
- Ability to remove uploaded files

Unsupported or corrupted files must fail gracefully.

## FR-05: Source Discovery and Research

The application must attempt to discover relevant public information using:

- User-provided URLs
- Search engine/provider APIs
- Existing websites
- Social media links where accessible
- Google Business listing information where accessible
- Uploaded documents

The application must:

- Record source URLs
- Record source types
- Record retrieval time
- Record source processing status
- Preserve extracted information
- Identify inaccessible sources
- Avoid repeatedly retrying blocked sources
- Continue processing other available sources when one source fails

The system must not claim a source was verified when it was inaccessible.

## FR-06: Business Identity Resolution

The application must avoid confusing businesses with identical or similar names.

Identity matching may consider:

- Business name
- City
- Address
- Phone number
- Website
- Social handles
- Business category

When identity is uncertain, the application must display possible matches and ask the user to select the correct business.

Information from different businesses must never be silently merged.

## FR-07: Fact Extraction

The AI must extract structured business facts from available sources.

Examples:

- Business name
- Address
- Phone number
- Email
- Business category
- Description
- Services
- Products
- Pricing
- Opening hours
- Social media links
- Images
- Service areas

Each fact must include:

- Extracted value
- Source reference
- Source type
- Confidence or evidence quality
- Verification status
- Extraction timestamp

## FR-08: Fact Verification and Conflict Resolution

The system must detect:

- Conflicting phone numbers
- Conflicting addresses
- Conflicting business hours
- Conflicting prices
- Conflicting business descriptions
- Duplicate businesses
- Missing critical information
- Unsupported claims

Fact statuses:

- Verified
- User confirmed
- Uncertain
- Conflicting
- Unavailable

When sources disagree, the system must:

1. Preserve conflicting source values.
2. Display the values and their sources.
3. Ask the business owner to select or correct the appropriate value.
4. Save the decision.
5. Use the approved value during website generation.

The system must not silently select a conflicting value.

## FR-09: AI Website Generation

The AI must generate a website using verified or user-confirmed information.

Generation may include:

- Website structure
- Hero section
- About section
- Services section
- Products section where relevant
- Gallery
- Contact section
- Location information
- Footer
- Theme and visual style
- Responsive layout

The system must select suitable sections based on the business type and available information.

The website must not contain unsupported:

- Business claims
- Awards
- Certifications
- Reviews
- Prices
- Opening hours
- Addresses
- Contact information
- Service areas
- Guarantees

When required information is missing, the application must omit it or ask the user.

## FR-10: Website Preview

Users must be able to:

- Preview the generated website
- View desktop layout
- View mobile layout
- Navigate website sections
- Preview changes before publishing

## FR-11: Website Editor

Users must be able to:

- Edit text
- Edit headings
- Edit descriptions
- Change images
- Change image positioning
- Enable or disable sections
- Add supported sections
- Remove sections
- Reorder sections
- Change theme colors
- Change typography presets
- Edit contact details
- Save changes
- Preview changes

Editing must be straightforward for non-technical users.

## FR-12: Section Regeneration

Users must be able to regenerate an individual section using AI.

The regeneration process must:

- Use approved business facts
- Preserve verified information
- Respect the existing website theme
- Respect the selected section's purpose
- Avoid changing unrelated sections
- Show a loading state
- Allow users to accept or reject the result
- Preserve the original section until the new result is accepted

## FR-13: Website Versioning

The system must preserve website versions.

Requirements:

- Draft versions
- Published versions
- Version history
- Save changes
- Publish selected version
- Avoid overwriting the currently published version during editing

Changes made after publication must not affect the public website until the owner publishes again.

## FR-14: Website Publishing

Users must be able to:

- Choose or edit a website slug
- Preview the publication
- Review publication readiness
- Publish the website
- Access the generated public URL
- Copy the public URL
- Open the published website

Example URL pattern:

`https://verityweb.example/sites/business-slug`

The exact deployment domain will depend on the hosting configuration.

The public website must be accessible without authentication.

## FR-15: AI Failure Handling

If the AI service fails:

- User inputs must remain saved.
- Extracted information must remain saved.
- Existing website content must remain available.
- The application must show a clear error.
- Retry must be available.
- AI failure must not cause data loss.
- Existing published websites must remain accessible.

## FR-16: Source Failure Handling

If a source is blocked or unavailable:

- Mark it as inaccessible or failed.
- Display the failure reason when possible.
- Provide an alternative manual-input method.
- Continue processing other sources.
- Do not fabricate information from inaccessible sources.

---

# 5. Golden Rule: Fact-Grounded Generation

VerityWeb must never invent factual information about a business.

## 5.1 Information Sources

Information can come from:

- User-provided input
- User-confirmed facts
- Uploaded files
- Accessible official business websites
- Accessible business profiles
- Reliable public sources

## 5.2 AI Restrictions

AI must not:

- Invent phone numbers
- Invent addresses
- Invent prices
- Invent opening hours
- Invent awards
- Invent certifications
- Invent customer reviews
- Invent business history
- Invent service areas
- Invent guarantees
- Assume unavailable information

## 5.3 Missing Information

If the information is uncertain:

- Ask the user when important.
- Omit it when optional.
- Clearly identify it as unverified.
- Never present guesses as facts.

---

# 6. Security Requirements

## 6.1 Secrets Management

- API keys must never be committed to Git.
- Secrets must be stored in environment variables.
- `.env` must be excluded from version control.
- `.env.example` must contain placeholders only.

## 6.2 Uploaded File Security

- Validate file types.
- Validate file sizes.
- Store uploads securely.
- Prevent executable file uploads.
- Process files using controlled services.
- Treat extracted text as untrusted data.

## 6.3 Prompt Injection Protection

Instructions embedded in uploaded documents, websites, PDFs or source text must be treated as untrusted content.

Source content must never override system instructions or trigger unauthorized actions.

## 6.4 URL Fetching Security

The application must protect against SSRF.

- Allow HTTP and HTTPS only.
- Block private/internal IP ranges.
- Block localhost.
- Block cloud metadata addresses.
- Validate redirect destinations.
- Limit redirects.
- Limit response size.
- Apply request timeouts.
- Validate content types.

## 6.5 Authorization

Users must not be able to access, modify, publish or delete another user's business or website.

## 6.6 Public Website Safety

Only approved, published website versions must be publicly accessible.

Drafts must not be exposed through public URLs.

---

# 7. Non-Functional Requirements

## NFR-01: Reliability

Source failure or AI failure must not cause data loss.

## NFR-02: Performance

- User-facing pages should load efficiently.
- Long-running research and generation processes should run asynchronously.
- Progress should be displayed to users.
- File processing should not block the entire application.

## NFR-03: Usability

The application must be usable by non-technical business owners.

## NFR-04: Responsive Design

The dashboard, onboarding and editor must support desktop and tablet layouts.

Published websites must be responsive across desktop, tablet and mobile.

## NFR-05: Maintainability

The codebase should use:

- Modular services
- Laravel conventions
- Reusable React components
- Typed data structures
- Clear validation
- Automated tests
- Consistent naming

## NFR-06: Data Integrity

- Facts must preserve source provenance.
- Website versions must be preserved.
- User resolutions must be recorded.
- Published content must be reproducible.

---

# 8. Technology Stack

## Backend

- Laravel 13
- PHP 8.3+
- Laravel queues
- Laravel validation
- Laravel authentication

## Frontend

- React
- TypeScript
- Inertia.js
- Tailwind CSS
- shadcn/ui

## Database

- MySQL 8

## AI

- Gemini API
- Structured JSON outputs
- Server-side schema validation

## Processing

- PDF text extraction
- Image processing
- OCR or AI vision where appropriate
- Controlled web fetching
- Search API integration

## Storage

- Laravel Storage
- Local storage for development
- Cloud-compatible storage for production

## Testing

- PHPUnit or Pest
- Laravel feature tests
- Service unit tests
- Frontend component testing where appropriate
- Manual end-to-end testing

## Version Control

- Git
- GitHub

---

# 9. Database Entities

Initial entities:

- Users
- Businesses
- Business Sources
- Source Extractions
- Business Facts
- Fact Conflicts
- Fact Resolutions
- Website Projects
- Website Sections
- Website Assets
- Website Versions
- Generation Jobs
- Publications
- Activity Logs

Use relational tables for ownership, sources, facts, conflicts and publication records.

Use JSON columns for flexible website section content and theme configurations.

---

# 10. MVP Scope

## Must Have

- Authentication
- Dashboard
- Business creation
- Business information input
- Social and website URL input
- Google Business URL input
- File upload
- Source processing
- Research
- Fact extraction
- Source tracking
- Fact verification
- Conflict resolution
- AI website generation
- Website preview
- Section editing
- AI section regeneration
- Website versioning
- Public publishing
- MySQL persistence
- Error handling
- Security controls

## Should Have

- Responsive editor
- Mobile preview
- Image gallery management
- Theme customization
- Activity history
- Retry failed jobs
- Autosave

## Out of Scope for Initial MVP

- Paid subscriptions
- Custom domain purchasing
- Complex analytics
- Multi-tenant agency accounts
- CRM
- Advanced SEO analytics
- Unlimited template marketplace
- Full social media OAuth integrations
- Advanced drag-and-drop page builder

---

# 11. Suggested Website Section Types

The website generator may use the following predefined section types:

- Hero
- About
- Services
- Products
- Features
- Gallery
- Testimonials
- FAQ
- Location
- Contact
- Call to Action
- Footer

Sections must be selected based on the business category and available verified information.

Unsupported sections should not be generated automatically.

---

# 12. Project Milestones

## Milestone 1 — Product Design

- Finalize design system
- Dashboard
- Business intake
- Research and verification
- Website editor
- Publishing flow
- Public website design

## Milestone 2 — Foundation

- Laravel project setup
- React and TypeScript setup
- MySQL setup
- Authentication
- Git repository
- Initial application layout

## Milestone 3 — Data Layer

- Database migrations
- Models
- Relationships
- Authorization
- Project management

## Milestone 4 — Intake

- Business forms
- URL inputs
- File uploads
- Storage
- Validation

## Milestone 5 — Research

- Source discovery
- Web search
- URL processing
- PDF extraction
- Image processing
- Source status tracking

## Milestone 6 — Verification

- Fact extraction
- Provenance
- Confidence/evidence
- Duplicate detection
- Conflict detection
- User resolution

## Milestone 7 — AI Generation

- Gemini integration
- Structured output
- Website configuration
- Component rendering
- Grounding enforcement

## Milestone 8 — Editor

- Live preview
- Section management
- Editing
- Regeneration
- Autosave
- Version history

## Milestone 9 — Publishing

- Public routes
- Slugs
- Version publication
- Public rendering
- Publication management

## Milestone 10 — Quality and Deployment

- Automated tests
- Security checks
- Failure testing
- Responsive testing
- Deployment
- Documentation

---

# 13. MVP Acceptance Criteria

The MVP is complete when a user can:

1. Access the application.
2. Create a business project.
3. Enter business details.
4. Add social media, Google listing and website URLs.
5. Upload PDFs and images.
6. Research available sources.
7. View extracted business information.
8. Identify and resolve conflicting facts.
9. Generate a professional website.
10. Preview desktop and mobile layouts.
11. Edit website content.
12. Regenerate a selected section.
13. Save changes to MySQL.
14. Publish a website.
15. Access the published website without authentication.
16. Retry failed AI operations.
17. Retain their information if research or AI generation fails.
18. Avoid fabricated business facts.

---

# 14. Success Criteria

The product will be considered successful for the MVP if:

- A complete business-to-published-website flow works.
- Website content is grounded in available or user-confirmed facts.
- Users can resolve conflicting information.
- Source failures do not stop the entire workflow.
- AI failures do not result in data loss.
- Users can edit and regenerate website sections.
- Published websites work independently of the authenticated application.
- The UI is professional, consistent and responsive.
- Critical backend functionality is tested.

---

# 15. Product Principles

1. **Truth before creativity.**
2. **Simplicity before complexity.**
3. **Save before processing.**
4. **Ask instead of guessing.**
5. **Preserve sources and evidence.**
6. **Fail gracefully.**
7. **Never destroy published content during editing.**
8. **Build modularly.**
9. **Design for non-technical users.**
10. **Make the generated website genuinely useful and professional.**

---

# Final Product Definition

VerityWeb is an AI-powered website creation platform that transforms a business's existing information into a verified, editable and publishable website.

Its core workflow combines information collection, source research, fact extraction, verification, website generation, editing and publication.

Its primary differentiator is that AI-generated websites are grounded in verified business information, with transparent source tracking and user-controlled resolution of uncertainty.
