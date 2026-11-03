# EventSphere User Guide

This guide shows how to use EventSphere step by step. There are three kinds of users:

- **Admin (organizer)** – creates expos, booths and sessions, and manages everything.
- **Exhibitor** – a company that shows its products at an expo.
- **Attendee** – a visitor who comes to the expo.

After you log in, the menu on the left (or the menu button on mobile) shows the pages for your role. The bell icon at the top shows your notifications.

## Contents

1. [Getting started (all users)](#1-getting-started-all-users)
2. [Admin guide](#2-admin-guide)
3. [Exhibitor guide](#3-exhibitor-guide)
4. [Attendee guide](#4-attendee-guide)
5. [Common features](#5-common-features)
6. [FAQ](#6-faq)

---

## 1. Getting started (all users)

### Create an account
1. Open the website and click **Register** (or **Get started**).
2. Under **I want to join as**, choose **Attendee** or **Exhibitor**.
3. Enter your **full name**, **email** and **password** (at least 6 characters). Phone is optional.
4. If you are an exhibitor, enter your **company name**.
5. Tick the box to accept the **Terms of Service** and **Privacy Policy**.
6. Click **Create account**. You are logged in and taken to your dashboard.

> Admin accounts cannot be created from the register page. The first admin is created by the developer (`npm run seed:admin`).

### Log in
1. Click **Log in**.
2. Enter your email and password and click **Log in**.
3. You go straight to your own dashboard (admin, exhibitor or attendee).

### Forgot your password?
1. On the login page click **Forgot password?**.
2. Enter your email and click **Send reset link**.
3. Open the email and click the reset link. **The link works for 15 minutes.**
4. Enter your new password twice and save. You are logged in with the new password.

### Change your password or profile
1. Click your name or photo at the top, then **Profile** (My account).
2. Here you can change your **photo**, **name**, **phone**, **privacy** setting and **password**.

---

## 2. Admin guide

### Create an expo
1. Go to **Expos** and click **Create Expo**.
2. Fill in **title**, **description**, **theme**, **start date**, **end date** and **location**.
3. Set the floor plan size: number of **rows** and **columns** (1 to 50 each).
4. Save. The expo starts as a **Draft** – only admins can see it.
5. Open the expo to upload a **banner** image (JPG, PNG or WEBP, max 5 MB).
6. When it is ready, change the status to **Published**. Now exhibitors can apply and attendees can register.

Expo status order: **Draft → Published → Ongoing → Completed**. You can **Cancel** at any step.

To edit or delete an expo, open it from the **Expos** page. Deleting an expo also deletes its booths, sessions, applications and registrations, and everyone involved gets a notification.

### Add booths on the floor plan
1. Go to **Booths** and choose the expo (or open the expo and use the **Floor Plan** tab).
2. The floor plan is a grid. **Click an empty cell** to add a booth there.
3. Enter the **booth number** (for example A12), **hall**, **size** (small, medium, large) and **price**.
4. Save. The booth appears on the grid in the "available" color.
5. Click a booth to **edit**, **move**, **assign it to an exhibitor**, **unassign** it, or **delete** it.

Booth colors show the status: **available**, **reserved** (an exhibitor reserved it) and **booked** (confirmed). A booked booth cannot be deleted – unassign it first. Changes appear live for everyone who has the floor plan open.

### Review exhibitor applications
1. Go to **Applications** and choose the expo. Use **Filter by status** to see only pending ones.
2. Click an application to see the company details, message, preferred booths and documents.
3. To accept: click **Approve**. You can **assign a booth** (optional) and write an admin note.
4. To refuse: click **Reject** and write the **reason for rejection** (required).
5. The exhibitor gets a notification right away.

### Schedule sessions
1. Go to **Sessions** and choose the expo (or use the **Sessions** tab of the expo).
2. Click **Create session**.
3. Fill in **title**, **type** (session, workshop, keynote, panel), **topic**, **location**, **start time**, **end time** and **capacity**.
4. Add **speakers** with name, designation and bio.
5. Save. The schedule updates live for attendees.

Rules: the time must be inside the expo dates, and two sessions cannot use the same location at the same time.
If you change the time or location, or cancel a session, everyone who registered or bookmarked it gets a notification.

### View analytics
1. Go to **Analytics** and choose an expo.
2. You will see:
   - **Total attendees** and **attendees per day**
   - **Booth traffic** – top 5 booths by visits
   - **Session popularity** – top 5 sessions by registrations and bookmarks
   - Booths by status and applications by status
   - Feedback count and **average rating**
3. The charts refresh by themselves when new registrations or booth changes happen.

The **Dashboard** shows totals for the whole system (users by role, expos by status, registrations, feedback).

### Manage users
1. Go to **Users**. Search by name or email, or filter by role.
2. Click **Disable** or **Activate** next to a user.
3. A disabled user cannot log in and is logged out of live updates right away. You cannot disable yourself.

### Manage feedback
1. Go to **Feedback**. Filter by status (open, in progress, resolved) or type.
2. Click a feedback item to read it.
3. Change the **status** and write an **admin response**, then save. The user gets a notification.

### Answer support messages
Go to **Messages** to read and reply to chats that exhibitors started with the organizer.

---

## 3. Exhibitor guide

### Complete your company profile
1. Go to **My Profile**.
2. Upload your **logo**.
3. Fill in **company name**, **description**, **category**, **products / services** (type one and press Enter), and **website**.
4. Fill in **contact**: contact person, email, phone and address.
5. Upload your **documents** (PDF or images, up to 5 at a time, max 5 MB each), for example company registration. Only you and the admins can open them.
6. Click **Save**.

A complete profile helps the organizer approve your application and helps attendees find you.

### Apply to an expo
1. Go to **Expos** and open a **published** expo.
2. Look at the floor plan. Click booths to pick up to **5 preferred booths** (optional).
3. In the apply form, write a **message to the organizer** (what you will showcase).
4. Click **Submit application**.
5. Follow the status in **My Applications**: pending, approved, rejected or withdrawn. You also get a notification when the admin decides.
6. You can **withdraw** a pending application. After withdrawing, you can apply again.

### Reserve a booth
1. Open the expo from **Expos**.
2. On the floor plan, click an **available** booth to see its number, hall, size and price.
3. Click **Reserve this booth**. The booth becomes **reserved** for you, and everyone sees it change live.
4. The organizer confirms it, and it becomes **booked**.
5. To change your mind, click your booth and **Cancel reservation**.

You can hold only **one booth per expo**. If two exhibitors click the same booth at the same moment, only the first one gets it.

### Manage booth staff and products
1. Go to **My Booth** and choose the expo.
2. Click **Manage my booth**.
3. Add **products showcased** (type a name and press Enter).
4. Add **booth staff**: name, role / designation and phone.
5. Save. Staff phone numbers are only visible to you and the admins.

### Chat
1. Go to **Messages**.
2. Click **New chat** and choose the expo.
3. Choose **Organizer support** to talk to the admin, or choose one of the **other exhibitors in this expo** (for example your neighbours) to collaborate.
4. Type a message and click **Send**. Replies arrive live.

You can also click **Contact organizer** on an expo page. Attendees can start chats with you – you will see them in **Messages**.

---

## 4. Attendee guide

### Register for an expo
1. Go to **Expos** and open an expo.
2. Read the **Overview**, then click **Register for this expo**.
3. You get a **ticket code** (for example `ES-4F9A1C2B`). See it any time in **My Registrations**.
4. To cancel, click **Cancel registration**. This also cancels your session registrations for that expo.

You can only register for **published** expos.

### Browse the schedule and register for sessions
1. Open the expo and go to the **Schedule** tab, or use **Schedule** in the menu.
2. Filter by **day**, **type**, **topic**, or search by title or speaker.
3. Click **Register** on a session. You must be registered for the expo first.
4. The number of **seats left** is shown and updates live. A full session cannot be joined.

### Bookmark sessions and get reminders
1. On any session, click the **bookmark** icon.
2. Choose **Remind me before the session** (15, 30 or 60 minutes before).
3. See all saved sessions in **Bookmarks**.
4. Before the session starts, you get a **"Session starting soon"** notification.

### Find exhibitors
1. Open the expo and go to the **Exhibitors** tab, or use **Exhibitors** in the menu.
2. Search by **company, product or keyword**, or choose a **category**.
3. Click an exhibitor to see their profile, products, contact (if they share it) and **booth** location.
4. On the **Floor Plan** tab you can click any booth to see who is there.

### Chat with an exhibitor
1. Open an exhibitor's profile.
2. Click **Message**. A chat opens in **Messages**.
3. Type your question (for example to ask for a meeting) and click **Send**.

### Notifications
- The **bell** at the top shows how many notifications are unread.
- New ones appear live (no need to refresh).
- Click one to open the related page. Use **Mark all as read** to clear them.
- You get notifications for session reminders, session changes or cancellations, new messages, feedback replies and expo changes.

### Send feedback
1. Go to **Feedback** and click **Send feedback**.
2. Choose a **type** (suggestion, issue, complaint, other), an **expo** (optional), a **subject**, your **message** and a **rating** (1–5 stars, optional).
3. Send it. You can see the status and the **response from the organizer** in the same page.

---

## 5. Common features

| Feature | Where | Who |
|---------|-------|-----|
| Profile photo, name, phone | Profile | Everyone |
| Change password | Profile | Everyone |
| Privacy switch: "Show my contact info to others" | Profile | Everyone |
| Notifications | Bell icon / Notifications page | Everyone |
| Messages | Messages | Everyone |
| Feedback | Feedback | Exhibitors, attendees |

**Privacy switch:** when it is off, other users cannot see your email and phone. Attendees have it **off** by default; exhibitors have it **on** by default. Admins can always see contact details.

---

## 6. FAQ

**1. I did not get the password reset email. What should I do?**
Check your spam folder. The link is valid for only 15 minutes, so request a new one if it expired. On a local setup without email settings, the link is printed in the backend console.

**2. Why can't I see an expo that the organizer told me about?**
It is probably still a **draft**. Draft expos are only visible to admins. Wait until it is published.

**3. Why is the "Register" button disabled?**
You can only register for **published** expos. Ongoing, completed or cancelled expos do not accept new registrations.

**4. Why can't I register for a session?**
Make sure you registered for the **expo** first. The session may also be full, cancelled or already finished.

**5. Can I reserve more than one booth?**
No. Each exhibitor can hold one booth per expo. Cancel your reservation first if you want a different one.

**6. Someone else got the booth I clicked. Why?**
Two exhibitors tried to reserve it at the same time. Only the first one gets it. The floor plan updates live, so pick another available booth.

**7. Who can see my uploaded documents?**
Only you and the admins. Documents are stored privately and never shown to attendees or other exhibitors.

**8. Who can see my email and phone number?**
Only people you allow. Use the **"Show my contact info to others"** switch on the Profile page. Admins can always see it.

**9. When do I get a reminder for a bookmarked session?**
At the time you chose when bookmarking (15, 30 or 60 minutes before). If the session time changes, you get a new reminder.

**10. My account says "disabled". What happened?**
An admin disabled it. Contact the organizer to activate it again.

**11. Does the page need refreshing to see changes?**
No. The floor plan, schedule, seats left, chats and notifications update live.

**12. Does it work on my phone?**
Yes. The design is responsive and works on phones, tablets and computers in Chrome, Firefox, Safari and Edge.
