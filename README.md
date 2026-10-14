# PawCruz Veterinary Clinic — Online Appointment System

> **Compassionate care for every paw.** Book your pet's next visit in under a minute.

A MERN-stack online appointment system for a veterinary clinic, built for **CTADWEBL – Advanced Web
Programming**. Its appointment model follows the team's PawCruz `final-vet` project: pet owners book
**one or more pets** into **10-minute consultation slots**, choosing a **date → available time → a
veterinarian free at that time**. Bookings are confirmed instantly with a **queue number**. Clinic
admins register walk-ins, manage every appointment, the veterinarians and their shifts, services, and
view all animal patients.

It is a full **MERN** app: a React frontend (`/client`) talking to a Node.js + Express REST API
(`/server`) that stores everything in **MongoDB** and secures accounts with **JSON Web Tokens (JWT)**.

---

## Tech stack

| Area | Used |
| --- | --- |
| Frontend | React 18 + Vite (JavaScript), React Router v6, React Hooks + custom hooks |
| UI | React-Bootstrap + Bootstrap 5, custom CSS design system, react-icons |
| Utilities | Axios (with JWT interceptor), react-toastify, date-fns |
| Backend | Node.js, Express 5 (REST API) |
| Database | MongoDB (Atlas or local) with Mongoose |
| Authentication | JSON Web Token (jsonwebtoken), bcrypt password hashing |
| API security | helmet, CORS, rate limiting, input sanitizing, server-side validation |
| Quality | oxlint (`npm run lint`) — 0 warnings, 0 errors |

## Project structure

```
Online Appointment System/
├── client/                 React app (frontend)
│   ├── public/images/      Real Unsplash photos (credits in images/README.md)
│   └── src/
│       ├── api/            axiosClient.js (API base URL + "Authorization: Bearer <token>")
│       ├── services/       authService, appointmentService, petService, vetService, serviceService,
│       │                   patientService, contactService, demoService (one function per API call)
│       ├── data/           siteContent.js (marketing copy)
│       ├── context/        AuthContext.jsx, ThemeContext.jsx
│       ├── hooks/          useAuth, usePagination, useDebounce, useForm, useAsync, useAvailability,
│       │                   useCountdown, useInView, useTheme
│       ├── components/     Navbar, Footer, Sidebar, ProtectedRoute, RoleRoute, AppointmentCard, StatusBadge,
│       │                   SearchBar, PaginationBar, ConfirmModal, EmptyState, LoadingSpinner,
│       │                   ImageWithFallback, StatCard, TimeSlotPicker, PetCard, PetFormModal, VetCard,
│       │                   VetPicker, RebookModal, AppointmentFormModal, …
│       ├── layouts/        PublicLayout.jsx, DashboardLayout.jsx, navConfig.js
│       ├── pages/          public/, owner/ (pet-owner portal), admin/
│       ├── styles/         theme.css (CSS variables), global.css, components.css, layout.css, pages.css, pawcruz.css
│       └── utils/          validators, formatters, dateUtils (Asia/Manila), schedule (10-min slots),
│                           petOptions, appointmentRules, routes, calendarFile, constants
└── server/                 Express + MongoDB + JWT API (see server/README.md)
    └── src/                config, models, middleware, controllers, routes, shared rules, seed
```

## Getting started

**Requirements:** Node.js **20.19+ or 22.12+** and npm, plus a MongoDB database (free MongoDB Atlas or
a local MongoDB). **Full step-by-step instructions, including creating the database, are in
[`server/README.md`](server/README.md#step-by-step-setup).** In short:

```bash
# Terminal 1 — the API
cd server
npm install
copy .env.example .env      # then put your MONGODB_URI and a JWT_SECRET in .env
npm run seed                # demo data
npm run dev                 # http://localhost:5000/api

# Terminal 2 — the React app
cd client
npm install
npm run dev                 # http://localhost:5173
```

| Script (client) | What it does |
| --- | --- |
| `npm run dev` | Start the dev server with hot reload |
| `npm run build` | Production build into `client/dist` |
| `npm run preview` | Serve the production build locally |
| `npm run lint` | Lint the code with oxlint |

## Test accounts

| Role | Email | Password |
| --- | --- | --- |
| Pet owner | `owner@pawcruz.ph` | `Owner123!` |
| Admin | `admin@pawcruz.ph` | `Admin123!` |
| Vet (Dr. Neil Cruz) | `neil.cruz@pawcruz.ph` | `Vet12345!` |
| Vet (Dr. Redmond Lopez) | `redmond.lopez@pawcruz.ph` | `Vet12345!` |

The login page has **"Pet owner demo" / "Admin demo"** buttons that fill these in. Ten more sample pet
owners (e.g. `paolo.garcia@example.com`) also use `Owner123!`. You can register new pet-owner accounts too.

**Demo data:** 2 veterinarians — Dr. Neil Norman A. Cruz and Dr. Redmond Lopez — 8 services, 12 pet owners, 17 pets and 30
appointments dated around *today* (always some upcoming and past visits, including a two-pet visit).
Admins can restore it anytime with **Dashboard → Reset demo data**, or run `npm run seed` in `server/`.

## How booking works (same rules as final-vet)

- Clinic hours: **Monday–Sunday, 9:00 AM–7:00 PM**. Slots are **10 minutes**; the last one is 6:50–7:00 PM.
- Two veterinarians, both on duty every day (same hours as final-vet): **Dr. Redmond Lopez 9:00 AM–5:00 PM** and
  **Dr. Neil Norman A. Cruz 11:00 AM–7:00 PM**, so two vet "lanes" are open from 11 AM to 5 PM. Admins can edit their shifts.
- A time is open when **at least one vet on duty is free**; then you pick from the vets free at that time.
- Booking several pets gives them **back-to-back slots with the same vet** and one booking reference.
- Times already booked, already past, or clashing with one of your pets' bookings are disabled.
- Bookings are **Confirmed** immediately. Queue numbers: online visits **E-001, E-002…** per day; walk-ins
  **#901** style (hour + order in that hour).
- Owners can **cancel** any upcoming visit and **rebook** their online bookings; walk-ins are rebooked at the front desk.
- The clinic marks visits **Completed** on or after the visit day. Statuses: Confirmed, Completed, Cancelled.
- Every booking is a *General Consultation*; the owner picks the **reason for visit** from the services list.

## Features

### Public site
- **Home** — hero with booking CTA, how it works (3 steps), featured services, meet-the-vets cards,
  testimonials, clinic hours (today highlighted) and location, FAQ accordion
- **Services** — debounced search, category filter, sorting, ₱ starting price and duration on each card
- **Veterinarians** — photo, specialty, rating, duty days and shift; **profile page** with
  bio, education, PRC license, schedule and "Book with this vet"
- **About** and **Contact** (validated message form)
- **Login / Register** — full-screen pages that fit the screen without scrolling; required fields, email format, password ≥ 8 chars with a number and an uppercase
  letter (live checklist), confirm password, PH mobile `09XXXXXXXXX` (non-digits stripped as you type),
  Data Privacy Act (RA 10173) consent, show/hide password, loading states, inline errors that update as you
  fix them, focus jumps to the first invalid field
- **404** and **403 Not Authorized** pages

### Pet-owner portal (login required)
- **Dashboard** — greeting, stats (upcoming, completed, cancelled, pets), next visit with queue number and
  live countdown, my pets strip, quick actions, pet-care tip of the day
- **My Pets** — add / edit / remove pets (species & breed lists from final-vet, sex, birth date, weight,
  color, microchip, notes); removing is blocked while a pet has upcoming visits
- **Book Appointment** — 4-step wizard with progress bar: pets & reason → date & available time →
  veterinarian → review & confirm; add a pet on the spot; live appointment summary; confirmation screen
  with queue number, booking reference (copy), each pet's slot and **Add to calendar (.ics)**
- **Appointments** — table on desktop, cards on mobile; debounced search, status and pet filters, date
  sorting, pagination (5 per page, adjustable), rebook modal, cancel with confirmation + reason
- **Appointment details** — queue number, status timeline, pet profile, vet, reminders, rebook / cancel / print
- **Profile** — edit contact details (validated), avatar preview, change password

### Admin panel (admin role only)
- **Dashboard** — KPI cards, appointments-per-day bar chart for the week (plain SVG, hover/keyboard tooltips,
  table view), status overview, today's schedule with queue numbers, vets on duty today
- **Appointments** — full CRUD: register walk-ins (owner → pets → reason → date → time → vet), edit,
  delete, mark completed, rebook, cancel with reason; search, status / vet / source / date filters, pagination
- **Animal Patients** — read-only searchable, paginated list of pets with owners and visit history
- **Veterinarians** — add / edit / delete with PRC license, duty days and shift hours (these drive the booking slots)
- **Services** — add / edit / delete services and starting prices

### Across the app
- Distinctive design system (Fraunces + Plus Jakarta Sans, dark-blue & light-blue palette, 20 px rounded cards,
  layered shadows, pill buttons, SVG wave dividers, paw & sparkle motif, fade-in on scroll)
- **Dark mode** toggle (saved in localStorage, no flash on reload)
- Fully responsive (checked at 375 px, 768 px and 1280 px); collapsible sidebar on desktop, drawer on mobile
- Toasts, loading spinners, empty states, confirmation modals; dashboard pages are lazy-loaded
- All dates and times use the clinic timezone, **Asia/Manila**; prices in **PHP (₱)**

## Security

- Passwords are hashed with **bcrypt**; the API never returns them
- Login returns a **JWT** signed with a secret key; the React app sends it as `Authorization: Bearer <token>`
  and the API's `protect` middleware verifies it on every protected route (401 when missing or expired)
- Role checks on the server (`adminOnly`, 403) and in the UI: `RoleRoute` blocks pet owners from `/admin/*`
- Owners only ever see their own pets and appointments (others' records return 404)
- `ProtectedRoute` sends guests to `/login` and **remembers the page they wanted** (e.g. `/owner/book?vet=…`);
  an expired session logs the user out automatically
- Every form is validated in the browser **and again on the server** with the same shared rules
- No double-booking: each booking is re-checked before saving, and MongoDB unique indexes reject two
  bookings of the same vet or pet slot even if they arrive at the same moment
- Same "Invalid email or password" message for any failed login; rate limits on login, register and contact
- helmet security headers, CORS limited to the React app, NoSQL-injection sanitizing

More details: [`server/README.md` → Security checklist](server/README.md#security-checklist).

## Backend (API)

`client/src/services/` is the only place that talks to the server: each function makes one Axios call
through `src/api/axiosClient.js`, e.g.

```js
export async function getMyPets() {
  const { data } = await axiosClient.get('/pets/mine');
  return data;
}
```

The API lives in `/server` (Express routes → controllers → Mongoose models). The full endpoint list,
the JWT flow and troubleshooting are in [`server/README.md`](server/README.md).

## Photos

`client/public/images/` holds **real free photos from Unsplash** with the exact file names the app uses
(credits in [`client/public/images/README.md`](client/public/images/README.md)). To change one, replace the file with
another of the same name. Missing or broken images fall back to a light-blue gradient with a paw icon.

## Acknowledgements

The appointment rules (10-minute slots, multi-pet visits, queue numbers, rebook/cancel), pet options and
form-validation patterns are adapted from the team's **PawCruz Veterinary Management System** (`final-vet`).
