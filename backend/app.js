import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import exhibitorRoutes from "./routes/exhibitorRoutes.js";
import expoRoutes from "./routes/expoRoutes.js";
import boothRoutes from "./routes/boothRoutes.js";
import applicationRoutes from "./routes/applicationRoutes.js";
import sessionRoutes from "./routes/sessionRoutes.js";
import registrationRoutes from "./routes/registrationRoutes.js";
import bookmarkRoutes from "./routes/bookmarkRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import conversationRoutes from "./routes/conversationRoutes.js";
import feedbackRoutes from "./routes/feedbackRoutes.js";
import analyticsRoutes from "./routes/analyticsRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet({ crossOriginResourcePolicy: { policy: "cross-origin" } }));
app.use(cors({ origin: process.env.CLIENT_URL || "http://localhost:5173" }));
app.use(morgan("dev"));
app.use(express.json());

app.use("/uploads", express.static("uploads"));

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "EventSphere API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/exhibitors", exhibitorRoutes);
app.use("/api/expos", expoRoutes);
app.use("/api/booths", boothRoutes);
app.use("/api/applications", applicationRoutes);
app.use("/api/sessions", sessionRoutes);
app.use("/api/registrations", registrationRoutes);
app.use("/api/bookmarks", bookmarkRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/feedback", feedbackRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/admin", adminRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
