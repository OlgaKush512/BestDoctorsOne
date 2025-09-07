# BestDoctor Chrome Extension – Sidebar (Manifest V3)

Goal:
Build a standalone Chrome side panel extension that mirrors the current frontend’s UX and features, uses the existing backend, and matches styling and error handling. The extension must be self-contained (own package.json, tsconfig, build) and must not modify files outside chrome-extension/.

Constraints and Requirements:

- Independent project inside chrome-extension/ only.
- TypeScript source, compiled to JavaScript (Vite build).
- Reuse existing backend API and error-handling logic from frontend/src/services/api.ts.
- Replicate the frontend theme (frontend/src/theme.ts) and UI styling (MUI).
- Do not add extra features not currently requested.
- Use Chrome Side Panel API (Manifest V3).
- Do not modify files outside chrome-extension/.

Features to Mirror (from frontend):

1. Search (SearchPage)

   - Fields:
     - specialty (Select)
     - location (TextField)
     - date (DatePicker / dayjs)
     - additionalRequirements (multiline)
   - Validation (required fields).
   - On submit, call POST /api/doctors/search with same payload.
   - Robust error handling (server 500/400/other, request timeout, network error, setup error) with localized messages (FR).
   - Loading state during search.

2. Results (ResultsPage)
   - List of doctors with:
     - Name, specialty, address, phone
     - Rating and reviewCount
     - AI analysis: score, summary, pros, cons, flags (lgbtFriendly, languages)
     - Availability slots (show a few chips)
     - “Prendre rendez-vous sur Doctolib” button (opens in new tab)
   - “Nouvelle recherche” button to return to search.

Styling and UX:

- Use the same theme as frontend/src/theme.ts (colors, shapes, component overrides).
- Keep textual content and messages in FR as in frontend.
- The panel will likely be narrower than the web app; layout will adapt for side panel width.

Tech Stack:

- React + TypeScript + Vite
- MUI (@mui/material, @mui/icons-material), @mui/x-date-pickers, dayjs
- axios for HTTP
- Manifest V3 with side_panel

Project Structure (planned):

- chrome-extension/
  - package.json
  - tsconfig.json
  - vite.config.ts
  - manifest.json
  - index.html
  - src/
    - main.tsx
    - App.tsx
    - theme.ts (copied from frontend)
    - types.ts (Doctor, SearchResults, SearchParams)
    - services/
      - api.ts (ported with same error handling)
    - pages/
      - PanelSearch.tsx (adapted from SearchPage)
      - PanelResults.tsx (adapted from ResultsPage)
  - assets/ (if needed)

Environment and Config:

- API base URL: import.meta.env.VITE_API_URL || http://localhost:5000/api
- Manifest host_permissions should include the backend host:
  - http://localhost:5000/\*
  - Optionally additional domains if used in deployment (to be added later).

Build and Run:

- npm run dev — development with Vite
- npm run build — production build to dist/
- Load dist/ as unpacked extension in Chrome (chrome://extensions), ensure Side Panel is enabled.

Risks / Considerations:

- CORS/host_permissions: Ensure manifest host_permissions include the backend host so fetch/axios from extension pages can access it; verify backend CORS if needed.
- Side panel width constraints: ensure responsive layout, avoid overflow.
- DatePicker in MV3 environment: ensure @mui/x-date-pickers and dayjs work without external locales unless added.

Definition of Done:

- Extension builds successfully and loads as a side panel.
- Search with required fields calls backend and handles errors identically (messages in FR).
- Results render equivalently to frontend design and content.
- Styling/theme matches frontend (colors, gradients, shapes).
- No changes outside chrome-extension/.

Checklist

Phase 1 — Scaffold

- [ ] Create package.json with dependencies and scripts (dev, build).
- [ ] Create tsconfig.json (React + strict TS).
- [ ] Create vite.config.ts.
- [ ] Create manifest.json (MV3 with side_panel).
- [ ] Create index.html (mount root).
- [ ] Add src/main.tsx bootstrapping React.
- [ ] Add src/App.tsx shell with state-based routing (Search/Results).
- [ ] Copy src/theme.ts from frontend theme (adapt only imports if needed).
- [ ] Add src/types.ts (Doctor, SearchResults, SearchParams).

Phase 2 — Services and Error Handling

- [ ] Port src/services/api.ts with same error handling (status 500/400/other, timeout, no response, setup errors) and FR messages.
- [ ] Ensure API base URL respects import.meta.env.VITE_API_URL || http://localhost:5000/api.

Phase 3 — UI Pages

- [ ] Implement pages/PanelSearch.tsx:
  - Specialty select, location input, date picker, additionalRequirements.
  - Validation and loading state.
  - On submit: call searchDoctors and hand results to App.
  - Display errors in a MUI Alert/Snackbar, keeping FR messages.
- [ ] Implement pages/PanelResults.tsx:
  - Render doctor cards with details, AI analysis (score, summary, pros, cons, flags), availability chips.
  - Link to Doctolib opens a new tab.
  - “Nouvelle recherche” returns to search view.

Phase 4 — Styling Parity and Polish

- [ ] Apply theme from theme.ts globally.
- [ ] Mirror gradient headers and component overrides where feasible for side panel.
- [ ] Responsive adjustments for panel width.

Phase 5 — Build and Test

- [ ] npm run build to produce dist/.
- [ ] Load unpacked (dist/) and pin side panel.
- [ ] Verify search, error flows, and results render correctly against the running backend.

Notes

- Keep changes constrained to chrome-extension/ directory.
- Keep features minimal and equivalent to the current frontend scope.
- Future (optional, not in scope now): support analyzeDoctorReviews button per doctor if needed by product.
