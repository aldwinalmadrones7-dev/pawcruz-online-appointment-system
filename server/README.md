# PawCruz API — Node.js + Express + MongoDB + JWT

The backend for the PawCruz Veterinary Clinic appointment system. The React app in `/client` calls this
API for everything: accounts, pets, vets, services, bookings, queue numbers and the admin dashboard.

| Part | Used |
| --- | --- |
| Runtime | Node.js 20.19+ (ES modules) |
| Server | Express 5 |
| Database | MongoDB (Atlas or local) with Mongoose 9 |
| Login | JSON Web Token (`jsonwebtoken`), passwords hashed with `bcryptjs` |
| Security | `helmet` headers, `cors` (only the React app), `express-rate-limit` on login/register/contact, request-body sanitizing, server-side validation |

---

## Step-by-step setup

You need **two things running**: MongoDB (the database) and this API. Then you start the React app.

### Step 1 — Get a MongoDB database (choose A or B)

#### Option A: MongoDB Atlas (free cloud database, recommended)

Works on any laptop, nothing to install, and your groupmates and teacher can use the same data.

1. Go to <https://www.mongodb.com/cloud/atlas/register> and sign up (Google sign-in works).
2. Create a cluster and choose the **Free** tier (M0). Pick a region near the Philippines, e.g.
   **AWS / Singapore (ap-southeast-1)**. Name it anything, e.g. `pawcruz`.
3. **Create a database user** (Atlas asks right after creating the cluster, or go to
   *Security → Database Access → Add New Database User*):
   - Authentication: **Password**
   - Username, e.g. `pawcruz_admin`, and a password. Use letters and numbers only, so you
     don't have to URL-encode symbols like `@`, `:` or `/` in the connection string.
   - Role: **Read and write to any database**
4. **Allow your computer to connect**: *Security → Network Access → Add IP Address →
   Add Current IP Address*. If your IP changes often (school Wi-Fi, mobile data), you can use
   `0.0.0.0/0` (allow from anywhere) for the class demo. Remove that entry after your defense.
5. Get the connection string: go to *Database → Connect → Drivers*, choose Node.js, and copy the
   string. It looks like:
   ```
   mongodb+srv://pawcruz_admin:<db_password>@pawcruz.abc123.mongodb.net/?retryWrites=true&w=majority&appName=pawcruz
   ```
6. Replace `<db_password>` with your password, and add the database name **`pawcruz`** right after
   `.mongodb.net/`:
   ```
   mongodb+srv://pawcruz_admin:MyPassw0rd@pawcruz.abc123.mongodb.net/pawcruz?retryWrites=true&w=majority&appName=pawcruz
   ```
   You'll paste this into `.env` in Step 2.

#### Option B: MongoDB on your own computer

1. Download **MongoDB Community Server** (Windows, `.msi`) from
   <https://www.mongodb.com/try/download/community>.
   > On this PC there is an old, empty `C:\Program Files\MongoDB\Server\8.2` folder from a previous
   > install with no program files in it. Run the installer again to get a working copy.
2. Run the installer and choose **Complete**. Keep **Install MongoD as a Service** checked, so
   MongoDB starts automatically with Windows. Leave **Install MongoDB Compass** checked too (it's a
   visual tool for viewing your data).
3. Your connection string is:
   ```
   mongodb://127.0.0.1:27017/pawcruz
   ```

### Step 2 — Configure the API

In the `server` folder, copy `.env.example` to a new file named **`.env`** and edit it:

```ini
PORT=5000
NODE_ENV=development
MONGODB_URI=mongodb+srv://pawcruz_admin:MyPassw0rd@pawcruz.abc123.mongodb.net/pawcruz?retryWrites=true&w=majority
JWT_SECRET=paste-a-long-random-string-here
JWT_EXPIRES_IN=7d
CLIENT_URL=http://localhost:5173
ALLOW_DEMO_RESET=true
```

- **MONGODB_URI**: the connection string from Step 1.
- **JWT_SECRET**: the key that signs login tokens. It must be random and at least 32 characters long.
  Generate one with:
  ```bash
  node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
  ```
- **Never commit or share `.env`** (it is already in `.gitignore`). Share `.env.example` instead.

> A `.env` is already set up on this PC for a local MongoDB (`mongodb://127.0.0.1:27017/pawcruz`)
> with a generated secret. If you use Atlas, only change the `MONGODB_URI` line.

### Step 3 — Install, fill the database, start the API

Open a terminal in the `server` folder:

```bash
npm install        # first time only
npm run seed       # creates the demo data (vets, services, owners, pets, 30 appointments)
npm run dev        # starts the API and restarts it when you change a file
```

You should see:

```
MongoDB connected: …/pawcruz
PawCruz API running on http://localhost:5000/api (development)
```

To check it, open <http://localhost:5000/api/health> in your browser. You should get `{"status":"ok", …}`.

### Step 4 — Start the React app

Open a **second** terminal in the `client` folder:

```bash
npm install        # first time only
npm run dev
```

Open <http://localhost:5173> and log in with a test account:

| Role | Email | Password |
| --- | --- | --- |
| Pet owner | `owner@pawcruz.ph` | `Owner123!` |
| Admin | `admin@pawcruz.ph` | `Admin123!` |

The React app calls `http://localhost:5000/api` by default. If your API runs somewhere else, create
`client/.env` with `VITE_API_URL=https://your-api-address/api` and restart `npm run dev`.

### Step 5 — Look at your data (optional)

- **Atlas:** *Database → Browse Collections*.
- **Local:** open **MongoDB Compass** and connect to `mongodb://127.0.0.1:27017`.

Database `pawcruz` contains the collections `users`, `pets`, `vets`, `services`, `appointments` and
`contactmessages`. Passwords are stored only as bcrypt hashes (`$2b$10$…`).

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the API with auto-restart (`node --watch`) |
| `npm start` | Start the API (for hosting) |
| `npm run seed` | Delete the clinic data and insert fresh demo data |
| `npm run seed:destroy` | Delete all clinic data (contact messages are kept) |

Admins can also click **Dashboard → Reset demo data** in the app when `ALLOW_DEMO_RESET=true`.

---

## Project structure

```
server/
├── .env.example            settings template (copy to .env)
├── package.json
└── src/
    ├── server.js           entry point: checks settings, connects to MongoDB, starts Express
    ├── app.js              Express app: helmet, CORS, JSON body, sanitizing, logging, /api routes, errors
    ├── config/             env.js (reads .env), db.js (Mongoose connection)
    ├── models/             User, Pet, Vet, Service, Appointment, ContactMessage (+ toJSON plugin)
    ├── middleware/         auth.js (protect / adminOnly), errorHandler.js, sanitize.js
    ├── controllers/        auth, pet, vet, service, appointment, patient, contact, demo
    ├── routes/index.js     every endpoint and which middleware guards it
    ├── shared/             booking rules, dates and validators shared with the React app
    ├── seed/               seedData.js (demo data) and seed.js (npm run seed)
    └── utils/              ApiError.js, token.js (sign / verify JWT)
```

`src/shared/` contains copies of `client/src/utils/` (schedule, dates, validators, constants,
appointment rules, pet options). The browser and the server therefore apply **exactly the same** slot
rules and form validation. If you change a rule, change it in both copies.

---

## How login (JWT) works

1. `POST /api/auth/login` checks the email and the bcrypt-hashed password. Any failure returns the
   same message, *"Invalid email or password."*, so nobody can find out which emails have accounts.
2. The server returns `{ token, user }`. The token is signed with `JWT_SECRET` and contains only the
   user's id and role. It expires after `JWT_EXPIRES_IN` (7 days).
3. The React app saves the token and sends it with every request:
   `Authorization: Bearer <token>`.
4. The `protect` middleware verifies the token and loads the user. A missing, invalid or expired token
   returns **401**, and the React app logs out and shows the login page.
5. `adminOnly` returns **403** for pet owners. Owners also never see other owners' pets or
   appointments: those requests return **404**.

## Security checklist

- Passwords are hashed with bcrypt (10 rounds) and never returned (`select: false` plus the toJSON plugin).
- Registration always creates a pet-owner account. A `role` sent by the browser is ignored.
- Every write is validated on the server with the same rules as the forms. Errors come back as
  `{ message, field }`, and the form highlights that field.
- Bookings are re-checked right before saving: date window (today to 60 days ahead), vet on duty,
  slot free, and none of the owner's pets already booked at that time. Two **unique indexes**
  (`vet_slot_unique`, `pet_slot_unique`) make MongoDB itself reject a double booking, even when two
  people click at the same moment.
- Request bodies are stripped of `$` and `.` keys, which blocks NoSQL injection such as
  `{ "email": { "$gt": "" } }`.
- Rate limits: 20 failed login/register attempts per 15 minutes per IP (successful logins don't
  count), and 10 contact messages per 15 minutes per IP.
- Security headers come from `helmet`. CORS allows only the address(es) in `CLIENT_URL`. JSON
  bodies are limited to 100 KB.
- In production, server errors don't reveal internal details.

---

## API reference

Base URL: `http://localhost:5000/api`. **Auth** column: — = public, 🔒 = logged in, 👑 = admin only.

| Method & path | Auth | Purpose |
| --- | --- | --- |
| `GET /health` | — | Check that the API is running |
| `POST /auth/register` | — | Create a pet-owner account → `{ token, user }` |
| `POST /auth/login` | — | Log in → `{ token, user }` |
| `GET /auth/me` | 🔒 | Current user |
| `PUT /auth/me` | 🔒 | Update name, email, phone, address |
| `PUT /auth/password` | 🔒 | Change password |
| `GET /pets/mine` | 🔒 | My pets |
| `GET /pets?ownerId=` | 👑 | Any owner's pets (for walk-ins) |
| `POST /pets` | 🔒 owner | Add a pet |
| `PUT /pets/:id` / `DELETE /pets/:id` | 🔒 | Edit / remove a pet (blocked while it has upcoming visits) |
| `GET /appointments/availability?date=&petIds=a,b&excludeId=` | 🔒 | Free 10-minute slots per vet |
| `GET /appointments/mine` | 🔒 | My appointments |
| `GET /appointments/counts` | 🔒 | Sidebar badge numbers |
| `GET /appointments/stats` | 👑 | Dashboard totals, today, vets on duty, this week |
| `GET /appointments?status=&date=&vetId=&ownerId=&petId=&source=` | 👑 | All appointments (filters optional) |
| `POST /appointments` | 🔒 | Book 1–4 pets back to back → `{ reference, queueNumber, appointments }` |
| `GET /appointments/:id` | 🔒 | One appointment (own only, unless admin) |
| `PATCH /appointments/:id/rebook` | 🔒 | New date/time/vet (owners: online bookings only) |
| `PATCH /appointments/:id/cancel` | 🔒 | Cancel with a reason |
| `PATCH /appointments/:id/status` | 👑 | Mark Completed (on/after the date) or Cancelled |
| `PUT /appointments/:id` | 👑 | Edit reason, notes, source, status, schedule |
| `DELETE /appointments/:id` | 👑 | Delete |
| `GET /vets` / `GET /vets/:id` | — | Veterinarians |
| `POST /vets`, `PUT /vets/:id`, `DELETE /vets/:id` | 👑 | Manage vets (license and email must be unique) |
| `GET /services` / `GET /services/:id` | — | Services (also the "reason for visit" list) |
| `POST /services`, `PUT /services/:id`, `DELETE /services/:id` | 👑 | Manage services |
| `GET /patients` | 👑 | All pets with owner and visit summary |
| `GET /users?role=owner` | 👑 | Pet-owner accounts with pet counts |
| `POST /contact` | — | Send a Contact-page message (saved in MongoDB) |
| `GET /contact` | 👑 | Read contact messages |
| `POST /demo/reset` | 👑 | Restore demo data (needs `ALLOW_DEMO_RESET=true`) |

Errors always look like `{ "message": "…", "field": "email" | null }`, with status 400 (invalid input),
401 (not logged in / session expired), 403 (not allowed), 404 (not found), 409 (conflict, e.g. slot
taken or duplicate email) or 429 (too many attempts).

### Trying the API with Postman or Thunder Client

1. `POST http://localhost:5000/api/auth/login` with body (raw JSON):
   ```json
   { "email": "admin@pawcruz.ph", "password": "Admin123!" }
   ```
2. Copy the `token` from the response.
3. For protected routes, add the header `Authorization: Bearer <token>`, e.g.
   `GET http://localhost:5000/api/appointments/stats`.

---

## Troubleshooting

| Problem | Fix |
| --- | --- |
| `Missing MONGODB_URI and JWT_SECRET` | You don't have `server/.env` yet. Copy `.env.example` to `.env` (Step 2). |
| `JWT_SECRET is too short` | Generate a 32+ character secret with the command in Step 2. |
| `querySrv ECONNREFUSED` (Atlas) | Node couldn't use your PC's DNS settings, a known problem on some Windows PCs. The API already switches to public DNS (8.8.8.8 / 1.1.1.1) when this happens. If it still fails, add `DNS_SERVERS=8.8.8.8,1.1.1.1` to `.env`, or check that your network doesn't block port 27017. |
| `querySrv ENOTFOUND` | The cluster address in `MONGODB_URI` is wrong. Copy it again from Atlas → Connect → Drivers. |
| `ECONNREFUSED 127.0.0.1:27017` (local) | The local MongoDB service isn't running: open *Services* in Windows and start **MongoDB Server**. |
| `bad auth : authentication failed` | Wrong Atlas username/password in `MONGODB_URI`. If the password has symbols, URL-encode them or change the password to letters and numbers. |
| Atlas connection times out | Add your IP in *Network Access* (Step 1A.4). |
| The app shows "Can't reach the PawCruz server" | The API isn't running. Start it with `npm run dev` in `server/`. |
| CORS error in the browser console | The app's address isn't in `CLIENT_URL` (e.g. Vite picked port 5174). Add it, separated by a comma. |
| `EADDRINUSE: 5000` | Another program uses port 5000. Set `PORT=5001` in `server/.env` **and** `VITE_API_URL=http://localhost:5001/api` in `client/.env`. |
| "Too many attempts" | Wait 15 minutes, or restart the API (the limit resets on restart). |

## Hosting (optional, after the class demo)

1. Database: use MongoDB Atlas (Option A).
2. API: deploy the `server` folder to a Node host such as Render or Railway. Start command
   `npm start`, and set the same variables as `.env` there, with `NODE_ENV=production`,
   `CLIENT_URL=https://your-frontend-address` and `ALLOW_DEMO_RESET=false`.
3. React app: deploy `client` to Netlify or Vercel. Build command `npm run build`, output folder
   `dist`, environment variable `VITE_API_URL=https://your-api-address/api`. Also add a rewrite of all
   paths to `/index.html` so React Router links work after a page refresh.
