# Silver Oak Campus Helpdesk (v2)

A complete helpdesk product UI for students, faculty and the helpdesk team. React 18 + Vite + Tailwind, no other runtime dependencies.

## Run it
```bash
npm install
npm run dev            # http://localhost:5173
npm run build          # production build in /dist
npm run build:single   # one self-contained HTML file (share or host anywhere)
```
Sign in with any of the three demo profiles on the login page (any password works).

## What is inside
| Area | Screens |
|---|---|
| Public | Landing page with live request tracker, sign-in with role picker, password reset flow |
| Everyone | Overview, My requests (list + board), 3-step request wizard with article suggestions, request detail with SLA clock, conversation, attachments and rating, Knowledge base, Ask Oak assistant, Events, Lost & Found, Exams, Fees with payment flow, Documents (each request becomes a tracked ticket), Settings |
| Helpdesk admin | Operations overview, request queue with bulk actions and drag-and-drop board, private notes and saved replies, Analytics, People directory, Announcements, Helpdesk setup |
| Platform | Command palette (⌘K or /), notifications, toasts, keyboard focus states, dark mode, responsive down to phones |

## Customize the look (Settings → Appearance)
Four ready-made looks, light/dark/match device, 8 accent colours plus any custom hex, 6 typeface pairings, sharp/soft/round corners, compact/comfortable/spacious density, dark/light/accent sidebar, text size, reduced motion, and a shareable theme code. Everything runs on CSS variables (`src/styles/index.css`, `src/lib/theme.jsx`), so adding a new preset is one line.

## Connect a backend
All data goes through `src/services/api.js`. Today it reads `src/data/seed.js` and saves to localStorage. Replace those functions with real calls (the endpoint map is in the file); pages do not change.

## Structure
```
src/
  lib/         utils, colour maths, router, theme engine, SLA rules, analytics
  store/       app state and actions (tickets, notifications, fees, events...)
  services/    api.js  <- backend seam
  data/        seed.js <- demo content
  components/  ui/ (buttons, forms, modals, tabs...), charts/ (SVG), layout/
  pages/       one file per area
```
