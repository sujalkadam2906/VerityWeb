# VerityWeb — Design Preferences & UI/UX Reference Guide

**Document Status:** Primary Design Reference  
**Source Reference File:** `design-preferences/AI Builds My Website – Product UI.make`  
**Application Target:** Web Application (Laravel 13, React, TypeScript, Tailwind CSS, shadcn/ui)  
**Last Updated:** November 2026

---

## 1. Executive Summary & Design Reference Role

This document establishes the official visual design system, UI tokens, interaction patterns, and user experience specifications for **VerityWeb**.

### Relationship Between PRD and Design Preferences

- **PRD (`PRD.md`)**: Defines *what* the application does — core business goals, functional requirements (FR-01 through FR-16), fact verification rules, security boundaries, non-functional requirements, data models, and acceptance criteria.
- **Design Preferences (`DESIGN_PREFERENCES.md`)**: Defines *how* the application looks and feels — visual hierarchy, layout architecture, typography, color tokens, component patterns, interaction states, and screen-by-screen UX specifications extracted directly from the verified design export (`AI Builds My Website – Product UI.make`).

> [!IMPORTANT]
> Both documents are authoritative companions. Neither replaces the other. All future frontend and UI component implementations must strictly adhere to the visual patterns defined in this guide while satisfying the functional rules in `PRD.md`.

---

## 2. Product Brand & Visual Direction

### 2.1 Brand Identity
- **Product Name:** VerityWeb
- **Tagline:** *"Your business information. A website that gets it right."*
- **Brand Personality:**
  - **Trustworthy & Truth-First:** Precision over gimmicks; evidence and citations are celebrated.
  - **Intelligent & Focused:** AI is presented as a helpful, grounded assistant rather than an unpredictable toy.
  - **Modern & Restrained:** Clean neo-grotesque typography, consistent 4px/8px rhythm, subtle 1px borders, and high contrast.
  - **Calm & Approachable:** Built specifically for non-technical small business owners who feel overwhelmed by traditional website builders.

### 2.2 Global Application Theme
- **Consistent Light Theme:** The entire application shell, dashboard, intake flow, verification studio, and editor use a cohesive, premium **light SaaS theme**.
- **No Dark Mode Fragmentation:** Individual workspaces (such as the Fact Verification Studio) must **not** switch to a dark futuristic theme. All internal workspaces belong to the same unified product.
- **Application UI vs. Generated Public Website:**
  - **VerityWeb Application UI:** Strict light SaaS aesthetic (Inter, Indigo, Slate, crisp white surfaces).
  - **Generated Business Websites:** Independent visual identity tailored to the specific business category (e.g., Warm Artisan Café with DM Serif Display and earthy tones, Bold Fitness Studio with dynamic accents, or Clean Dental Clinic with medical teal).

---

## 3. Design Tokens & Color Palette

### 3.1 Global Application Color Tokens

| Token Name | Hex Code | Role & Usage |
| :--- | :--- | :--- |
| **Canvas Background** | `#F7F8FA` | Global application page background behind cards and sidebars |
| **Primary Surface** | `#FFFFFF` | Cards, side panels, table rows, modal dialogs, input fills |
| **Secondary Surface** | `#F8FAFC` / `#F1F5F9` | Table header bars, active hover states, empty state containers |
| **Primary Text** | `#172033` | Page titles, section headings, active labels, primary values |
| **Secondary Text** | `#667085` / `#64748B` | Subheadings, field descriptions, timestamps, source attribution |
| **Muted Text / Placeholder** | `#94A3B8` | Input placeholders, breadcrumb dividers, disabled indicators |
| **Border / Divider** | `#E5E7EB` (Slate-200) | 1px clean borders on cards, inputs, tabs, dividers |
| **Primary Accent (Indigo)** | `#4F46E5` (Indigo-600) | Primary CTA buttons, focused rings, active tab underline, brand icon |
| **Subtle Accent Background** | `#EEF2FF` (Indigo-50) | Selected list items, active sidebar row, drag-and-drop dropzones |
| **Verified / Success** | `#16A34A` (Emerald-600) | Verified fact badges, completed extraction badges, success checkmarks |
| **Verified Subtle Background** | `#F0FDF4` (Emerald-50) | Background for verified status badges and resolved conflict alerts |
| **Conflict / Attention** | `#D97706` (Amber-500/600) | Unresolved conflict cards, "Needs review" badges, attention callouts |
| **Conflict Subtle Background**| `#FEF3C7` (Amber-50) | Background for conflict warning boxes and review tab indicators |
| **Destructive / Error** | `#DC2626` (Red-600) | Validation error text, project delete actions, broken source flags |

### 3.2 Semantic Color Usage Rules
- **Indigo (`#4F46E5`)**: Reserved for user actions, primary navigation, focus states, and the VerityWeb shield brand mark. Never used as decorative background wash.
- **Emerald (`#16A34A`)**: Strictly communicates factual verification, source validation, or completed processing.
- **Amber (`#D97706`)**: Strictly communicates discrepancy, conflicting facts across sources, or missing required business details.
- **Red (`#DC2626`)**: Strictly reserved for actual system errors, failed source scrapes, or destructive confirmations.

---

## 4. Typography System

### 4.1 Application UI Font Stack
- **Primary Font Family:** `'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif`
- **Font Weights:**
  - Regular (`400`): Explanatory copy, long descriptions, metadata
  - Medium (`500`): Field labels, button text, table cell values, navigation items
  - Semi-Bold (`600`): Headings, card titles, status badges, metric counters

### 4.2 Application Typographic Scale
- **Display / Hero Titles (Dashboard & Studio):** `30px` (`text-3xl`), font-weight 600, line-height 1.25, tracking `-0.02em`
- **Modal & Major Section Headings:** `24px` (`text-2xl`), font-weight 600, line-height 1.3
- **Card Titles & Subsection Headings:** `18px`–`20px` (`text-lg` / `text-xl`), font-weight 600
- **Standard Body & Form Labels:** `14px` (`text-sm`), font-weight 500 (labels) / 400 (body), line-height 1.5
- **Secondary Metadata, Badges & Footnotes:** `12px` (`text-xs`), font-weight 500 (badges) / 400 (timestamps)

### 4.3 Generated Website Typography (Independent Presets)
The website builder provides 3 distinct font pairing presets for the client's public site:
1. **Editorial Preset (Default for hospitality/cafés/studios):**
   - Headings: `'DM Serif Display', Georgia, serif`
   - Body: `'Inter', sans-serif`
2. **Modern Preset (Default for technology/consulting/services):**
   - Headings: `'Inter', sans-serif` (Bold tracking-tight)
   - Body: `'Inter', sans-serif`
3. **Classic Preset (Default for dental/medical/legal/clinics):**
   - Headings: `'Georgia', serif`
   - Body: `'Inter', sans-serif`

---

## 5. Layout & Spacing Principles

### 5.1 Spacing Grid
- Built strictly on a **4px / 8px scale** (`gap-2` = 8px, `p-3` = 12px, `p-4` = 16px, `p-5` = 20px, `p-6` = 24px, `py-8` = 32px, `py-10` = 40px).
- **Minimum Touch / Click Target:** All interactive controls (buttons, inputs, select triggers, navigation rows) must maintain a minimum height of **44px (`min-h-11`)** for accessibility and touch reliability.

### 5.2 Application Shell Architecture
- **Desktop Layout (≥ 768px):**
  - **Fixed Left Sidebar:** `w-60` (240px width), `border-r border-slate-200 bg-white`, full viewport height (`inset-y-0`).
  - **Main Content Canvas:** Pushed by sidebar (`md:ml-60`), centered container with `max-w-[1440px] px-5 py-8 lg:px-10 lg:py-10`.
  - **Header Bar:** Height `h-20` (80px), `border-b border-slate-200 bg-white`, containing breadcrumb trail, environment status pill, and notifications.
- **Mobile / Tablet Layout (< 768px):**
  - Sidebar collapses into a horizontal top navigation bar (`min-h-14`) with horizontal scrollable tabs and prominent touch targets.

---

## 6. Component Styling Specifications

### 6.1 Buttons
- **Primary Button:**
  ```css
  min-h-11 px-4 rounded-lg bg-indigo-600 text-white text-sm font-medium
  shadow-sm hover:bg-indigo-700 focus-visible:ring-2 focus-visible:ring-indigo-500
  focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60
  inline-flex items-center justify-center gap-2
  ```
- **Secondary Button:**
  ```css
  min-h-11 px-4 rounded-lg border border-slate-200 bg-white text-slate-700
  text-sm font-medium hover:bg-slate-50 focus-visible:ring-2
  focus-visible:ring-indigo-500 inline-flex items-center justify-center gap-2
  ```
- **Quiet / Ghost Button:**
  ```css
  min-h-11 px-3 rounded-lg text-sm text-slate-600 hover:bg-slate-100
  focus-visible:ring-2 focus-visible:ring-indigo-500 inline-flex items-center gap-2
  ```

### 6.2 Cards & Surfaces
- Surfaces: Solid white (`#FFFFFF`) with `1px border border-slate-200`.
- Corner Radius: `rounded-lg` (8px–12px). Avoid exaggerated pill or oversized radiuses on containers.
- Shadows: Minimal to none (`shadow-sm`). Depth is established through 1px border contrast against the `#F7F8FA` background.
- Nesting: **Never nest cards inside cards inside cards.** Group related items using subtle border dividers (`border-t border-slate-100`) rather than sub-card containers.

### 6.3 Form Inputs & Select Triggers
- Standard Input Class:
  ```css
  min-h-11 w-full rounded-lg border border-slate-200 bg-white px-3
  text-sm text-slate-900 placeholder:text-slate-400 outline-none
  focus-visible:ring-2 focus-visible:ring-indigo-500
  ```
- Form Labels: `text-sm font-medium text-slate-700 mb-2 block`. Optional markers styled as `text-xs font-normal text-slate-500`.

### 6.4 Status Badges
Status indicators use pill badges with an active circular indicator dot:
- **Verified / Published:** `bg-emerald-50 text-emerald-700 rounded-md px-2 py-1 text-xs font-medium` with a 6px `bg-emerald-600` dot.
- **Needs Review:** `bg-amber-50 text-amber-800 rounded-md px-2 py-1 text-xs font-medium` with a 6px `bg-amber-500` dot.
- **Draft / Processing / Unavailable:** `bg-slate-100 text-slate-600 rounded-md px-2 py-1 text-xs font-medium` with a 6px `bg-slate-500` dot.

### 6.5 Iconography
- Consistent 20x20px (`h-5 w-5`) or 16x16px (`h-4 w-4`) stroke icons.
- Stroke width: `1.6px`, linecap round, linejoin round. Lucide icon set (shield, globe, spark, file, upload, clock, eye, settings, check, search, link).

---

## 7. Detailed Screen Specifications

### 7.1 Dashboard (`Overview` / `My Websites`)
- **Header:** Workspace switcher ("Jamie Lawson · Personal workspace"), breadcrumb trail, and user profile avatar.
- **Top Metrics Bar:** 3-column data list separated by subtle vertical borders:
  1. *Total websites* (Number counter)
  2. *Published* (Live count)
  3. *Needs review* (Actionable pending items)
- **Filter Bar & Search:** Status filter tablist (`All websites`, `Published`, `Draft`, `Needs review`) alongside an inline search input with a search icon.
- **Project Cards Grid:** 3-column responsive grid (`grid gap-6 xl:grid-cols-3 sm:max-md:grid-cols-2 lg:grid-cols-2`):
  - Card Header: Live iframe/rendered website thumbnail preview (`Thumbnail` component).
  - Card Body: Business Name, Category subtitle, Status Badge, "Updated X time ago" metadata.
  - Card Actions: Contextual primary action ("Review information" for *Needs review*, "Continue editing" for *Published*, "Continue building" for *Draft*) + 3-dots dropdown menu for *Duplicate* and *Delete*.
- **Empty State:** Dashed border container (`border-dashed border-slate-300 bg-white p-12 text-center`), globe icon in indigo, clear title, and prominent "Create your first website" CTA.
- **Activity Log:** Chronological table listing recent events with status icons, descriptions, and relative timestamps.

### 7.2 Business Intake Wizard (`Create Website`)
- **Progress Stepper:** 4-step linear header with numbered circular indicators connected by border lines:
  - Step 1: *Business identity*
  - Step 2: *Online presence*
  - Step 3: *Upload files*
  - Step 4: *Review*
- **Step 1 (Identity):** Required Business Name and City; optional Address, Category, and Short Description.
- **Step 2 (Online Presence):** URL input fields for Existing Website, Google Business Listing, Instagram, and "+ Add another source" button. Real-time URL format validation (`https://`).
- **Step 3 (Upload Files):** Large drag-and-drop zone (`min-h-56`) with dashed indigo border (`border-2 border-dashed border-indigo-200 bg-indigo-50/40`), upload icon, supported formats badge (`PDF, JPG, PNG, WebP`), and file listing cards with file size and remove buttons.
- **Step 4 (Review):** Card summaries for identity, online sources, and uploaded documents with quick "Edit" jumps.
- **Bottom Navigation Bar:** "Back" button, trust indicator ("Your information stays in your control"), and "Continue" / "Start research" primary CTA. "Save draft and exit" option.

### 7.3 Fact Verification & Conflict Resolution Studio (`Research`)
*This is the core differentiator of VerityWeb.*
- **Top Readiness Banner:** Shows facts tally (`X facts found`, `Y ready to use`, `Z conflict needs your input`), confidence status, and "Generate my website" primary CTA (disabled until all conflicts are resolved).
- **Two-Column Split Layout:**
  - **Left Column (Detected Business Facts):**
    - Filter tabs: `All facts`, `Verified`, `Needs review` (with badge counter for conflicts).
    - Structured Fact Table: Grid layout with column headers (`Fact`, `Value & source`, `Status`). Each fact displays its value, a clickable citation badge linking to the source, and a verification status badge.
    - **Conflict Resolution Card:** High-visibility amber-bordered card (`border-amber-200 bg-white`). Displays the conflicting field (e.g., "Weekend hours"), an explanation of the discrepancy, and a side-by-side radio option selector comparing Source A (e.g., Google Business: 10 AM – 10 PM) vs. Source B (e.g., Instagram: 11 AM – 9 PM), plus a radio option to "Enter different custom hours". Includes a "Confirm information" button that locks the user's decision.
    - Optional Missing Information Prompt: Friendly prompt offering to fill optional missing details (e.g., weekday hours) without blocking generation.
  - **Right Column (Sources & Evidence Library):**
    - Source library card listing all discovered and uploaded sources (PDFs, menus, Google Business, Instagram, websites).
    - Source status: Extraction progress ring/bar (`100% processed` vs. `Processing`), source type tag, and expandable "View details" drawer revealing extracted raw text snippets.
    - Drag-and-drop "Add a file" dashed target to attach additional evidence directly during verification.

### 7.4 Generation Progress Screen (`Generation`)
- Visual transition screen with animated progress steps:
  1. *Organizing verified information*
  2. *Choosing website structure*
  3. *Writing website content*
  4. *Creating page sections*
  5. *Applying visual design*
  6. *Preparing preview*
- Side-by-side layout pairing the checklist with a large preview card of the generated layout. Transitions to the Website Editor upon completion.

### 7.5 Website Editor & Live Canvas (`Editor`)
- **Top Utility Header:**
  - Project name and save status indicator (`✓ Saved on this device` / `Unsaved changes`).
  - Undo/Redo button (`↶`).
  - Viewport Switcher: Segmented control toggling `Desktop` (1024px+), `Tablet` (max-w-xl), and `Mobile` (max-w-sm).
  - Mode Controls: "Preview" toggle and primary "Publish" CTA.
- **Integrated AI Section Prompt Bar:**
  - Placed prominently above the canvas.
  - Includes Spark icon, input field (`"Describe a change to this section…"`), target section badge (e.g., `Hero`), and "Regenerate" button.
  - Suggestion Card: Dismissible comparison banner displaying AI suggestion before applying, with "Apply to section" and "Dismiss" buttons.
- **Three-Column Canvas Workspace:**
  1. **Left Panel (Page Structure):**
     - Draggable section list (`Hero`, `Story`, `Services`, `Menu Gallery`, `Testimonials`, `Map & Contact`).
     - Grab handles (`⠿`), section type icon, section label, and visibility toggle button (eye icon) to hide/show sections.
     - Section reorder controls (Up/Down buttons).
     - "+ Add section" button.
  2. **Center Canvas (Interactive Live Preview):**
     - Floating browser frame with macOS-style window controls (red/yellow/green dots), simulated URL pill (`bloomandbean.example`), and external preview icon.
     - Fully interactive rendered website with selectable sections.
     - Active section receives a distinct selection outline (`ring-1 ring-inset ring-indigo-500`) with a floating indigo section tag badge.
  3. **Right Panel (Inspector & Design Tokens):**
     - Contextual Section Editor: Direct form fields for section headline, description, button text, link destination, and image replacement.
     - Design Tokens Tab:
       - **Color Palette:** 4 preset color swatches + HTML5 color picker for custom brand color, plus live hex displays for Canvas, Surface, and Text tokens.
       - **Font Pairing:** Visual cards for *Editorial* (DM Serif + Inter), *Modern* (Inter + Inter), and *Classic* (Georgia + Inter) with live typography previews.
       - **Section Spacing:** Interactive range slider (`24px` to `80px`) with Compact/Airy labels.

### 7.6 Publishing Experience (`Publishing`)
- **Two-Column Pre-Flight Screen:**
  - **Left Card:** High-fidelity thumbnail preview of the generated site with "Preview website" button.
  - **Right Card (Readiness Checklist & Slug):**
    - Readiness checkboxes: *Website content ready*, *Contact information reviewed*, *Images reviewed*, *Mobile preview reviewed*, *No unresolved critical facts*.
    - Public URL Slug Editor: Custom slug input with real-time URL formatting preview (`https://verityweb.example/sites/your-slug`) and validation message.
    - "Publish website" modal confirmation dialog with safety explanation (changes can be republished anytime).
    - Post-publication actions: "View website", "Copy URL", and "Continue editing".

---

## 8. Responsive Design & Viewport Rules

| Viewport Breakpoint | Target Devices | Layout Behavior |
| :--- | :--- | :--- |
| **Desktop (≥ 1280px)** | Standard & wide monitors | Full 3-column editor layout; fixed 240px sidebar; 3-column project cards. |
| **Laptop (1024px – 1279px)** | Laptops, small screens | 2-column editor (Page structure collapses into modal or tab); 2-column project cards. |
| **Tablet (768px – 1023px)** | iPads, surface tablets | Collapsible sidebar; canvas scales dynamically; verification studio stacks vertically. |
| **Mobile (< 768px)** | Smartphones | Top navigation bar with horizontal scroll; single-column stacked forms; canvas preview constrained to viewport. |

---

## 9. Design Elements to Avoid (Strict Negative Constraints)

To prevent visual degradation and maintain an enterprise-grade standard:
1. ❌ **No Dark Mode in App Shell:** Do not convert the Fact Verification screen, dashboard, or editor into a dark futuristic theme.
2. ❌ **No Heavy Glassmorphism or Frosted Glass:** Avoid blurry backdrop filters and translucent glass panels that harm readability and look dated.
3. ❌ **No Glowing Neon Borders or Pulsing Gradients:** AI actions must be indicated by clean Indigo accents and crisp micro-badges, never rainbow or neon glows.
4. ❌ **No Card Nesting Abuse:** Avoid placing cards inside cards inside cards. Use clean 1px border dividers (`border-t border-slate-100`).
5. ❌ **No Exaggerated Pill Containers:** Container borders must remain at `8px`–`12px` (`rounded-lg` / `rounded-xl`). Only badges and action pills use rounded-full.
6. ❌ **No Fabricated Data or Fake AI Claims:** All UI previews must clearly identify sample/demo status when operating in mock mode, reinforcing VerityWeb’s core principle of transparency.

---

## 10. Frontend Implementation Guidance (For Laravel + React)

When translating this reference into code:
1. **Component Library:** Utilize **shadcn/ui** primitives styled with Tailwind CSS, adhering to the token classes in this document.
2. **Typography Setup:** Configure Google Fonts `@import` for `'Inter'` and `'DM Serif Display'` inside `resources/css/app.css`.
3. **Icons:** Use `lucide-react` icons exclusively with `strokeWidth={1.6}` for consistency with the Figma design.
4. **State Machine for Fact Verification:** Treat fact conflict resolution as an explicit state object:
   ```typescript
   interface FactResolution {
     factId: string;
     status: 'verified' | 'conflicting' | 'user_confirmed' | 'missing';
     sources: Array<{ name: string; value: string; confidence: number }>;
     confirmedValue: string | null;
     isResolved: boolean;
   }
   ```
5. **Separation of Scopes:** Isolate the public website CSS preview into an encapsulated container or iframe so that client-customized fonts, colors, and section spacing never bleed into the VerityWeb application dashboard and editor chrome.

---

*This document serves as the permanent design source of truth for all VerityWeb UI milestones.*
