# theciae.com — Project Overview

A living reference for how this site is built and run. _Snapshot: 2026-10-16._

## What this is
**theciae.com** ("The Concept in Agricultural Engineering") — a free study-resource website for
**B.Tech and M.Tech / ICAR-NET Agricultural Engineering** students in India. Goal: become the go-to
notes / syllabus / notifications hub, grow Google traffic, and eventually monetize (AdSense) once traffic builds.

## Tech & infrastructure
- **Code:** static HTML/CSS/JS, **no framework**.
- **Repo:** public (the site reads its own files from it, so it must stay public). Owner-only write
  (branch protection on `main`, 2FA, no other collaborators). **No secrets are ever committed.**
- **Host:** Vercel — **auto-deploys on every merge to `main`** (~1 min). No test CI (only the Vercel deploy check).
- **Domain:** theciae.com (Namecheap, auto-renew). Connected to Vercel. Verified in Google Search Console
  (sitemap submitted). Use the apex `theciae.com`.
- **Serverless API (Vercel):** `api/upload.js` (notes), `api/delete.js`, `api/notice.js` (notice board).
  All gated by env vars **`ADMIN_PASSWORD`** + **`GITHUB_TOKEN`** — set in Vercel only, never in the repo.
  Public, read-only: `api/files.js` (list of note files + newest uploads, cached 10 min on Vercel's CDN; uses
  `GITHUB_TOKEN` when set) and `api/news.js` (homepage headlines, cached hourly).
- **Where notes are read from:** this site's own copy of `courses/` (Vercel serves them as `application/pdf`,
  inline). Fallbacks for a file uploaded in the last minute: jsDelivr, then raw GitHub.
  ⚠️ Some Indian networks (e.g. Jio/Airtel) block `raw.githubusercontent.com` — never make it the first choice.
  The browser-side GitHub API allows only 60 calls/hour per IP, so pages read `/api/files` first.
- **Contributions:** students email `theciaenotes@gmail.com` (the owner is the sole curator).

## Key files
- `index.html` — homepage: brand header with a Search block; intro panel (search + "Start here" links by
  programme, semester and NET discipline) beside a live panel (news, newest notes, openings — featured
  `notices.json` items replace the standing official links when posted); key-figures bar (counted live);
  course directory as compact rows (B.Tech opens on the student's last semester; search spans both programmes).
- `view.html` — full-screen PDF reader for phones and tablets (PDF.js 4.10.38 legacy build, vendored in
  `vendor/pdfjs/`, Apache-2.0). Laptops open PDFs in the browser's own viewer in a popup instead.
  Links look like `view.html?f=courses/…/file.pdf`; Back returns to `index.html#course=CODE`.
- `syllabus.html` — full course directory (generated).
- `course/*.html` — per-course SEO pages (generated; ~175).
- `links.html` — curated global + India resource directory (societies, universities, journals, exams).
- `notices.html` — **Openings Directory**: links to the official recruitment pages of ICAR institutes, ASRB/NTA,
  IIT Kharagpur, agricultural universities and fellowship schemes (no daily posting needed). An optional
  **Featured notices** section (from `notices.json`, with deadline status) appears only when something is posted.
- `app.html` — PWA-style study app (streaks, quizzes, reels, calculators). **noindex** (kept out of search).
- `reels.html` — study reels.
- **Data:** `courses.json` (B.Tech), `mtech.json` (5 M.Tech disciplines: FMPE, ASPE, SWCE, IDE, REE),
  `notices.json`, per-course `quiz.json` / `flashcards.json`.
- **Generator:** `scripts/gen-seo-pages.ps1` rebuilds course pages + `syllabus.html` + `sitemap.xml`.
  ⚠️ PowerShell 5.1 corrupts em-dashes unless the script is re-saved as UTF-8 BOM first:
  ```powershell
  $p='E:\theciae\scripts\gen-seo-pages.ps1'; $t=Get-Content $p -Raw -Encoding UTF8; Set-Content $p -Value $t -Encoding UTF8; & $p
  ```

## Owner workflows (no coding needed)
- **Upload notes:** `theciae.com/#upload` → fill form → admin password. Files commit to `courses/`, live in ~1 min.
  (≤ ~3 MB each; PDF/DOCX/PPTX/XLSX/JPG/PNG/ZIP/JSON.)
- **Feature a notice (optional, occasional):** `theciae.com/notices.html#post` → fill form (title, institution, dates,
  official link) → admin password → saves to `notices.json`, live in ~1 min; also shows in the homepage
  "Openings & exams" card. Delete via the Delete button in admin mode. With no notices, the notice-board section
  stays hidden and the homepage card shows the standing official links (ASRB, NTA, ICAR-CIAE, ICAR-IARI).
- **Openings directory upkeep:** recheck the recruitment links every month or two; ICAR institute sites move often.
- These `#upload` / `#post` entry points are password-protected server-side, so they are safe to leave discoverable.

## Content rules (legal + SEO + AdSense)
- Upload **only original/owned or openly-licensed** material — never pirated textbook PDFs.
- Notice board: **link to official sources**, don't re-host their PDFs. Keep the "verify on official site" disclaimer.

## Dev workflow
- Branch off `main` → edit → preview locally (`python -m http.server 8637` in the repo) → commit → push →
  open PR → merge in GitHub (Vercel auto-deploys).
