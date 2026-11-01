# CafeApp — Real-Time Café Management Platform

**A full-stack café operations platform connecting customers, waiters, bar staff, and café administrators through one real-time workflow.**

CafeApp replaces fragmented paper-based workflows with QR-code menus, live order tracking, staff workspaces, and data-driven reporting. This repository contains the **React frontend**; the companion `cafeapp` repository contains the Node.js backend.

## At a glance

| Experience | What it supports |
| --- | --- |
| **Customers** | Browse a digital menu, inspect products, place orders, and follow order progress |
| **Café administrators** | Manage orders, products, tables, QR codes, staff, and sales analytics |
| **Waiters / servers** | Use a dedicated staff dashboard for day-to-day order operations |
| **Bar staff** | View and manage orders in a preparation-focused interface |

## Features

### QR-code ordering and customer experience
- Customer-facing menu with product categories, images, and item details.
- Table-oriented ordering flow, accessible from the customer interface.
- Order tracking with real-time updates using Socket.IO.
- Dedicated customer ordering and order-tracking components.

### Live operations
- Admin order dashboard with status badges, order actions, and pagination.
- Separate server and barman screens for operational roles.
- Real-time events for order updates and cancellations.
- Receipt/printing workflows integrated with the backend.

### Café administration
- Product and menu management.
- Staff management screens.
- Table QR-code dashboard and downloadable QR-code PDF.
- Dedicated administration landing and navigation.

### Analytics and reporting
- Interactive charts built with **Recharts**.
- Revenue, orders, and product-performance visualizations.
- Date-range presets, including recent periods and custom ranges.
- KPI-oriented dashboard presentation.

### Product experience
- SaaS-style marketing and onboarding pages.
- Custom Material UI theme, responsive layouts, iconography, and animated interactions.
- Loading, error, and disconnected-state handling in key screens.

## Engineering highlights

### Multiple user journeys in one React application

React Router organizes distinct interfaces for customers, administrators, waiters, and bar staff. This makes the frontend more than a single dashboard: it supports several users participating in the same café workflow.

### Event-driven updates

The frontend integrates **Socket.IO Client** so operational screens can react to backend events rather than relying exclusively on repeated HTTP polling. Order-state changes can be reflected across the customer and staff experiences.

### Component-oriented interface design

Dedicated components separate the customer menu, order tracker, administrative order views, charts, QR-code management, and staff dashboards. Some screens use memoized components and React hooks such as `useMemo`, `useCallback`, and `useRef` for interactive behavior.

### API integration

The application uses **Axios**, including a shared café API instance in administrative screens. Frontend configuration supports environment-based backend and WebSocket URLs.

### Data visualization

The analytics experience uses **Recharts** to render interactive sales and operational data, including KPI cards and configurable date ranges.

## Tech stack

**Core:** React 19, JavaScript, React Router  
**UI:** Material UI, Emotion, Tailwind CSS, Lucide React, Framer Motion  
**Data and networking:** Axios, Socket.IO Client  
**Analytics:** Recharts, Vercel Speed Insights  
**Utilities:** jsPDF  
**Tooling:** Create React App / react-scripts

## Application routes

| Route | Experience |
| --- | --- |
| `/` | Product landing page |
| `/login` | Café login |
| `/admin` | Administration home |
| `/admin/orders` | Order management |
| `/admin/items` | Menu and item management |
| `/admin/charts` | Analytics |
| `/admin/qrcode` | Table QR codes |
| `/admin/waiters` | Staff management |
| `/client-panier` | Customer ordering |
| `/server-login` | Staff login |
| `/server-dashboard` | Staff dashboard |
| `/barman` | Bar preparation view |

## Getting started

### Requirements

- A current Node.js LTS release and npm
- A running instance of the companion CafeApp backend for API-driven functionality

### Install and run

```bash
npm install
npm start
```

The development server normally opens at `http://localhost:3000`.

### Environment configuration

Create a local `.env` file as needed:

```dotenv
REACT_APP_API_URL=http://localhost:5000
REACT_APP_WS_URL=http://localhost:5000
```

These variable names are used in the staff dashboard. Other API integrations may have additional configuration requirements; inspect `src/api/` and individual feature components when connecting your own backend. **Do not put secrets in `REACT_APP_*` variables**: React embeds these values in the browser bundle.

### Commands

```bash
npm start       # Run development server
npm run build   # Create production build
npm test        # Run configured React tests
```

## Project structure

```text
src/
├── api/                  # API client configuration
├── components/
│   ├── admin/            # Orders, products, charts, QR codes, staff
│   ├── saas/             # Landing, registration, café login
│   ├── server/           # Waiter and bar staff interfaces
│   ├── user/             # Customer menu and order tracking
│   └── getInfos/         # Additional onboarding/admin flows
├── App.js                # Routes and theme
└── index.js              # React entry point
```

## System overview

```text
Customer QR menu ───────┐
Admin dashboard ────────┤
Waiter dashboard ───────┼── React + Axios / Socket.IO ── Node.js API
Bar staff dashboard ────┘                                 │
                                                    SQL database
```

The backend implements the business logic, data models, authentication, transactional operations, reporting, and real-time event delivery.

## Current improvement areas

This is an evolving portfolio project. Before a production deployment or public launch:

- Audit authentication and authorization across every user role and route.
- Verify environment configuration and remove any hardcoded service URLs.
- Add integration and end-to-end tests for ordering, staff actions, and analytics.
- Improve accessibility and check mobile behavior across all major screens.
- Review dependencies and build warnings; consider migrating away from Create React App.
- Add genuine product screenshots or a short walkthrough video.
- Complete the backend security review, especially password handling and tenant isolation.

## Backend repository

**CafeApp API:** [salimBenSlim1/cafeapp](https://github.com/salimBenSlim1/cafeapp)

---

**Built to explore real-time systems, multi-role product design, and the engineering behind everyday café operations.**
