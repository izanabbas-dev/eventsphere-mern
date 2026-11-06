import Bookmark from "../models/Bookmark.js";
import Session from "../models/Session.js";

export const addBookmark = async (req, res) => {
  const session = await Session.findById(req.params.id).populate("expo", "status");

  if (!session || !session.expo || session.expo.status === "draft") {
    return res.status(404).json({ success: false, message: "Session not found" });
  }

  if (session.status === "cancelled") {
    return res.status(400).json({ success: false, message: "This session has been cancelled" });
  }

  const remindBeforeMinutes = req.body.remindBeforeMinutes || 30;

  let bookmark = await Bookmark.findOne({ user: req.user._id, session: session._id });

  if (bookmark) {
    bookmark.remindBeforeMinutes = remindBeforeMinutes;
    bookmark.reminderSent = false;
    await bookmark.save();
    return res.status(200).json({ success: true, message: "Bookmark updated", bookmark });
  }

  bookmark = await Bookmark.create({
    user: req.user._id,
    session: session._id,
    expo: session.expo._id,
    remindBeforeMinutes,
  });

  res.status(201).json({ success: true, message: "Session bookmarked", bookmark });
};

export const removeBookmark = async (req, res) => {
  const bookmark = await Bookmark.findOneAndDelete({ user: req.user._id, session: req.params.id });

  if (!bookmark) {
    return res.status(404).json({ success: false, message: "Bookmark not found" });
  }

  res.status(200).json({ success: true, message: "Bookmark removed" });
};

export const getMyBookmarks = async (req, res) => {
  const bookmarks = await Bookmark.find({ user: req.user._id })
    .populate("session", "title type topic speakers location startTime endTime status")
    .populate("expo", "title");

  const validBookmarks = bookmarks.filter((bookmark) => bookmark.session);
  validBookmarks.sort((a, b) => a.session.startTime - b.session.startTime);

  res.status(200).json({ success: true, count: validBookmarks.length, bookmarks: validBookmarks });
};
