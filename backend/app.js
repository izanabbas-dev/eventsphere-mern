import express from "express";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import authRoutes from "./routes/authRoutes.js";
import exhibitorRoutes from "./routes/exhibitorRoutes.js";
import expoRoutes from "./routes/expoRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

const app = express();

app.use(helmet());
app.use(cors());
app.use(morgan("dev"));
app.use(express.json());

app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", message: "EventSphere API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/exhibitors", exhibitorRoutes);
app.use("/api/expos", expoRoutes);

// These two must stay at the end
app.use(notFound);
app.use(errorHandler);

export default app;
