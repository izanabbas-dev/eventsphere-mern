import cron from "node-cron";
import Session from "../models/Session.js";
import Bookmark from "../models/Bookmark.js";
import { createNotification } from "./notify.js";

// Same as the max allowed remindBeforeMinutes (1 day)
const MAX_REMINDER_MINUTES = 1440;

const sendSessionReminders = async () => {
  const now = new Date();
  const latestStart = new Date(now.getTime() + MAX_REMINDER_MINUTES * 60 * 1000);

  // Only sessions that start within the next day can need a reminder
  const sessions = await Session.find({ status: "scheduled", startTime: { $gt: now, $lte: latestStart } });
  if (sessions.length === 0) return;

  const bookmarks = await Bookmark.find({ session: { $in: sessions.map((s) => s._id) }, reminderSent: false });

  for (const bookmark of bookmarks) {
    const session = sessions.find((s) => s._id.equals(bookmark.session));
    const minutesLeft = Math.round((session.startTime - now) / 60000);

    if (minutesLeft > bookmark.remindBeforeMinutes) continue;

    // Mark it first, so the same reminder is never sent twice
    const result = await Bookmark.updateOne({ _id: bookmark._id, reminderSent: false }, { reminderSent: true });
    if (result.modifiedCount === 0) continue;

    await createNotification({
      user: bookmark.user,
      title: "Session starting soon",
      message: `"${session.title}" starts in ${minutesLeft} minutes at ${session.location}.`,
      type: "session_reminder",
      link: `/sessions/${session._id}`,
    });
  }
};

// Runs every minute
export const startReminderJob = () => {
  cron.schedule(
    "* * * * *",
    async () => {
      try {
        await sendSessionReminders();
      } catch (error) {
        console.error("Reminder job failed:", error.message);
      }
    },
    { noOverlap: true }
  );

  console.log("Session reminder job started");
};
