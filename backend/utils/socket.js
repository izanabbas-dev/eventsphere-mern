import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";
import User from "../models/User.js";
import Expo from "../models/Expo.js";

let io = null;

// Same rules as the protect middleware, but the token comes from socket.handshake.auth.token
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
  // Same as app.use(cors()) in app.js, which allows every origin
  io = new Server(httpServer, { cors: { origin: "*" } });

  io.use(socketAuth);

  io.on("connection", (socket) => {
    // Every user has a private room named with their user id
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

// Only public fields are sent, because staff phone numbers are private
export const emitBoothUpdated = (booth) => {
  emitToExpo(booth.expo, "booth_updated", {
    boothId: booth._id,
    boothNumber: booth.boothNumber,
    status: booth.status,
    exhibitor: booth.exhibitor,
  });
};
