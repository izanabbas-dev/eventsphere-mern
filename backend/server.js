import "dotenv/config";
import http from "http";
import app from "./app.js";
import connectDB from "./config/db.js";
import { initSocket } from "./utils/socket.js";
import { startReminderJob } from "./utils/reminderJob.js";

const PORT = process.env.PORT || 3000;

const startServer = async () => {
  await connectDB();

  // Express and socket.io share the same server and port
  const server = http.createServer(app);
  initSocket(server);

  startReminderJob();
  server.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
};

startServer();
