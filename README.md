# EventSphere Management

A full-stack (MERN) web app for organizing expos and trade shows. Organizers create expos and floor plans, exhibitors apply and book booths, and attendees register, plan their visit and chat with exhibitors. Updates happen in real time.

## The problem it solves

EventSphere Management is an event firm that runs large expos and trade shows. Its organizers, exhibitors and attendees had to deal with:

- **Manual registration** for exhibitors and visitors.
- **Disjointed communication** between organizers, exhibitors and attendees.
- **No real-time information** about schedules, booth allocations and event changes.

This project replaces those manual steps with one online system: one place for expo details, booth booking, session schedules, chat, notifications and reports.

---

## Features

### Admin / Organizer
- Create, edit and delete expos (title, dates, location, description, theme, banner).
- Change the expo status: draft → published → ongoing → completed (or cancelled).
- Build the **floor plan**: a grid of rows and columns where you add, edit, move and delete booths (number, hall, size, price).
- Review exhibitor applications: approve (and optionally assign a booth) or reject with a note.
- Assign or unassign booths manually.
- Create the **session schedule** with speakers, topics, locations and capacity. Location clashes and times outside the expo dates are blocked.
- Edit or cancel sessions. Registered and bookmarked users are notified.
- **Analytics**: attendees per day, booth traffic (top booths), session popularity, booth and application status, feedback rating. Updates live.
- Manage users (filter by role, disable or activate accounts).
- Read and answer user feedback.
- Answer support chats from exhibitors.

### Exhibitor
- Register with a company name. Complete the company profile (logo, description, category, products/services, website, contact).
- Upload private documents (PDF or images). Only the exhibitor and admins can download them.
- Apply to a published expo with a message and up to 5 preferred booths. Withdraw a pending application.
- See available booths on the live floor plan and **reserve** one.
- Manage the booth: products showcased and staff members.
- Chat with the organizer (support) and with other exhibitors in the same expo.

### Attendee
- Browse published expos, see details, schedule, exhibitor list and floor plan.
- Register for an expo and get a **ticket code**. Register for sessions and workshops (seat limit is checked).
- **Bookmark** sessions and choose when to get a reminder (15, 30 or 60 minutes before).
- Search and filter exhibitors by keyword, product or category. See their profile and booth on the floor plan.
- Start a chat with an exhibitor.

### General
- Secure login with roles, forgot / reset password by email.
- **Real-time updates** with socket.io: floor plan, schedule, expo details, registrations, chat and notifications.
- Notification bell with unread count, "mark all as read".
- Feedback form (suggestion, issue, complaint, other) with optional rating.
- Privacy setting: choose if others can see your email and phone.
- Responsive design that works on mobile.

---

## Tech stack

| Part | Technology |
|------|------------|
| Database | MongoDB with Mongoose |
| Backend | Node.js, Express 5 |
| Frontend | React 19 + Vite |
| Styling | Tailwind CSS v4 |
| Real time | Socket.io (server and client) |
| Auth | JSON Web Tokens (jsonwebtoken), bcryptjs |
| Validation | express-validator |
| Security | helmet, cors, express-rate-limit |
| Files | multer (images and PDFs, max 5 MB) |
| Email | nodemailer |
| Reminders | node-cron (runs every minute) |
| Frontend libraries | react-router-dom, axios, react-hot-toast, lucide-react (icons), recharts (charts) |

---

## Folder structure

```
eventsphere/
├── backend/
│   ├── config/          # MongoDB connection
│   ├── controllers/     # Logic for each module (expo, booth, session, ...)
│   ├── middleware/      # auth (JWT + roles), validation, uploads, rate limits, errors
│   ├── models/          # Mongoose schemas (13 collections)
│   ├── routes/          # Express routes, one file per module
│   ├── validators/      # express-validator rules
│   ├── utils/           # socket.io, notifications, email, reminder job, helpers
│   ├── scripts/         # seedDemo.js, createAdmin.js
│   ├── uploads/         # Public files (avatars, logos, banners)
│   ├── private_uploads/ # Private exhibitor documents
│   ├── app.js           # Express app
│   └── server.js        # Starts HTTP + socket.io server
├── frontend/
│   └── src/
│       ├── api/         # axios instance and API helpers
│       ├── context/     # Auth, Socket and Notification contexts
│       ├── components/  # UI parts (floor plan, chat, sessions, ui kit, ...)
│       ├── layouts/     # Auth layout and dashboard layout
│       ├── pages/       # admin/, exhibitor/, attendee/, auth/, common/
│       └── utils/       # constants, helpers, sidebar links
└── docs/                # API, user guide, database docs, screenshots
```

---

## Setup

### 1. Requirements
- **Node.js** 20 or newer (with npm)
- **MongoDB** 6 or newer, running locally, or a free MongoDB Atlas cluster
- Git

### 2. Clone
```bash
git clone <your-repo-url> eventsphere
cd eventsphere
```

### 3. Install packages
```bash
cd backend
npm install
cd ../frontend
npm install
```

### 4. Create the `.env` files

Copy the example files and fill in your values:

```bash
# from the project root
cp backend/.env.example backend/.env
cp frontend/.env.example frontend/.env
```

**backend/.env**

| Variable | Example | What it is |
|----------|---------|------------|
| `PORT` | `3000` | Port of the API and socket.io server. |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/eventsphere` | MongoDB connection string. |
| `JWT_SECRET` | a long random string | Secret used to sign login tokens. Keep it private. |
| `JWT_EXPIRE` | `7d` | How long a login stays valid. |
| `CLIENT_URL` | `http://localhost:5173` | Frontend address. Only this address may call the API (CORS) and connect to socket.io. Also used in the reset password link. |
| `SMTP_HOST` | `smtp.gmail.com` | Email server. **Leave empty** to print emails (like the reset link) in the backend console. |
| `SMTP_PORT` | `587` | Email server port. |
| `SMTP_USER` | your email | Email login. |
| `SMTP_PASS` | app password | Email password (for Gmail, use an App Password). |
| `SMTP_FROM` | `EventSphere <no-reply@...>` | "From" name and address. Defaults to `SMTP_USER`. |
| `ADMIN_NAME` | `EventSphere Admin` | Name of the first admin (only for `npm run seed:admin`). |
| `ADMIN_EMAIL` | `admin@example.com` | Email of the first admin. |
| `ADMIN_PASSWORD` | a strong password | Password of the first admin. |

**frontend/.env**

| Variable | Example | What it is |
|----------|---------|------------|
| `VITE_API_URL` | `http://localhost:3000/api` | Address of the REST API. |
| `VITE_SOCKET_URL` | `http://localhost:3000` | Address of the socket.io server. |

### 5. Add data

Choose **one** option (inside the `backend` folder):

```bash
# Option A: full demo data (expos, booths, sessions, users, chats, ...)
npm run seed:demo

# Option B: only one admin account from ADMIN_* in .env
npm run seed:admin
```

> **Warning:** `seed:demo` deletes **all** data in the database and all uploaded files before creating the demo data.

### 6. Run

Open two terminals:

```bash
# Terminal 1 - backend (http://localhost:3000)
cd backend
npm run start:dev     # or: npm start

# Terminal 2 - frontend (http://localhost:5173)
cd frontend
npm run dev
```

Open **http://localhost:5173** in the browser. Check the API with http://localhost:3000/api/health.

---

## Demo accounts

Created by `npm run seed:demo`.

| Role | Name | Email | Password |
|------|------|-------|----------|
| Admin | EventSphere Admin | admin@eventsphere.com | `Admin@12345` |
| Exhibitor | Usman Siddiqui (NexaByte Technologies) | usman@nexabyte.pk | `Demo@1234` |
| Exhibitor | Hina Malik (Lahori Zaiqa Foods) | hina@lahorizaiqa.pk | `Demo@1234` |
| Exhibitor | Sana Qureshi (Kaarigar Couture) | sana@kaarigar.pk | `Demo@1234` |
| Exhibitor | Faisal Chaudhry (IndusDrive Motors) | faisal@indusdrive.pk | `Demo@1234` |
| Exhibitor | Dr. Amna Rizvi (Roshan Learning) | amna@roshanlearning.pk | `Demo@1234` |
| Exhibitor | Dr. Kamran Shah (ShifaCare Health) | kamran@shifacare.pk | `Demo@1234` |
| Attendee | Ayesha Khan | ayesha.khan@demo.pk | `Demo@1234` |
| Attendee | Ali Raza | ali.raza@demo.pk | `Demo@1234` |
| Attendee | Fatima Noor | fatima.noor@demo.pk | `Demo@1234` |
| Attendee | Bilal Ahmed | bilal.ahmed@demo.pk | `Demo@1234` |
| Attendee | Zainab Hussain | zainab.hussain@demo.pk | `Demo@1234` |
| Attendee | Hamza Tariq | hamza.tariq@demo.pk | `Demo@1234` |
| Attendee | Mariam Javed | mariam.javed@demo.pk | `Demo@1234` |
| Attendee | Omar Farooq | omar.farooq@demo.pk | `Demo@1234` |

**Best accounts to try first:**
- **Admin** `admin@eventsphere.com`: analytics, a pending application to approve, feedback.
- **Exhibitor** `usman@nexabyte.pk`: booked booth, approved + pending application, unread messages.
- **Attendee** `ayesha.khan@demo.pk`: registrations, ticket, bookmarks, chat with an exhibitor.

The demo data has two published expos (Pakistan Tech Summit 2026 in Karachi, Lahore Food & Lifestyle Expo 2026), one draft expo, booths, sessions, registrations, about 290 booth visits, chats, notifications and feedback. More details: [backend/DEMO_ACCOUNTS.md](backend/DEMO_ACCOUNTS.md).

> These passwords are for local demos only. Change them before putting the app online.

---

## How it works

### Security
- **Passwords** are hashed with bcrypt before saving. They are never sent back by the API.
- **Login** gives a JWT token. The frontend sends it as `Authorization: Bearer <token>`. When a password changes, older tokens stop working.
- **Roles**: every protected route checks the role (`admin`, `exhibitor`, `attendee`). Owner checks are done too (for example, only the booth owner can edit booth staff).
- **Reset password**: a random token is emailed, only its hash is saved, and it expires after 15 minutes. The reply is the same whether the email exists or not.
- **Rate limits** on login (10 / 15 min), register (10 / hour) and forgot password (5 / hour).
- **Validation** of every input with express-validator. Search text is escaped before use in MongoDB queries.
- **helmet** sets safe HTTP headers. **CORS** allows only `CLIENT_URL`.
- **Uploads**: only JPG, PNG, WEBP (and PDF for documents), max 5 MB, random file names.
- Server errors are logged on the server, but the client only sees "Server error".
- Disabled users cannot log in and are disconnected from socket.io right away.

### Real time (socket.io)
- The socket connects with the same JWT token.
- Each user joins a private room (their user id) for **chat messages** and **notifications**.
- Expo pages join a room for that expo and receive **booth**, **schedule**, **expo** and **registration** updates, so the floor plan, schedule and analytics refresh without reloading.
- A cron job runs every minute and sends **session reminders** for bookmarked sessions.

Full event list: [docs/API.md](docs/API.md#socketio-events).

### Privacy
- At registration users must accept the Terms and Privacy Policy. The time of consent is saved.
- **Show my contact info** setting: attendees hide email and phone by default, exhibitors share by default. Users can change it on the Profile page. Admins can always see contact details.
- Exhibitor **documents** are saved in a private folder and are not public URLs. Only the owner and admins can download them.
- Booth **staff** details (with phone numbers) are only shown to the booth owner and admins.
- Draft expos are hidden from everyone except admins.
- Live socket events send only public data.

---

## Screenshots

| Page | Screenshot |
|------|------------|
| Landing page | ![Landing](docs/screenshots/landing.png) |
| Login | ![Login](docs/screenshots/login.png) |
| Admin dashboard | ![Admin dashboard](docs/screenshots/admin-dashboard.png) |
| Floor plan editor | ![Floor plan](docs/screenshots/admin-floor-plan.png) |
| Applications | ![Applications](docs/screenshots/admin-applications.png) |
| Session schedule | ![Sessions](docs/screenshots/admin-sessions.png) |
| Analytics | ![Analytics](docs/screenshots/admin-analytics.png) |
| Exhibitor profile | ![Exhibitor profile](docs/screenshots/exhibitor-profile.png) |
| Booth reservation | ![Booth reservation](docs/screenshots/exhibitor-booth.png) |
| Attendee expo page | ![Attendee expo](docs/screenshots/attendee-expo.png) |
| Ticket | ![Ticket](docs/screenshots/attendee-ticket.png) |
| Chat | ![Chat](docs/screenshots/chat.png) |
| Mobile view | ![Mobile](docs/screenshots/mobile.png) |

---

## Documentation

- [docs/API.md](docs/API.md) – every API route, socket events, errors (developer documentation)
- [docs/USER_GUIDE.md](docs/USER_GUIDE.md) – step-by-step guide for each role and FAQ (user documentation)
- [docs/DATABASE.md](docs/DATABASE.md) – MongoDB collections and how they connect
