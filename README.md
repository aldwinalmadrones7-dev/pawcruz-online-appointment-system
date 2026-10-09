# PawCruz Veterinary Clinic — Online Appointment System

> **Compassionate care for every paw.** Book your pet's next visit in under a minute.

A MERN-stack online appointment system for a veterinary clinic, built for **CTADWEBL – Advanced Web
Programming**. Its appointment model follows the team's PawCruz `final-vet` project: pet owners book
**one or more pets** into **10-minute consultation slots**, choosing a **date → available time → a
veterinarian free at that time**. Bookings are confirmed instantly with a **queue number**.

There are two kinds of accounts, chosen on the **Create account** page: **pet owners** and
**veterinarians**. On the visit day, every pet joins a **live queue** (final-vet's queue): the vet checks
the pet in when it arrives, calls it in, and completes the visit. The **Live Queue page** (`/queue`, linked from the navbar and a strip under the home page hero) **shows the live queue**
(who is with each vet, who is next, and the estimated wait). Veterinarians also run the clinic side:
they register walk-ins, manage every appointment, set their own duty days and shift, manage services,
and view all animal patients.

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
│       ├── services/       authService, appointmentService, queueService, petService, vetService,
│       │                   serviceService, patientService, contactService, demoService (one function per API call)
│       ├── data/           siteContent.js (marketing copy)
│       ├── context/        AuthContext.jsx, ThemeContext.jsx
│       ├── hooks/          useAuth, usePagination, useDebounce, useForm, useAsync, usePolling, useAvailability,
│       │                   useCountdown, useInView, useTheme
│       ├── components/     Navbar, Footer, Sidebar, ProtectedRoute, RoleRoute, AppointmentCard, StatusBadge,
│       │                   LiveQueueBoard, MyQueueTickets, QueueLaneManager, QueueStageBadge, SearchBar,
│       │                   PaginationBar, ConfirmModal, EmptyState, LoadingSpinner, ImageWithFallback, StatCard,
│       │                   TimeSlotPicker, PetCard, PetFormModal, VetCard, VetPicker, VetProfileForm,
│       │                   RebookModal, AppointmentFormModal, …
│       ├── layouts/        PublicLayout.jsx, DashboardLayout.jsx, navConfig.js
│       ├── pages/          public/, owner/ (pet-owner portal), vet/ (veterinarian portal), account/ (profile)
│       ├── styles/         theme.css (CSS variables), global.css, components.css, layout.css, pages.css,
│       │                   pawcruz.css, queue.css (live queue board and lanes)
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

| Account | Email | Password |
| --- | --- | --- |
| Pet owner | `owner@pawcruz.ph` | `Owner123!` |
| Veterinarian (Dr. Redmond Lopez, 9 AM–5 PM) | `redmond.lopez@pawcruz.ph` | `Vet12345!` |
| Veterinarian (Dr. Neil Norman A. Cruz, 11 AM–7 PM) | `neil.cruz@pawcruz.ph` | `Vet12345!` |

The login page has **"Pet owner demo" / "Veterinarian demo"** buttons that fill these in. Ten more
sample pet owners (e.g. `paolo.garcia@example.com`) also use `Owner123!`.

**Creating accounts:** on **Create account**, choose **Pet owner** or **Veterinarian**. A veterinarian
also enters a PRC license number, a specialty and the clinic's **veterinarian sign-up code**: `PAWCRUZ-VET`
in development (set your own with `VET_SIGNUP_CODE` in `server/.env`). The code keeps strangers from
opening vet accounts, because vets can see every pet owner's details. New vets go straight to
**My profile → Vet profile & schedule**. They appear on the website and in booking once they save their duty days.

**Demo data:** 2 veterinarians — Dr. Neil Norman A. Cruz and Dr. Redmond Lopez — with their own logins,
8 services, 11 pet owners, 17 pets and 40 appointments dated around *today*. That includes some
upcoming and past visits and a two-pet visit. **Today's visits are placed around the time you seed**,
with live-queue states to match:
finished visits are completed, one patient per vet is with the vet, the next few are checked in and
waiting (one is a late arrival), and later ones haven't arrived. So the Live Queue page is busy
whenever you seed during clinic hours. Restore it anytime with **Dashboard → Reset demo data** (any vet), or
run `npm run seed` in `server/`. Do this right before a presentation for a fresh queue.

## How booking works (same rules as final-vet)

- Clinic hours: **Monday–Sunday, 9:00 AM–7:00 PM**. Slots are **10 minutes**; the last one is 6:50–7:00 PM.
- Two veterinarians, both on duty every day (same hours as final-vet): **Dr. Redmond Lopez 9:00 AM–5:00 PM** and
  **Dr. Neil Norman A. Cruz 11:00 AM–7:00 PM**, so two vet "lanes" are open from 11 AM to 5 PM. Each vet edits
  their own duty days and shift in **My profile → Vet profile & schedule**.
- A time is open when **at least one vet on duty is free**; then you pick from the vets free at that time.
- Booking several pets gives them **back-to-back slots with the same vet** and one booking reference.
- Times already booked, already past, or clashing with one of your pets' bookings are disabled.
- Bookings are **Confirmed** immediately. Queue numbers: online visits **E-001, E-002…** per day; walk-ins
  **#901** style (hour + order in that hour).
- Owners can **cancel** any upcoming visit and **rebook** their online bookings; walk-ins are rebooked at the front desk.
  Once a pet is checked in, its time can no longer be moved.
- The clinic marks visits **Completed** on or after the visit day. Statuses: Confirmed, Completed, Cancelled.
- Every booking is a *General Consultation*; the owner picks the **reason for visit** from the services list.

## How the live queue works (final-vet's queue)

- On the visit day a booking is **Not arrived** until the pet reaches the clinic. A vet then
  **checks it in** at the front desk, and it joins that vet's lane as **Waiting**. A walk-in registered for
  today can be checked in straight away ("the pet is here now").
- Each vet has **one lane** and sees **one patient at a time**. **Call in** moves the next patient to
  **With the vet**, and **Complete visit** marks the visit Completed. **Undo** steps back once (with the vet →
  waiting → not arrived) if someone clicks by mistake.
- Patients wait in **booked-time order**. Checking in more than **15 minutes late** flags a **Late
  arrival**, and that patient queues from the time they checked in, so they never jump ahead of people who came on time.
- Pets booked together are **one ticket** with one queue number. The **estimated wait** is 10 minutes
  for every pet ahead of you in your vet's lane, counting the one with the vet.
- The **Live Queue page** (`/queue`, the **Live Queue** link in the navbar) shows each lane's queue number
  being served, the next patients, waiting counts and estimated waits. It refreshes every 15 seconds and
  shows **only queue numbers and pet names**. A logged-in pet owner also sees "Mochi is 2nd in line…" with
  their own ticket highlighted.

## Features

### Public site
- **Home** — hero with booking CTA, a **live-queue strip** (the number each vet is serving and how many
  are waiting; opens the Live Queue page), how it works (3 steps), featured services, meet-the-vets cards,
  testimonials, clinic hours (today highlighted) and location, FAQ accordion
- **Live Queue** (`/queue`) — a full-screen queue display that fits the screen without scrolling: each
  vet's lane with now serving, next in line, waiting count, estimated wait and late arrivals; live clock;
  refreshes every 15 s and retries by itself if the API is down; your own ticket highlighted when logged in;
  on phones, one lane at a time with buttons to switch
- **Services** — debounced search, category filter, sorting, ₱ starting price and duration on each card
- **Veterinarians** — photo, specialty, rating, duty days and shift; **profile page** with
  bio, education, PRC license, schedule and "Book with this vet"
- **About** and **Contact** (validated message form)
- **Login / Register** — full-screen pages that fit the screen; **account type (Pet owner / Veterinarian)**
  chosen with two cards (`/register?role=vet` preselects Veterinarian); vets also enter PRC license,
  specialty and the clinic sign-up code; required fields, email format, password ≥ 8 chars with a number and an uppercase
  letter (live checklist), confirm password, PH mobile `09XXXXXXXXX` (non-digits stripped as you type),
  Data Privacy Act (RA 10173) consent, show/hide password, loading states, inline errors that update as you
  fix them, focus jumps to the first invalid field
- **404** and **403 Not Authorized** pages

### Pet-owner portal (login required)
- **Dashboard** — greeting, **today's queue** (your queue number, place in line, visits ahead and
  estimated wait; refreshes itself), stats (upcoming, completed, cancelled, pets), next visit with queue number and
  live countdown, my pets strip, quick actions, pet-care tip of the day
- **My Pets** — add / edit / remove pets (species & breed lists from final-vet, sex, birth date, weight,
  color, microchip, notes); removing is blocked while a pet has upcoming visits
- **Book Appointment** — 4-step wizard with progress bar: pets & reason → date & available time →
  veterinarian → review & confirm; add a pet on the spot; live appointment summary; confirmation screen
  with queue number, booking reference (copy), each pet's slot and **Add to calendar (.ics)**
- **Appointments** — table on desktop, cards on mobile; debounced search, status and pet filters, date
  sorting, pagination (5 per page, adjustable), rebook modal, cancel with confirmation + reason
- **Appointment details** — queue number, status timeline (booked → checked in → with the vet → completed),
  pet profile, vet, reminders, rebook / cancel / print
- **Profile** — edit contact details (validated), avatar preview, change password

### Veterinarian portal (veterinarian accounts only)
- **Dashboard** — greeting, KPI cards (today's appointments, patients in the queue now, completed this month,
  registered pets), **your queue right now** (who is with you, next in line), vets on duty with waiting counts,
  appointments-per-day bar chart for the week (plain SVG, hover/keyboard tooltips, table view), status
  overview, today's schedule with each visit's queue stage, a reminder when your schedule is empty
- **Live Queue** — final-vet's Queue Management: today's counts, one lane per vet (yours first): with the vet
  (**Complete visit** / back to waiting), the waiting line in order (**Call in**, one patient at a time, undo
  check-in), not arrived yet (**Check in**), done today; search by pet, owner, mobile or queue number;
  **register a walk-in** straight into the queue; refreshes every 15 s; sidebar badge = patients waiting
- **Appointments** — full CRUD: register walk-ins (owner → pets → reason → date → time → vet), edit,
  delete, mark completed, rebook, cancel with reason (incl. no-show); search, status / vet / source / date
  filters, pagination; shows who is waiting or with the vet today
- **Animal Patients** — read-only searchable, paginated list of pets with owners and visit history
- **Services** — add / edit / delete services and starting prices
- **My Profile** — account details, password, and **Vet profile & schedule**: specialty, PRC license,
  experience, photo, bio, duty days and shift hours (these drive the booking slots)

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
- Two roles only, `owner` and `vet`: registration rejects any other role, and **vet accounts need the clinic's
  sign-up code** (`VET_SIGNUP_CODE`, compared in constant time; wrong codes count toward the sign-up rate limit)
- Role checks on the server (`vetOnly` / `ownerOnly`, 403) and in the UI: `RoleRoute` keeps pet owners out of
  `/vet/*` and vets out of `/owner/*`
- Owners only ever see their own pets and appointments (others' records return 404)
- The public live queue board shows only queue numbers and pet names; owner names and mobile numbers are
  only in the vets' queue view
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
