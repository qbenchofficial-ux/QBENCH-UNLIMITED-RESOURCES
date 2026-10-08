# Security Policy — QBENCH Digital Platform & Creative Management System (CMS)

QBENCH takes the security of our digital agency platform, client inquiry data, and Creative Management System (CMS) seriously. This document is the single authoritative security policy for the QBENCH repository and reflects the actual security controls implemented across the frontend, Express/Node API routes, Supabase PostgreSQL database, Row Level Security (RLS) policies, and Supabase Storage buckets.

---

## 1. Supported Versions

Security updates, dependency patches, and Supabase Row Level Security (RLS) migrations are applied to the current production release (`package.json` version `1.0.0`, deployed from the `main` branch).

| Version | Release Channel | Supported |
| ------- | --------------- | --------- |
| `1.0.x` (`1.0.0` / `main`) | Current Production (React 19 / Vite 6 / Express / Supabase RLS) | Yes |
| `< 1.0.0` | Pre-release / Legacy Snapshots | No |

---

## 2. Reporting a Vulnerability

If you discover a security vulnerability in the QBENCH public website, Admin Portal (`/admin/*`), Express API endpoints (`/api/*`), or Supabase database/storage configuration, please report it privately.

### Where to Report

Do **not** open a public GitHub issue or public pull request for suspected security vulnerabilities. Report findings privately via:

- **Primary Security Email:** [qbench.official@gmail.com](mailto:qbench.official@gmail.com)
- **Secondary Contact Email:** [contact@qbench.in](mailto:contact@qbench.in)
- **Machine-Readable Policy:** `/.well-known/security.txt` (RFC 9116)

Please use the subject line: `[SECURITY] QBENCH Vulnerability Report — <Brief Summary>`.

### What to Include

To help us triage and reproduce the issue quickly, please include:

1. A clear description of the vulnerability and affected component (e.g., `/admin/*`, `public.projects` RLS, `/api/contact`, `mediaService.ts`).
2. Step-by-step reproduction instructions or a minimal proof-of-concept (PoC).
3. The affected URL, API route, database table, or source file path.
4. Potential security impact and any suggested remediation.

Do **not** include live third-party credentials, personal data of real users, or destructive payloads in your report.

### Response Process & Timeline

| Stage | Target SLA | What to Expect |
| ----- | ---------- | -------------- |
| **Initial Acknowledgment** | Within **48 hours** | Confirmation that your report was received and assigned for review. |
| **Triage & Validation** | Within **5 business days** | Technical assessment of reproducibility, scope, and severity. |
| **Status Updates** | Every **7 days** | Progress updates while a patch or SQL migration is prepared. |
| **Remediation & Release** | **7–30 days** (by severity) | Deployment of code fixes, Supabase RLS/Storage policies, or secret rotation. |

- **If Accepted:** We will confirm the issue, develop and deploy a fix or database migration, notify you to verify the resolution, and—with your permission—acknowledge your contribution.
- **If Declined:** We will provide a transparent technical explanation if the behavior is working as intended, falls outside our threat model, or is already mitigated by server-side database/storage controls.

---

## 3. Security Architecture

The QBENCH platform enforces defense-in-depth across client, server, and database tiers.

### Authentication (`src/hooks/useAuth.ts`, `src/lib/supabase.ts`)

1. **Supabase Auth (`@supabase/supabase-js`):** Admin sign-in is handled via `supabase.auth.signInWithPassword({ email, password })`.
2. **Server-Validated Identity:** Session verification uses `supabase.auth.getUser()` to validate the JWT directly against the Supabase Auth server rather than trusting cached browser state.
3. **Protected `/admin/*` Routes:** `AdminControlView.tsx` and `useAuth.ts` guard `/admin`, `/admin/login`, `/admin/projects`, `/admin/categories`, `/admin/inquiries`, `/admin/media`, `/admin/site-content`, and `/admin/settings`. Unauthenticated or non-admin users are immediately signed out via `supabase.auth.signOut()` and denied access to the CMS interface.

### Authorization (`public.is_qbench_admin()`, `public.admin_profiles`)

Frontend route guards are strictly for UX convenience. All privileged data access and mutations are independently enforced at the PostgreSQL database and Supabase Storage layers:

- **Database Identity Verification:** Authorization is never granted based on client-side variables, `localStorage`, or email string matching. Instead, PostgreSQL evaluates the authenticated session's UUID (`auth.uid()`) against `public.admin_profiles`.
- **Hardened RPC & RLS Helper (`public.is_qbench_admin()`):**
  ```sql
  create or replace function public.is_qbench_admin()
  returns boolean
  language sql
  stable
  security definer
  set search_path = public
  as $$
  select exists (
    select 1
    from public.admin_profiles
    where user_id = auth.uid()
      and role = 'admin'
  );
  $$;
  ```
  - Uses `SECURITY DEFINER` with an explicit, immutable `SET search_path = public` to prevent `search_path` hijacking.
  - Strictly checks `user_id = auth.uid() AND role = 'admin'` on `public.admin_profiles`.
  - Grants `EXECUTE` to `anon`, `authenticated`, and `service_role` so both post-login RPC checks (`supabase.rpc('is_qbench_admin')`) and table/storage RLS policies execute deterministically without `42501` permission errors.
- **Server-Side Admin Endpoints (`server.ts`):** Express endpoints `/api/messages`, `/api/admin-settings` (`POST`), and `/api/admin-overview` require a server-side `ADMIN_SECRET` query credential matched against `process.env.ADMIN_SECRET`.

---

## 4. Supabase Row Level Security (RLS) Audit

Row Level Security (`ENABLE ROW LEVEL SECURITY`) is enforced on all seven application tables in the `public` schema (`supabase/schema.sql` and `supabase/migrations/`):

| Table | RLS Enabled | `anon` SELECT | `authenticated` SELECT | INSERT | UPDATE | DELETE |
| ----- | ----------- | ------------- | ---------------------- | ------ | ------ | ------ |
| `public.projects` | Yes | `status = 'published'` only | `status = 'published'` OR `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` |
| `public.categories` | Yes | `is_active = true` only | `is_active = true` OR `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` |
| `public.portfolio_images` | Yes | `project_id IS NULL` OR parent project `status = 'published'` | Public rows OR `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` |
| `public.project_videos` | Yes | Parent project `status = 'published'` only | Published project videos OR `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` |
| `public.project_inquiries` | Yes | **Denied** (No `SELECT` policy for `anon`) | `public.is_qbench_admin()` only | `anon`, `authenticated` (`WITH CHECK (true)`) | `public.is_qbench_admin()` | `public.is_qbench_admin()` |
| `public.site_settings` | Yes | Allowed (`true` — public CMS copy & settings) | Allowed (`true`) | `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` |
| `public.admin_profiles` | Yes | **Denied** (No `anon` access) | Own row (`user_id = auth.uid()`) OR `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` | `public.is_qbench_admin()` |

### Key Data Protection Guarantees

- **Lead & Inquiry Privacy (`public.project_inquiries`):** Anonymous visitors can `INSERT` new project inquiries via the contact form, but cannot `SELECT`, `UPDATE`, or `DELETE` any inquiry rows. Client contact submissions (`src/services/inquiryService.ts`) perform a write-only `.insert([payload])` without chaining `.select()`, preventing RLS read-back failures while keeping customer PII strictly confidential to verified admins.
- **Draft Isolation (`public.projects`, `public.portfolio_images`, `public.project_videos`):** Draft projects (`status = 'draft'`) and their associated gallery images and videos are hidden from anonymous queries and only visible to authenticated administrators passing `public.is_qbench_admin()`.
- **UUID Parameter Validation (`src/lib/supabase.ts`):** All database queries filtering by UUID columns validate identifiers with `isValidUuid()` before execution, preventing malformed input or local seed identifiers (`seed-*`, `cat-*`) from reaching PostgreSQL UUID queries.

---

## 5. Storage & File Upload Security

### Supabase Storage Buckets (`storage.buckets` & `storage.objects`)

Media assets are stored in two dedicated Supabase Storage buckets configured in `supabase/schema.sql` and `supabase/migrations/20261007_security_rls_and_storage_hardening.sql`:

| Bucket ID | Visibility | Max File Size | Allowed MIME Types | Read (`SELECT`) | Write (`INSERT` / `UPDATE` / `DELETE`) |
| --------- | ---------- | ------------- | ------------------ | --------------- | -------------------------------------- |
| `portfolio-images` | Public | 10 MB (`10485760` bytes) | `image/jpeg`, `image/jpg`, `image/png`, `image/webp`, `image/svg+xml` | `anon`, `authenticated` | `authenticated` where `public.is_qbench_admin()` |
| `portfolio-videos` | Public | 50 MB (`52428800` bytes) | `video/mp4`, `video/webm`, `video/quicktime` | `anon`, `authenticated` | `authenticated` where `public.is_qbench_admin()` |

### Client & Storage Upload Hardening (`src/services/mediaService.ts`)

1. **MIME & Extension Allowlisting:**
   - Images (`validatePortfolioImage`): Enforces `.jpg`, `.jpeg`, `.png`, `.webp`, `.svg` extensions and matching MIME types (`<= 10 MB`, `> 0 bytes`).
   - Videos (`validateProjectVideo`): Enforces `.mp4`, `.webm`, `.mov` extensions and matching video MIME types (`<= 50 MB`, `> 0 bytes`).
2. **SVG Sanitization (`sanitizeSvgFile`):**
   - Every uploaded `.svg` / `image/svg+xml` file is parsed and sanitized prior to upload.
   - Using `DOMParser` and `XMLSerializer` (with a regex fallback in non-DOM environments), `sanitizeSvgFile()` strips `<script>`, `<foreignObject>`, `<iframe>`, `<object>`, `<embed>`, `<link>`, and `<meta>` elements, removes all inline `on*` event handler attributes, and removes `javascript:`, `vbscript:`, `data:text/html`, and CSS `expression(...)` URIs.
3. **Path Traversal & Local Path Prevention:**
   - Uploaded filenames are normalized via `slugify()` (stripping all non-alphanumeric characters except hyphens), prefixed with a timestamp and random token (`${Date.now()}-${uniqueSuffix}-${baseName}.${ext}`), and placed into strictly validated folder hierarchies (`projects/{uuid}/`, `categories/`, `site/`).
   - `isLocalComputerPath()` blocks local filesystem paths (`C:\...`, `file://`, `blob:`, `/Users/`, `/home/`) from being persisted to database URL columns.

---

## 6. Secret Management & Inquiry Integrations

- **No Secret Keys in Frontend Code:** Only the Supabase project URL (`VITE_SUPABASE_URL`) and publishable anonymous key (`VITE_SUPABASE_ANON_KEY`, `sb_publishable_...`) are used in the browser client. `isValidAnonKey()` in `src/lib/supabase.ts` and `vite.config.ts` explicitly rejects any key starting with `sb_secret_` or containing `service_role`.
- **Environment Variable Hygiene:** `.gitignore` excludes all `.env*` files except `.env.example`. `.env.example` contains only non-sensitive configuration keys and the public Supabase publishable key.
- **Server-Side Integration Secrets (`server.ts`):**
  - **Gmail SMTP (`nodemailer`):** `SMTP_USER` and `SMTP_PASS` are read exclusively on the Node/Express server (`getGmailSmtpConfig()`) and are never logged or returned to the client, including in `/api/smtp-test` and `/api/admin-overview`.
  - **WhatsApp Business Cloud API:** `WHATSAPP_ACCESS_TOKEN` is stored and used strictly server-side in `handleWhatsAppNotification()`.
  - **Contact Form XSS & Spam Mitigation (`ContactView.tsx`, `server.ts`):** The frontend contact form enforces a hidden honeypot field, a submission lock (`isSubmittingRef`), and field format validation. The backend `/api/contact` endpoint HTML-encodes all user-supplied fields (`sanitizeHTML`) before constructing HTML email bodies.

---

## 7. Scope

### In Scope

- QBENCH public web application and SPA routes (`/`, `/portfolio`, `/services`, `/packages`, `/contact`)
- QBENCH Admin Portal & Creative Management System (`/admin/*`)
- Supabase authentication, `public.is_qbench_admin()` RPC, and PostgreSQL Row Level Security (RLS) policies across `projects`, `categories`, `portfolio_images`, `project_videos`, `project_inquiries`, `site_settings`, and `admin_profiles`
- Supabase Storage access controls (`portfolio-images` and `portfolio-videos` buckets) and SVG sanitization (`sanitizeSvgFile`)
- Express backend API routes (`/api/contact`, `/api/emailjs-send`, `/api/sheets-webhook`, `/api/whatsapp-notify`, `/api/messages`, `/api/admin-settings`, `/api/admin-overview`, `/api/supabase-config`)
- Cross-Site Scripting (XSS), privilege escalation, unauthorized database/storage mutation, or sensitive data exposure

### Out of Scope

- Presence of the public Supabase `anon` / `publishable` key (`sb_publishable_...`) or public EmailJS key (`VITE_EMAILJS_PUBLIC_KEY`) in client bundles when properly restricted by RLS and template domain controls
- UI/UX bugs, spelling/copy issues, or missing features without a demonstrable security impact
- Automated scanner output or dependency warnings without a verifiable exploit path in QBENCH
- Denial of Service (DoS), volumetric spam, or rate-limit exhaustion testing against production infrastructure
- Social engineering, phishing, or physical attacks against QBENCH personnel or devices
- Vulnerabilities originating solely within third-party hosting or SaaS infrastructure (Supabase, Vercel, GitHub, EmailJS, Google Apps Script, Meta WhatsApp Cloud API)

---

## 8. Responsible Disclosure & Safe Harbor

We ask security researchers to act in good faith by adhering to the following guidelines:

1. **Protect Privacy & Data Integrity:** Do not access, modify, copy, or delete data belonging to other users or clients. Stop testing immediately and report to us if you encounter unintended access to `project_inquiries` or `admin_profiles`.
2. **Avoid Service Disruption:** Do not execute destructive SQL payloads, automated brute-force attacks, or storage flooding against production buckets.
3. **Coordinate Disclosure:** Allow QBENCH a reasonable window to validate and remediate the issue before publishing any technical details.

Security research conducted in compliance with this policy is considered authorized, and QBENCH will not pursue legal action against researchers who report vulnerabilities responsibly.
