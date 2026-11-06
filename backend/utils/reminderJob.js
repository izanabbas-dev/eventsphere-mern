import cron from "node-cron";
import Session from "../models/Session.js";
import Bookmark from "../models/Bookmark.js";
import { createNotification } from "./notify.js";

const MAX_REMINDER_MINUTES = 1440;

const sendSessionReminders = async () => {
  const now = new Date();
  const latestStart = new Date(now.getTime() + MAX_REMINDER_MINUTES * 60 * 1000);

  const sessions = await Session.find({ status: "scheduled", startTime: { $gt: now, $lte: latestStart } });
  if (sessions.length === 0) return;

  const bookmarks = await Bookmark.find({ session: { $in: sessions.map((s) => s._id) }, reminderSent: false });

  for (const bookmark of bookmarks) {
    const session = sessions.find((s) => s._id.equals(bookmark.session));
    const minutesLeft = Math.round((session.startTime - now) / 60000);

    if (minutesLeft > bookmark.remindBeforeMinutes) continue;

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
