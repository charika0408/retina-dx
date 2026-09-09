# RETINA-DX — Product Requirements Document

## Original Problem Statement
Build a premium, dark-themed mobile app (Expo + FastAPI + MongoDB) called **RETINA-DX**: an AI-powered retinal screening prototype for a hackathon demo. A user uploads a retinal/fundus image and the system screens for possible signs of diabetic retinopathy. Must include pre-loaded sample scans (low-risk & signs-detected), comprehensive results (risk badge, confidence, biomarkers, clinical recommendations) and an exportable screening report card.

## Core Requirements (all implemented)
- Landing screen with hero visual, DEMO/REAL AI toggle, scan history (audit) modal
- Upload screen: gallery/camera picker + one-tap curated sample shelf (3 samples)
- Analysis screen: neural-scanner loading state while `/api/predict` runs
- Results screen: RiskBadge, statement card, evaluated image thumbnail, BiomarkerCard, recommendations, ReportExportCard (share on native / clipboard on web), "Scan Another" resets flow
- Backend persists every screening to MongoDB (`screenings` collection); DEMO_MODE simulation with optional real GPT vision path

## Architecture
- `backend/server.py` — FastAPI: `GET /api/health`, `GET /api/samples`, `POST /api/predict`, `GET /api/screenings`
- `frontend/app/` — expo-router screens: `index`, `upload`, `analysis`, `results`
- `frontend/src/` — `theme.ts` (design tokens), `api/retinaApi.ts`, `context/ScreeningContext.tsx`, `components/*`

## What's Been Done
- 2026-09 (fork, feature add): **Lesion Heatmap** — backend returns `lesions[]` (type/x/y/radius/intensity/label) per scan (hand-placed for the 3 curated samples, deterministic biomarker-seeded map for uploads; AI vision prompt also asks for lesions). New `LesionHeatmapOverlay` component: pulsing glow markers mapped onto the letterboxed image, HEATMAP ON/OFF toggle, per-type legend counts, "FUNDUS CLEAR" state. **PDF Report** — `buildReportHtml.ts` + expo-print: web opens print dialog (Save as PDF), native generates PDF and opens share sheet (expo-sharing). Replaced Unsplash stock photos with real public-domain fundus photographs (Wikimedia Commons). Tested via testing agent iteration 4 (all pass).
- 2026-09 (fork): Fixed P0 blank-screen crash (bad import `@react-navigation/native` in `upload.tsx` → replaced with expo-router `usePathname`). Fixed stale route stack on "Scan Another" (`router.dismissTo('/upload')` + clearing result). Verified clipboard export on web. Full flow Landing → Upload → Analysis → Results → Scan Another verified via browser automation.
- Earlier: backend, DB persistence, design system, all screens and components, testing iterations 1–3.

## Status
- MVP complete and working in web preview. AI analysis runs in DEMO_MODE (simulated) — expected for hackathon.

## Backlog / Ideas
- Scan comparison (side-by-side of two past scans)
- One-tap demo reset (clear history)
- Real AI vision path hardening (currently optional via toggle)
