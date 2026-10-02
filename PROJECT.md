# theciae.com — Project Overview

A living reference for how this site is built and run. _Snapshot: 2026-10-03._

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
- **Contributions:** students email `theciaenotes@gmail.com` (the owner is the sole curator).

## Key files
- `index.html` — homepage; includes an auto-scrolling **notice ticker** under the header (latest items from
  `notices.json`; hidden when empty).
- `syllabus.html` — full course directory (generated).
- `course/*.html` — per-course SEO pages (generated; ~175).
- `links.html` — curated global + India resource directory (societies, universities, journals, exams).
- `notices.html` — **Notice Board** (JRF/SRF/Post-Doc/admission). Single newest-first list with deadline
  status (Open / Closing soon / Expired).
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
- **Post a notice:** `theciae.com/notices.html#post` → fill form (title, institution, dates, official link) →
  admin password → saves to `notices.json`, live in ~1 min. Delete via the Delete button in admin mode.
- These `#upload` / `#post` entry points are password-protected server-side, so they are safe to leave discoverable.

## Content rules (legal + SEO + AdSense)
- Upload **only original/owned or openly-licensed** material — never pirated textbook PDFs.
- Notice board: **link to official sources**, don't re-host their PDFs. Keep the "verify on official site" disclaimer.

## Dev workflow
- Branch off `main` → edit → preview locally (`python -m http.server 8637` in the repo) → commit → push →
  open PR → merge in GitHub (Vercel auto-deploys).
