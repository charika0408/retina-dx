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
- 2026-09 (fork): Fixed P0 blank-screen crash (bad import `@react-navigation/native` in `upload.tsx` → replaced with expo-router `usePathname`). Fixed stale route stack on "Scan Another" (`router.dismissTo('/upload')` + clearing result). Verified clipboard export on web. Full flow Landing → Upload → Analysis → Results → Scan Another verified via browser automation.
- Earlier: backend, DB persistence, design system, all screens and components, testing iterations 1–3.

## Status
- MVP complete and working in web preview. AI analysis runs in DEMO_MODE (simulated) — expected for hackathon.

## Backlog / Ideas
- PDF export of the report card
- Heatmap/lesion overlay on evaluated image
- Real AI vision path hardening (currently optional via toggle)
