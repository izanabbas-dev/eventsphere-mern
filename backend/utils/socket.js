import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Expo from "../models/Expo.js";

let io = null;

const socketAuth = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token;
    if (!token) return next(new Error("Not logged in. Token missing."));

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select("+passwordChangedAt");

    if (!user || !user.isActive || user.changedPasswordAfter(decoded.iat)) {
      return next(new Error("Invalid user. Please log in again."));
    }

    socket.user = user;
    next();
  } catch (error) {
    next(new Error("Invalid or expired token."));
  }
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, { cors: { origin: process.env.CLIENT_URL || "http://localhost:5173" } });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    socket.join(socket.user._id.toString());

    socket.on("join_expo", async (expoId) => {
      if (!mongoose.isValidObjectId(expoId)) {
        return socket.emit("error_message", "Invalid expo id");
      }

      try {
        const expo = await Expo.findById(expoId);
        if (!expo || (expo.status === "draft" && socket.user.role !== "admin")) {
          return socket.emit("error_message", "Expo not found");
        }

        socket.join(`expo_${expoId}`);
        socket.emit("joined_expo", expoId);
      } catch (error) {
        socket.emit("error_message", "Could not join the expo");
      }
    });

    socket.on("leave_expo", (expoId) => {
      socket.leave(`expo_${expoId}`);
      socket.emit("left_expo", expoId);
    });
  });

  console.log("Socket.io ready");
};

export const emitToUser = (userId, event, data) => {
  if (io) io.to(userId.toString()).emit(event, data);
};

export const emitToExpo = (expoId, event, data) => {
  if (io) io.to(`expo_${expoId}`).emit(event, data);
};

export const emitBoothUpdated = (booth, action = "updated") => {
  emitToExpo(booth.expo, "booth_updated", {
    action,
    boothId: booth._id,
    boothNumber: booth.boothNumber,
    hall: booth.hall,
    position: booth.position,
    size: booth.size,
    price: booth.price,
    status: booth.status,
    exhibitor: booth.exhibitor,
  });
};

export const disconnectUser = (userId) => {
  if (io) io.in(userId.toString()).disconnectSockets(true);
};
