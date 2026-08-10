# Classroom Doubt Heatmap

A Next.js frontend for collecting and viewing classroom confusion feedback.

The interface is complete, but the backend is intentionally not connected yet.
Login, lecture saving, join-code lookup, student reactions, heatmaps, and trends
show clear frontend states until server endpoints are added.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Current frontend flow

- Teachers can navigate through login, signup, dashboard, trends, and upload pages.
- A PDF can be selected and rendered locally in the upload page.
- Student join and lecture screens remain available as backend-ready screens.

## Backend to add later

Connect the screens to your API for authentication, lecture uploads, join-code
validation, anonymous reactions, heatmap data, and trend calculations.
