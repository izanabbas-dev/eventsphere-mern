# EventSphere Database

EventSphere uses **MongoDB** with **Mongoose**. There are 13 collections. Every document has an `_id` and, because all schemas use `timestamps: true`, also `createdAt` and `updatedAt`.

`ref` means the field stores the `_id` of a document in another collection (like a foreign key).

## Diagram

The **Expo** is the center. Almost every collection points to an expo and to a **User**.

```
User ──1:1──► ExhibitorProfile            (only for exhibitors)
User ──1:N──► Notification
User ──1:N──► Feedback ──────────────────► Expo (optional)

Expo  (organizer = User, admin)
 ├── Booth                 exhibitor ────► User (null when available)
 │    └── BoothVisit       visitor ──────► User
 ├── Session
 │    ├── Registration     attendee ─────► User   (session = this session)
 │    └── Bookmark         user ─────────► User
 ├── Registration          attendee ─────► User   (session = null, has ticketCode)
 ├── ExhibitorApplication  exhibitor ────► User
 │                         profile ──────► ExhibitorProfile
 │                         preferredBooths, assignedBooth ──► Booth
 └── Conversation          participants ─► 2 Users
      └── Message          sender ───────► User
```

The same links as a list:

```
User (exhibitor) ──1:1── ExhibitorProfile
User (admin) ──1:N── Expo
Expo ──1:N── Booth ──N:1── User (exhibitor, optional)
Expo ──1:N── Session
Expo ──1:N── ExhibitorApplication ──N:1── User (exhibitor), ExhibitorProfile, Booth
Expo ──1:N── Registration ──N:1── User (attendee), Session (optional)
Session ──1:N── Bookmark ──N:1── User (attendee)
Booth ──1:N── BoothVisit ──N:1── User (visitor)
Expo ──1:N── Conversation ──N:N── User (participants)
Conversation ──1:N── Message ──N:1── User (sender)
User ──1:N── Notification
User ──1:N── Feedback ──N:1── Expo (optional)
```

---

## Collections

### 1. users
All accounts (admins, exhibitors, attendees).

| Field | Type | Notes |
|-------|------|-------|
| `name` | String | required |
| `email` | String | required, unique, lowercase |
| `password` | String | required, min 6, **bcrypt hash**, hidden by default |
| `role` | String | `admin`, `exhibitor`, `attendee` (default) |
| `phone` | String | |
| `avatar` | String | URL like `/uploads/...` |
| `isActive` | Boolean | default `true`; `false` = disabled by admin |
| `consent.termsAccepted` | Boolean | accepted terms at registration |
| `consent.acceptedAt` | Date | when they accepted |
| `showContactInfo` | Boolean | privacy: show email/phone to others |
| `resetPasswordToken` | String | SHA-256 hash of the reset token, hidden |
| `resetPasswordExpire` | Date | 15 minutes after the request, hidden |
| `passwordChangedAt` | Date | older login tokens stop working, hidden |

### 2. exhibitorprofiles
Company details of an exhibitor. One per exhibitor user.

| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId → User | required, **unique** (1:1) |
| `companyName` | String | required |
| `logo` | String | URL |
| `description` | String | |
| `category` | String | e.g. Technology, Food |
| `productsServices` | [String] | |
| `website` | String | |
| `contact` | Object | `person`, `email`, `phone`, `address` |
| `documents` | [Object] | `name` (original name), `fileName` (in `private_uploads`) |

Index: text index on `companyName`, `description`, `category`, `productsServices`.

### 3. expos
An expo or trade show.

| Field | Type | Notes |
|-------|------|-------|
| `title` | String | required |
| `description` | String | |
| `theme` | String | |
| `startDate` | Date | required |
| `endDate` | Date | required, not before `startDate` |
| `location` | String | required |
| `banner` | String | URL |
| `status` | String | `draft` (default), `published`, `ongoing`, `completed`, `cancelled` |
| `floorPlan.rows` | Number | default 5 |
| `floorPlan.cols` | Number | default 5 |
| `organizer` | ObjectId → User | required (the admin who created it) |

### 4. booths
One cell on the floor plan of an expo.

| Field | Type | Notes |
|-------|------|-------|
| `expo` | ObjectId → Expo | required |
| `boothNumber` | String | required, e.g. `A12` |
| `hall` | String | |
| `position.row`, `position.col` | Number | place on the grid, start from 0 |
| `size` | String | `small`, `medium` (default), `large` |
| `price` | Number | default 0 |
| `status` | String | `available` (default), `reserved`, `booked` |
| `exhibitor` | ObjectId → User | `null` when available |
| `productsShowcased` | [String] | set by the exhibitor |
| `staff` | [Object] | `name`, `role`, `phone` (private) |

Unique indexes: (`expo`, `boothNumber`) and (`expo`, `position.row`, `position.col`) – no duplicate numbers or positions in one expo.

### 5. exhibitorapplications
An exhibitor's request to take part in an expo.

| Field | Type | Notes |
|-------|------|-------|
| `expo` | ObjectId → Expo | required |
| `exhibitor` | ObjectId → User | required |
| `profile` | ObjectId → ExhibitorProfile | required |
| `message` | String | message to the organizer |
| `preferredBooths` | [ObjectId → Booth] | up to 5 |
| `assignedBooth` | ObjectId → Booth | set on approval / assignment |
| `status` | String | `pending` (default), `approved`, `rejected`, `withdrawn` |
| `adminNote` | String | required when rejected |

Unique index: (`expo`, `exhibitor`) – one application per exhibitor per expo.

### 6. sessions
A talk, workshop, keynote or panel in an expo.

| Field | Type | Notes |
|-------|------|-------|
| `expo` | ObjectId → Expo | required |
| `title` | String | required |
| `description` | String | |
| `topic` | String | |
| `type` | String | `session` (default), `workshop`, `keynote`, `panel` |
| `speakers` | [Object] | `name` (required), `designation`, `bio`, `photo` |
| `location` | String | room / hall |
| `startTime` | Date | required |
| `endTime` | Date | required, after `startTime` |
| `capacity` | Number | default 50 |
| `registeredCount` | Number | seats taken |
| `status` | String | `scheduled` (default), `cancelled` |

### 7. registrations
An attendee's registration for an expo or for one session.

| Field | Type | Notes |
|-------|------|-------|
| `attendee` | ObjectId → User | required |
| `expo` | ObjectId → Expo | required |
| `session` | ObjectId → Session | `null` = registration for the whole expo |
| `ticketCode` | String | e.g. `ES-4F9A1C2B`, only for expo registrations, unique |
| `status` | String | `registered` (default), `cancelled`, `attended` |

Unique index: (`attendee`, `expo`, `session`).

### 8. bookmarks
A session saved by an attendee, with a reminder.

| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId → User | required |
| `session` | ObjectId → Session | required |
| `expo` | ObjectId → Expo | required |
| `remindBeforeMinutes` | Number | default 30 |
| `reminderSent` | Boolean | set to `true` by the reminder job |

Unique index: (`user`, `session`).

### 9. boothvisits
One visit to a booth. Used for the booth traffic report.

| Field | Type | Notes |
|-------|------|-------|
| `booth` | ObjectId → Booth | required |
| `expo` | ObjectId → Expo | required |
| `visitor` | ObjectId → User | required |
| `source` | String | `floor_plan` (default), `profile_view`, `check_in` |

A visit is saved at most once per user per booth per hour.

### 10. conversations
A chat between two users about one expo.

| Field | Type | Notes |
|-------|------|-------|
| `participants` | [ObjectId → User] | the two users |
| `expo` | ObjectId → Expo | required |
| `type` | String | `support` (admin–exhibitor), `exhibitor_exhibitor`, `attendee_exhibitor` |
| `lastMessage` | ObjectId → Message | for the chat list |

### 11. messages
One chat message.

| Field | Type | Notes |
|-------|------|-------|
| `conversation` | ObjectId → Conversation | required |
| `sender` | ObjectId → User | required |
| `text` | String | required, max 2000 |
| `isRead` | Boolean | default `false` |

### 12. notifications
A message shown in the user's notification bell.

| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId → User | required (receiver) |
| `title` | String | required |
| `message` | String | required |
| `type` | String | `info`, `application`, `registration`, `session`, `session_reminder`, `message`, `system` |
| `link` | String | frontend page to open |
| `isRead` | Boolean | default `false` |

### 13. feedbacks
Suggestions, issues and complaints from users.

| Field | Type | Notes |
|-------|------|-------|
| `user` | ObjectId → User | required |
| `expo` | ObjectId → Expo | optional |
| `type` | String | `suggestion`, `issue`, `complaint`, `other` (default) |
| `subject` | String | required |
| `message` | String | required |
| `rating` | Number | 1–5, optional |
| `status` | String | `open` (default), `in_progress`, `resolved` |
| `adminResponse` | String | reply from the admin |

---

## Data rules worth knowing

- **Deleting an expo** also deletes its booths, sessions, applications, registrations, bookmarks, booth visits, conversations and messages.
- **Deleting a session** also deletes its registrations and bookmarks.
- **One booth per exhibitor per expo** is checked in the code (reserve, assign and approve).
- **Seats**: `sessions.registeredCount` goes up by one in a single atomic update only if it is still below `capacity`, so two people cannot take the last seat.
- **Files** are not stored in MongoDB. Only the path is saved. Public images are in `backend/uploads`, exhibitor documents in `backend/private_uploads`.
