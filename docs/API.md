# EventSphere API Documentation

Developer reference for the EventSphere backend (Express + MongoDB + Socket.io).

- **Base URL:** `http://localhost:3000/api`
- **Socket.io URL:** `http://localhost:3000`
- **Uploaded public files:** `http://localhost:3000/uploads/<file-name>`
- All request and response bodies are JSON, except file uploads (`multipart/form-data`).
- Dates use ISO 8601 format, e.g. `2026-12-08T10:00:00.000Z`.
- All ids are MongoDB ObjectIds (24 hex characters).

## Contents

1. [Authentication and roles](#authentication-and-roles)
2. [Health](#health)
3. [Auth](#auth) – `/api/auth`
4. [Expos](#expos) – `/api/expos`
5. [Booths](#booths) – `/api/booths`
6. [Exhibitor applications](#exhibitor-applications) – `/api/applications`
7. [Exhibitors](#exhibitors) – `/api/exhibitors`
8. [Sessions](#sessions) – `/api/sessions`
9. [Registrations](#registrations) – `/api/registrations`
10. [Bookmarks](#bookmarks) – `/api/bookmarks`
11. [Conversations and messages](#conversations-and-messages) – `/api/conversations`
12. [Notifications](#notifications) – `/api/notifications`
13. [Feedback](#feedback) – `/api/feedback`
14. [Analytics](#analytics) – `/api/analytics`
15. [Admin users](#admin-users) – `/api/admin`
16. [Uploads](#uploads) – `/api/uploads`
17. [Socket.io events](#socketio-events)
18. [Errors and status codes](#errors-and-status-codes)

---

## Authentication and roles

Log in (or register) to get a JWT token, then send it in every protected request:

```
Authorization: Bearer <token>
```

The "Access" column in each table means:

| Access | Meaning |
|--------|---------|
| **Public** | No token needed. |
| **Public\*** | No token needed. If a valid token is sent, the result can change (for example, admins also see draft expos). |
| **Logged in** | Any role, valid token required. |
| **Admin** / **Exhibitor** / **Attendee** | Only that role. Other roles get `403`. |

A token stops working when it expires (`JWT_EXPIRE`), when the password is changed, or when the account is disabled.

---

## Health

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/health` | Public | Checks that the API is running. |

```json
{ "status": "ok", "message": "EventSphere API is running" }
```

---

## Auth

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| POST | `/api/auth/register` | Public (rate limited: 10 / hour) | Create an account. |
| POST | `/api/auth/login` | Public (rate limited: 10 / 15 min) | Log in. |
| GET | `/api/auth/me` | Logged in | Current user (and exhibitor profile). |
| PUT | `/api/auth/me` | Logged in | Update name, phone, privacy setting. |
| POST | `/api/auth/forgot-password` | Public (rate limited: 5 / hour) | Email a reset link. |
| PUT | `/api/auth/reset-password/:token` | Public | Set a new password with the emailed token. |
| PUT | `/api/auth/update-password` | Logged in | Change password (needs current password). |

### POST /api/auth/register

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | yes | not empty |
| `email` | string | yes | valid email, must be unique |
| `password` | string | yes | at least 6 characters |
| `role` | string | no | `exhibitor` or `attendee` (default `attendee`). Admins cannot register here. |
| `phone` | string | no | |
| `companyName` | string | only for exhibitors | not empty. An exhibitor profile is created with this name. |
| `termsAccepted` | boolean | yes | must be `true` |

Response `201`:

```json
{
  "success": true,
  "message": "Registration successful",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "665f1c...",
    "name": "Ayesha Khan",
    "email": "ayesha.khan@demo.pk",
    "role": "attendee",
    "avatar": "",
    "isActive": true,
    "showContactInfo": false,
    "consent": { "termsAccepted": true, "acceptedAt": "2026-11-04T09:00:00.000Z" },
    "createdAt": "...",
    "updatedAt": "..."
  }
}
```

### POST /api/auth/login

| Field | Type | Required |
|-------|------|----------|
| `email` | string | yes |
| `password` | string | yes |

Response `200`: same shape as register (`message: "Login successful"`).
Errors: `401` "Invalid email or password", `403` "Your account has been disabled".

### GET /api/auth/me

```json
{
  "success": true,
  "user": { "_id": "...", "name": "Usman Siddiqui", "role": "exhibitor", "...": "..." },
  "profile": { "_id": "...", "companyName": "NexaByte Technologies", "...": "..." }
}
```

`profile` is `null` for admins and attendees.

### PUT /api/auth/me

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `name` | string | no | not empty |
| `phone` | string | no | |
| `showContactInfo` | boolean | no | Show my email and phone to other users. |

Response `200`: `{ "success": true, "message": "Profile updated", "user": { ... } }`

### POST /api/auth/forgot-password

Body: `{ "email": "user@example.com" }`

Always replies `200` with the same message (so nobody can check which emails exist):

```json
{ "success": true, "message": "If this email is registered, a reset link has been sent" }
```

The link is `CLIENT_URL/reset-password/<token>` and is valid for 15 minutes. If `SMTP_HOST` is empty, the email is printed in the backend console.

### PUT /api/auth/reset-password/:token

Body: `{ "password": "newpass123" }` (at least 6 characters)

Response `200`: token + user (`message: "Password reset successful"`). Error `400`: "Reset link is invalid or has expired".

### PUT /api/auth/update-password

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `currentPassword` | string | yes | |
| `newPassword` | string | yes | at least 6 characters |

Response `200`: a **new** token + user (old tokens stop working). Error `401`: "Current password is incorrect".

---

## Expos

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/expos` | Public\* | List expos. |
| GET | `/api/expos/:id` | Public\* | One expo. |
| POST | `/api/expos` | Admin | Create an expo (status starts as `draft`). |
| PUT | `/api/expos/:id` | Admin | Update expo details. |
| DELETE | `/api/expos/:id` | Admin | Delete the expo and all its data. |
| PATCH | `/api/expos/:id/status` | Admin | Change the status. |
| POST | `/api/expos/:id/banner` | Admin | Upload a banner image. |

Nested routes of an expo (documented in their own modules below):

| Method | URL | Access | Module |
|--------|-----|--------|--------|
| GET | `/api/expos/:expoId/booths` | Public\* | [Booths](#booths) |
| POST | `/api/expos/:expoId/booths` | Admin | [Booths](#booths) |
| POST | `/api/expos/:expoId/applications` | Exhibitor | [Applications](#exhibitor-applications) |
| GET | `/api/expos/:expoId/applications` | Admin | [Applications](#exhibitor-applications) |
| GET | `/api/expos/:expoId/sessions` | Public\* | [Sessions](#sessions) |
| POST | `/api/expos/:expoId/sessions` | Admin | [Sessions](#sessions) |
| POST | `/api/expos/:expoId/register` | Attendee | [Registrations](#registrations) |
| GET | `/api/expos/:expoId/registrations` | Admin | [Registrations](#registrations) |
| GET | `/api/expos/:expoId/exhibitors` | Public\* | [Exhibitors](#exhibitors) |

### GET /api/expos

| Query | Description |
|-------|-------------|
| `status` | `draft`, `published`, `ongoing`, `completed` or `cancelled` |
| `search` | Part of the title (not case sensitive) |

Non-admins and guests never see `draft` expos. Sorted by start date.

```json
{
  "success": true,
  "count": 1,
  "expos": [
    {
      "_id": "6660a1...",
      "title": "Pakistan Tech Summit 2026",
      "description": "Pakistan's biggest technology expo...",
      "theme": "Technology",
      "startDate": "2026-12-08T00:00:00.000Z",
      "endDate": "2026-12-10T00:00:00.000Z",
      "location": "Expo Centre, Karachi",
      "banner": "/uploads/demo-banner-tech-summit.svg",
      "status": "published",
      "floorPlan": { "rows": 4, "cols": 5 },
      "organizer": { "_id": "...", "name": "EventSphere Admin" },
      "createdAt": "...",
      "updatedAt": "..."
    }
  ]
}
```

### GET /api/expos/:id

Response `200`: `{ "success": true, "expo": { ... } }`. A draft expo returns `404` for non-admins.

### POST /api/expos

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | yes | not empty |
| `description` | string | no | |
| `theme` | string | no | |
| `startDate` | date | yes | ISO 8601 |
| `endDate` | date | yes | ISO 8601, not before `startDate` |
| `location` | string | yes | not empty |
| `floorPlan.rows` | number | no | 1–50 (default 5) |
| `floorPlan.cols` | number | no | 1–50 (default 5) |

Response `201`: `{ "success": true, "message": "Expo created", "expo": { ... } }`

### PUT /api/expos/:id

Same fields as create, all optional. Status cannot be changed here.
Response `200`: `{ "success": true, "message": "Expo updated", "expo": { ... } }`. Emits `expo_updated`.

### DELETE /api/expos/:id

Deletes the expo and its booths, sessions, applications, registrations, bookmarks, booth visits, conversations and messages. Registered attendees and exhibitors get a notification first.

Response `200`: `{ "success": true, "message": "Expo deleted" }`

### PATCH /api/expos/:id/status

Body: `{ "status": "published" }`

Allowed changes:

| From | To |
|------|----|
| `draft` | `published`, `cancelled` |
| `published` | `ongoing`, `cancelled` |
| `ongoing` | `completed`, `cancelled` |
| `completed` | `cancelled` |
| `cancelled` | – |

Response `200`: `{ "success": true, "message": "Expo status changed to published", "expo": { ... } }`
Error `400`: "Status cannot change from draft to completed".

### POST /api/expos/:id/banner

`multipart/form-data` with field **`banner`** (JPG, PNG or WEBP, max 5 MB).

```json
{ "success": true, "message": "Banner uploaded", "banner": "/uploads/665f...-1730700000000-a1b2c3.png" }
```

---

## Booths

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/expos/:expoId/booths` | Public\* | Floor plan: all booths of an expo. |
| POST | `/api/expos/:expoId/booths` | Admin | Add a booth to the floor plan. |
| PUT | `/api/booths/:id` | Admin | Edit or move a booth. |
| DELETE | `/api/booths/:id` | Admin | Delete a booth (not when booked). |
| PATCH | `/api/booths/:id/assign` | Admin | Book a booth for an exhibitor. |
| PATCH | `/api/booths/:id/unassign` | Admin | Make a booth available again. |
| POST | `/api/booths/:id/reserve` | Exhibitor | Reserve an available booth. |
| DELETE | `/api/booths/:id/reserve` | Exhibitor | Cancel my reservation. |
| PUT | `/api/booths/:id/details` | Exhibitor (booth owner) | Update products and staff. |
| POST | `/api/booths/:id/visit` | Logged in | Record a booth visit (for analytics). |

Booth status: `available` → `reserved` (by exhibitor) → `booked` (confirmed by admin). An exhibitor can hold only **one** booth per expo.

### GET /api/expos/:expoId/booths

Query: `status` (`available`, `reserved`, `booked`), optional.

```json
{
  "success": true,
  "count": 14,
  "floorPlan": { "rows": 4, "cols": 5 },
  "booths": [
    {
      "_id": "6661b2...",
      "expo": "6660a1...",
      "boothNumber": "A1",
      "hall": "Hall A",
      "position": { "row": 0, "col": 0 },
      "size": "large",
      "price": 150000,
      "status": "booked",
      "exhibitor": { "_id": "...", "name": "Usman Siddiqui" },
      "companyName": "NexaByte Technologies",
      "productsShowcased": ["Smart sensors", "Cloud POS"]
    }
  ]
}
```

`staff` is only included for admins and the booth owner.

### POST /api/expos/:expoId/booths

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `boothNumber` | string | yes | unique inside the expo |
| `hall` | string | no | |
| `position.row` | number | yes | 0 to `floorPlan.rows - 1` |
| `position.col` | number | yes | 0 to `floorPlan.cols - 1` |
| `size` | string | no | `small`, `medium` (default), `large` |
| `price` | number | no | 0 or more |

Two booths cannot use the same position. Response `201`: `{ "success": true, "message": "Booth created", "booth": { ... } }`

### PUT /api/booths/:id

Same fields as create, all optional. Response `200`: `{ "success": true, "message": "Booth updated", "booth": { ... } }`

### DELETE /api/booths/:id

A `booked` booth cannot be deleted. If it was `reserved`, the exhibitor is notified.
Response `200`: `{ "success": true, "message": "Booth deleted" }`

### PATCH /api/booths/:id/assign

Body: `{ "exhibitorId": "<user id of an active exhibitor>" }`

Works on an `available` booth, or a booth `reserved` by the same exhibitor. The booth becomes `booked` and is linked to the exhibitor's application (if any).

```json
{ "success": true, "message": "Booth assigned to Usman Siddiqui", "booth": { "status": "booked", "...": "..." } }
```

### PATCH /api/booths/:id/unassign

Frees a `reserved` or `booked` booth and clears products and staff. The exhibitor is notified.
Response `200`: `{ "success": true, "message": "Booth is available again", "booth": { ... } }`

### POST /api/booths/:id/reserve

No body. The expo must be `published` or `ongoing`, the booth `available`, and the exhibitor must not hold another booth in this expo.
Response `200`: `{ "success": true, "message": "Booth reserved", "booth": { "status": "reserved", "...": "..." } }`
Error `400`: "Booth was just taken by someone else" (two exhibitors clicked at the same time).

### DELETE /api/booths/:id/reserve

Response `200`: `{ "success": true, "message": "Reservation cancelled", "booth": { ... } }`

### PUT /api/booths/:id/details

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `productsShowcased` | string[] | no | list of product names |
| `staff` | object[] | no | each: `name` (required), `role`, `phone` |

```json
{
  "productsShowcased": ["Smart sensors", "Cloud POS"],
  "staff": [{ "name": "Ali Khan", "role": "Sales lead", "phone": "0300 1234567" }]
}
```

Response `200`: `{ "success": true, "message": "Booth details updated", "booth": { ... } }`. Error `403` if you are not the booth owner.

### POST /api/booths/:id/visit

Body (optional): `{ "source": "floor_plan" }` – `floor_plan` (default) or `check_in`.
A visit is counted once per user per booth per hour.

- `201`: `{ "success": true, "message": "Visit recorded", "visit": { ... } }`
- `200`: `{ "success": true, "message": "Visit already counted in the last hour" }`

---

## Exhibitor applications

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| POST | `/api/expos/:expoId/applications` | Exhibitor | Apply to a published expo. |
| GET | `/api/expos/:expoId/applications` | Admin | All applications of an expo. |
| GET | `/api/applications/my` | Exhibitor | My applications. |
| PATCH | `/api/applications/:id/withdraw` | Exhibitor (owner) | Withdraw a pending application. |
| GET | `/api/applications/:id` | Admin | One application with full profile. |
| PATCH | `/api/applications/:id/approve` | Admin | Approve (optionally book a booth). |
| PATCH | `/api/applications/:id/reject` | Admin | Reject with a note. |

Status: `pending`, `approved`, `rejected`, `withdrawn`. One application per exhibitor per expo (a withdrawn one can be sent again).

### POST /api/expos/:expoId/applications

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `message` | string | yes | 1–1000 characters |
| `preferredBooths` | string[] | no | up to 5 booth ids of this expo |

```json
{
  "success": true,
  "message": "Application submitted",
  "application": {
    "_id": "6662c3...",
    "expo": "6660a1...",
    "exhibitor": "665f1c...",
    "profile": "665f1d...",
    "message": "We will showcase our IoT products.",
    "preferredBooths": ["6661b2..."],
    "assignedBooth": null,
    "status": "pending",
    "adminNote": ""
  }
}
```

### GET /api/expos/:expoId/applications

Query: `status` (optional). Each application includes `exhibitor` (name, email, phone), `profile` (companyName, logo, category, website, contact), `preferredBooths` and `assignedBooth`.

```json
{ "success": true, "count": 5, "applications": [ { "...": "..." } ] }
```

### GET /api/applications/my

Includes `expo` (title, dates, location, status), `preferredBooths` and `assignedBooth`.

### PATCH /api/applications/:id/withdraw

Only `pending` applications. Any booth the exhibitor holds in that expo is freed.
Response `200`: `{ "success": true, "message": "Application withdrawn", "application": { ... } }`

### PATCH /api/applications/:id/approve

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `boothId` | string | no | A booth in this expo that is free or already held by this exhibitor. It becomes `booked`. |
| `adminNote` | string | no | |

The exhibitor gets a notification. Response `200`: `{ "success": true, "message": "Application approved", "application": { ... } }`

### PATCH /api/applications/:id/reject

Body: `{ "adminNote": "Food category is full." }` (required). Booths held by the exhibitor in this expo are freed. The exhibitor gets a notification.
Response `200`: `{ "success": true, "message": "Application rejected", "application": { ... } }`

---

## Exhibitors

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/expos/:expoId/exhibitors` | Public\* | Search exhibitors in an expo. |
| GET | `/api/exhibitors/:id` | Public\* | One exhibitor profile (`:id` = user id). |
| PUT | `/api/exhibitors/profile` | Exhibitor | Update my company profile. |
| POST | `/api/exhibitors/profile/logo` | Exhibitor | Upload logo. |
| POST | `/api/exhibitors/profile/documents` | Exhibitor | Upload private documents. |
| DELETE | `/api/exhibitors/profile/documents/:docId` | Exhibitor | Delete a document. |
| GET | `/api/exhibitors/:id/documents/:docId` | Admin, or the exhibitor who owns it | Download a document. |

### GET /api/expos/:expoId/exhibitors

| Query | Description |
|-------|-------------|
| `search` | Matches company name, description or products/services |
| `category` | Exact category, e.g. `Technology` (not case sensitive) |

Lists active exhibitors with an approved application or a booked booth. Documents are never included. Email and phone are removed if the exhibitor hides them.

```json
{
  "success": true,
  "count": 1,
  "exhibitors": [
    {
      "_id": "665f1d...",
      "user": "665f1c...",
      "companyName": "NexaByte Technologies",
      "logo": "/uploads/demo-logo-nexabyte-technologies.svg",
      "description": "Software and IoT solutions...",
      "category": "Technology",
      "productsServices": ["IoT", "Cloud POS"],
      "website": "https://nexabyte.pk",
      "contact": { "person": "Usman Siddiqui", "email": "usman@nexabyte.pk", "phone": "0300 1111111", "address": "Karachi" },
      "booth": { "_id": "6661b2...", "boothNumber": "A1", "hall": "Hall A", "position": { "row": 0, "col": 0 } }
    }
  ]
}
```

### GET /api/exhibitors/:id

Query: `expoId` (optional) – also returns the exhibitor's booked booth in that expo. When an attendee opens it, a `profile_view` booth visit is saved.

```json
{
  "success": true,
  "name": "Usman Siddiqui",
  "profile": { "companyName": "NexaByte Technologies", "contact": { "...": "..." }, "...": "..." },
  "booth": { "_id": "...", "boothNumber": "A1", "hall": "Hall A", "position": { "row": 0, "col": 0 }, "size": "large" },
  "contactHidden": false
}
```

### PUT /api/exhibitors/profile

| Field | Type | Rules |
|-------|------|-------|
| `companyName` | string | not empty |
| `description` | string | |
| `category` | string | |
| `website` | string | |
| `productsServices` | string[] | |
| `contact` | object | `person`, `email` (valid email or empty), `phone`, `address` – only sent fields are changed |

All fields optional. Response `200`: `{ "success": true, "message": "Profile updated", "profile": { ... } }`

### POST /api/exhibitors/profile/logo

`multipart/form-data` field **`logo`** (JPG, PNG, WEBP, max 5 MB).
Response: `{ "success": true, "message": "Logo uploaded", "logo": "/uploads/..." }`

### POST /api/exhibitors/profile/documents

`multipart/form-data` field **`documents`**, up to 5 files (PDF, JPG, PNG, WEBP, max 5 MB each). Saved in a private folder.

```json
{
  "success": true,
  "message": "Documents uploaded",
  "documents": [{ "_id": "6663d4...", "name": "company-registration.pdf", "fileName": "665f1c...-1730700000000-ab12cd.pdf" }]
}
```

### DELETE /api/exhibitors/profile/documents/:docId

Response: `{ "success": true, "message": "Document deleted", "documents": [ ... ] }`

### GET /api/exhibitors/:id/documents/:docId

Returns the file as a download (not JSON). `403` for other users.

---

## Sessions

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/expos/:expoId/sessions` | Public\* | Schedule of an expo. |
| POST | `/api/expos/:expoId/sessions` | Admin | Create a session. |
| GET | `/api/sessions/:id` | Public\* | One session. |
| PUT | `/api/sessions/:id` | Admin | Update a session. |
| PATCH | `/api/sessions/:id/cancel` | Admin | Cancel a session. |
| DELETE | `/api/sessions/:id` | Admin | Delete a session and its registrations and bookmarks. |
| POST | `/api/sessions/:id/register` | Attendee | Register for a session. |
| POST | `/api/sessions/:id/bookmark` | Attendee | Bookmark (or change reminder time). |
| DELETE | `/api/sessions/:id/bookmark` | Attendee | Remove bookmark. |

### GET /api/expos/:expoId/sessions

| Query | Description |
|-------|-------------|
| `date` | `YYYY-MM-DD` – sessions that start on this day |
| `type` | `session`, `workshop`, `keynote`, `panel` |
| `topic` | Exact topic (not case sensitive) |
| `search` | Part of the title or speaker name |

Cancelled sessions are hidden for non-admins. Sorted by start time.

```json
{
  "success": true,
  "count": 1,
  "sessions": [
    {
      "_id": "6664e5...",
      "expo": "6660a1...",
      "title": "AI in Pakistani Startups",
      "description": "...",
      "topic": "AI",
      "type": "keynote",
      "speakers": [{ "name": "Dr. Sara Ahmed", "designation": "CTO, NexaByte", "bio": "..." }],
      "location": "Main Hall",
      "startTime": "2026-12-08T05:00:00.000Z",
      "endTime": "2026-12-08T06:00:00.000Z",
      "capacity": 200,
      "registeredCount": 34,
      "status": "scheduled"
    }
  ]
}
```

### POST /api/expos/:expoId/sessions

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `title` | string | yes | |
| `description` | string | no | |
| `topic` | string | no | |
| `type` | string | no | `session` (default), `workshop`, `keynote`, `panel` |
| `speakers` | object[] | no | each: `name` (required), `designation`, `bio` |
| `location` | string | yes | |
| `startTime` | date | yes | ISO 8601, inside the expo dates |
| `endTime` | date | yes | after `startTime`, inside the expo dates |
| `capacity` | number | no | at least 1 (default 50) |

Rules: the expo must not be `completed` or `cancelled`; two active sessions cannot use the same location at overlapping times.
Response `201`: `{ "success": true, "message": "Session created", "session": { ... } }`. Emits `schedule_updated`.

### GET /api/sessions/:id

Response: `{ "success": true, "session": { ..., "expo": { "title": "...", "location": "...", "startDate": "...", "endDate": "...", "status": "..." } } }`

### PUT /api/sessions/:id

Same fields as create, all optional. Capacity cannot go below `registeredCount`. A cancelled session cannot be updated. If time or location changes, registered and bookmarked users are notified and reminders are reset.
Response `200`: `{ "success": true, "message": "Session updated", "session": { ... } }`

### PATCH /api/sessions/:id/cancel

Notifies registered and bookmarked users. Response: `{ "success": true, "message": "Session cancelled", "session": { ... } }`

### DELETE /api/sessions/:id

Response: `{ "success": true, "message": "Session deleted" }`

### POST /api/sessions/:id/register

No body. The attendee must be registered for the expo first. Checks that the session is not cancelled, not ended and not full.

```json
{
  "success": true,
  "message": "Registered for the session",
  "seatsLeft": 165,
  "registration": { "_id": "...", "attendee": "...", "expo": "...", "session": "6664e5...", "status": "registered" }
}
```

### POST /api/sessions/:id/bookmark

Body (optional): `{ "remindBeforeMinutes": 30 }` – 1 to 1440 (default 30). Bookmarking again only changes the reminder time.

- `201`: `{ "success": true, "message": "Session bookmarked", "bookmark": { ... } }`
- `200`: `{ "success": true, "message": "Bookmark updated", "bookmark": { ... } }`

### DELETE /api/sessions/:id/bookmark

Response: `{ "success": true, "message": "Bookmark removed" }`

---

## Registrations

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| POST | `/api/expos/:expoId/register` | Attendee | Register for a published expo (gets a ticket code). |
| GET | `/api/expos/:expoId/registrations` | Admin | Expo registrations (attendee list). |
| GET | `/api/registrations/my` | Attendee | My expo and session registrations. |
| DELETE | `/api/registrations/:id` | Attendee (owner) | Cancel a registration. |

Status: `registered`, `cancelled`, `attended`. A registration with `session: null` is for the whole expo.

### POST /api/expos/:expoId/register

No body.

```json
{
  "success": true,
  "message": "Registered for the expo",
  "registration": {
    "_id": "6665f6...",
    "attendee": "665f1e...",
    "expo": "6660a1...",
    "session": null,
    "ticketCode": "ES-4F9A1C2B",
    "status": "registered"
  }
}
```

Registering again after cancelling reuses the same ticket code.

### GET /api/expos/:expoId/registrations

Query: `status` (optional). Each item includes `attendee` (name, email, phone).

### GET /api/registrations/my

Each item includes `expo` (title, location, dates, status) and `session` (title, type, location, times, status, or `null`).

### DELETE /api/registrations/:id

Only `registered` items. Cancelling an **expo** registration also cancels all session registrations of that expo. Seats are given back.
Response: `{ "success": true, "message": "Registration cancelled", "registration": { ... } }`

---

## Bookmarks

Add and remove: see [Sessions](#sessions) (`/api/sessions/:id/bookmark`).

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/bookmarks/my` | Attendee | My bookmarks, sorted by session start time. |

```json
{
  "success": true,
  "count": 1,
  "bookmarks": [
    {
      "_id": "...",
      "session": { "_id": "...", "title": "AI in Pakistani Startups", "startTime": "...", "location": "Main Hall", "status": "scheduled" },
      "expo": { "_id": "...", "title": "Pakistan Tech Summit 2026" },
      "remindBeforeMinutes": 30,
      "reminderSent": false
    }
  ]
}
```

---

## Conversations and messages

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| POST | `/api/conversations` | Logged in | Start (or reopen) a chat. |
| GET | `/api/conversations/my` | Logged in | My chats, newest first. |
| GET | `/api/conversations/:id/messages` | Participant | Messages (marks them as read). |
| POST | `/api/conversations/:id/messages` | Participant | Send a message. |

Who can chat with whom (each chat belongs to one expo):

| Users | Conversation type |
|-------|-------------------|
| Admin ↔ Exhibitor | `support` |
| Exhibitor ↔ Exhibitor | `exhibitor_exhibitor` |
| Attendee → Exhibitor | `attendee_exhibitor` (attendee starts it) |

Other pairs (for example attendee ↔ attendee) get `403`.

### POST /api/conversations

Body: `{ "userId": "<other user id>", "expoId": "<expo id>" }`

Returns `201` for a new chat, `200` if the chat already exists:

```json
{
  "success": true,
  "conversation": {
    "_id": "6666a7...",
    "participants": [
      { "_id": "...", "name": "Ayesha Khan", "role": "attendee", "avatar": "" },
      { "_id": "...", "name": "Usman Siddiqui", "role": "exhibitor", "avatar": "" }
    ],
    "expo": "6660a1...",
    "type": "attendee_exhibitor",
    "lastMessage": null
  }
}
```

### GET /api/conversations/my

```json
{
  "success": true,
  "count": 1,
  "conversations": [
    {
      "_id": "6666a7...",
      "type": "attendee_exhibitor",
      "expo": { "_id": "...", "title": "Pakistan Tech Summit 2026" },
      "otherUser": {
        "_id": "...",
        "name": "Usman Siddiqui",
        "role": "exhibitor",
        "avatar": "",
        "companyName": "NexaByte Technologies",
        "email": "usman@nexabyte.pk",
        "phone": "0300 1111111"
      },
      "lastMessage": { "text": "See you at booth A1!", "sender": "...", "isRead": false, "createdAt": "..." },
      "updatedAt": "..."
    }
  ]
}
```

`email` and `phone` are `null` when the other user hides them (admins always see them).

### GET /api/conversations/:id/messages

```json
{
  "success": true,
  "count": 2,
  "messages": [
    { "_id": "...", "conversation": "...", "sender": { "_id": "...", "name": "Ayesha Khan", "role": "attendee", "avatar": "" }, "text": "Hi!", "isRead": true, "createdAt": "..." }
  ]
}
```

### POST /api/conversations/:id/messages

Body: `{ "text": "Hello" }` (1–2000 characters)

The receiver gets a `new_message` socket event and a notification.

```json
{ "success": true, "message": "Message sent", "newMessage": { "_id": "...", "text": "Hello", "sender": { "...": "..." }, "isRead": false } }
```

---

## Notifications

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/notifications/my` | Logged in | My notifications, newest first. |
| PATCH | `/api/notifications/read-all` | Logged in | Mark all as read. |
| PATCH | `/api/notifications/:id/read` | Logged in (owner) | Mark one as read. |

Types: `info`, `application`, `registration`, `session`, `session_reminder`, `message`, `system`.

### GET /api/notifications/my

```json
{
  "success": true,
  "count": 2,
  "unreadCount": 1,
  "notifications": [
    {
      "_id": "...",
      "user": "...",
      "title": "Session starting soon",
      "message": "\"AI in Pakistani Startups\" starts in 30 minutes at Main Hall.",
      "type": "session_reminder",
      "link": "/sessions/6664e5...",
      "isRead": false,
      "createdAt": "..."
    }
  ]
}
```

### PATCH /api/notifications/read-all

```json
{ "success": true, "message": "3 notifications marked as read" }
```

### PATCH /api/notifications/:id/read

```json
{ "success": true, "message": "Notification marked as read", "notification": { "...": "...", "isRead": true } }
```

---

## Feedback

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| POST | `/api/feedback` | Logged in | Send feedback. |
| GET | `/api/feedback/my` | Logged in | My feedback. |
| GET | `/api/feedback` | Admin | All feedback. |
| PATCH | `/api/feedback/:id` | Admin | Change status / reply. |

### POST /api/feedback

| Field | Type | Required | Rules |
|-------|------|----------|-------|
| `type` | string | yes | `suggestion`, `issue`, `complaint`, `other` |
| `subject` | string | yes | |
| `message` | string | yes | |
| `rating` | number | no | 1–5 |
| `expoId` | string | no | a non-draft expo |

```json
{
  "success": true,
  "message": "Feedback submitted",
  "feedback": {
    "_id": "...",
    "user": "...",
    "expo": "6660a1...",
    "type": "suggestion",
    "subject": "More food stalls",
    "message": "Please add more food stalls near Hall B.",
    "rating": 4,
    "status": "open",
    "adminResponse": ""
  }
}
```

### GET /api/feedback

Query: `status` (`open`, `in_progress`, `resolved`) and `type`, both optional. Includes `user` (name, email, role) and `expo` (title).

### PATCH /api/feedback/:id

Send at least one of:

| Field | Type | Rules |
|-------|------|-------|
| `status` | string | `open`, `in_progress`, `resolved` |
| `adminResponse` | string | reply to the user |

The user gets a notification. Response: `{ "success": true, "message": "Feedback updated", "feedback": { ... } }`

---

## Analytics

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/analytics/overview` | Admin | Totals for the whole system. |
| GET | `/api/analytics/expos/:expoId` | Admin | Report for one expo. |

### GET /api/analytics/overview

```json
{
  "success": true,
  "overview": {
    "usersByRole": { "admin": 1, "exhibitor": 6, "attendee": 8 },
    "exposByStatus": { "draft": 1, "published": 2, "ongoing": 0, "completed": 0, "cancelled": 0 },
    "totalRegistrations": 12,
    "totalFeedback": 8
  }
}
```

### GET /api/analytics/expos/:expoId

```json
{
  "success": true,
  "report": {
    "expo": { "_id": "...", "title": "Pakistan Tech Summit 2026", "status": "published" },
    "totalAttendees": 7,
    "attendeesPerDay": [{ "date": "2026-10-25", "count": 2 }, { "date": "2026-10-28", "count": 5 }],
    "boothsByStatus": { "available": 10, "reserved": 1, "booked": 3 },
    "applicationsByStatus": { "pending": 1, "approved": 3, "rejected": 1, "withdrawn": 0 },
    "topBooths": [{ "boothId": "...", "boothNumber": "A1", "hall": "Hall A", "visits": 54 }],
    "topSessions": [
      { "sessionId": "...", "title": "AI in Pakistani Startups", "startTime": "...", "registrations": 5, "bookmarks": 3, "total": 8 }
    ],
    "feedback": { "count": 4, "averageRating": 4.3 }
  }
}
```

---

## Admin users

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| GET | `/api/admin/users` | Admin | List users. Query `role` (optional). |
| PATCH | `/api/admin/users/:id/status` | Admin | Disable or activate a user. |

### GET /api/admin/users

```json
{ "success": true, "count": 15, "users": [ { "_id": "...", "name": "Ali Raza", "email": "ali.raza@demo.pk", "role": "attendee", "isActive": true } ] }
```

### PATCH /api/admin/users/:id/status

Body: `{ "isActive": false }` (strict boolean). An admin cannot change their own status. A disabled user is disconnected from socket.io right away.
Response: `{ "success": true, "message": "User disabled", "user": { ... } }`

---

## Uploads

| Method | URL | Access | Description |
|--------|-----|--------|-------------|
| POST | `/api/uploads/avatar` | Logged in | Upload profile photo. |

`multipart/form-data` field **`avatar`** (JPG, PNG, WEBP, max 5 MB).

```json
{ "success": true, "message": "Avatar uploaded", "avatar": "/uploads/665f1c...-1730700000000-a1b2c3.jpg" }
```

Show it with `http://localhost:3000` + the returned path.

---

## Socket.io events

### Connecting

Send the JWT token in the handshake:

```js
import { io } from "socket.io-client";
const socket = io("http://localhost:3000", { auth: { token } });
```

If the token is missing or invalid, the connection fails with a `connect_error` (messages: "Not logged in. Token missing.", "Invalid user. Please log in again." or "Invalid or expired token."). On connect, the user automatically joins a private room named with their user id.

### Client → Server

| Event | Data | Description |
|-------|------|-------------|
| `join_expo` | `expoId` (string) | Join the room of an expo to get its live updates. Draft expos are only for admins. |
| `leave_expo` | `expoId` (string) | Leave the expo room. |

### Server → Client

| Event | Sent to | Data | When |
|-------|---------|------|------|
| `joined_expo` | that socket | `expoId` | After a successful `join_expo`. |
| `left_expo` | that socket | `expoId` | After `leave_expo`. |
| `error_message` | that socket | text, e.g. `"Expo not found"` | `join_expo` failed. |
| `notification` | one user | Notification object | Any new notification (application result, session change, reminder, message, feedback reply, ...). |
| `new_message` | one user | `{ conversationId, message }` | Someone sent this user a chat message. |
| `booth_updated` | expo room | `{ action, boothId, boothNumber, hall, position, size, price, status, exhibitor }` | Booth created, edited, deleted, reserved, booked or freed. `action` is `created`, `updated` or `deleted`. No staff data is sent. |
| `schedule_updated` | expo room | `{ action, session }` or `{ action: "deleted", sessionId }` | Session `created`, `updated`, `cancelled` or `deleted`. |
| `expo_updated` | expo room | `{ expo }` or `{ action: "deleted", expoId }` | Expo details, status or banner changed, or the expo was deleted. |
| `registrations_updated` | expo room | `{ expoId }` | Someone registered or cancelled (expo or session). Used to refresh seats left and analytics. No personal data. |

---

## Errors and status codes

Every error has the same shape:

```json
{ "success": false, "message": "Expo not found" }
```

Validation errors also list every failed field:

```json
{
  "success": false,
  "message": "Title is required",
  "errors": [
    { "field": "title", "message": "Title is required" },
    { "field": "startDate", "message": "Start date must be a valid date" }
  ]
}
```

| Code | Meaning | Examples |
|------|---------|----------|
| `200` | OK | Data returned or action done. |
| `201` | Created | Register, new expo, new booth, new message. |
| `400` | Bad request | Validation failed, invalid id format (`Invalid _id: 123`), duplicate value (`email already exists`), file too large (`File is too large. Max size is 5 MB`), wrong file type, business rule (`Booth is not available`, `This session is full`). |
| `401` | Not logged in | Token missing, invalid or expired, password changed, wrong login or current password. |
| `403` | Forbidden | Wrong role (`Role 'attendee' is not allowed to access this route.`), disabled account at login, not the owner. |
| `404` | Not found | Item does not exist (or is a draft expo for non-admins). Unknown route: `Route not found: GET /api/xyz`. |
| `429` | Too many requests | Rate limit on login, register or forgot password. |
| `500` | Server error | Unexpected error. The client only sees `"Server error"`; details are logged on the server. |
