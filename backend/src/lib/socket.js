import { Server } from "socket.io";
import http from "http";
import express from "express";
import User from "../models/user.model.js";
import Message from "../models/message.model.js";

const app = express();
const server = http.createServer(app);

const io = new Server(server, {
  cors: {
    origin: ["http://localhost:5173"],
  },
});

export function getReceiverSocketId(userId) {
  return userSocketMap[userId];
}

// used to store online users
const userSocketMap = {}; // {userId: socketId}

// emit helper
async function emitOnlineUsers() {
  const onlineUserIds = Object.keys(userSocketMap);

  try {
    const onlineUsers = await User.find({
      _id: { $in: onlineUserIds },
    }).select("-password");

    io.emit("getOnlineUsers", onlineUsers);
  } catch (error) {
    console.error("Failed to emit online users:", error);
  }
}

io.on("connection", async (socket) => {
  console.log("A user connected", socket.id);

  const userId = socket.handshake.query.userId;
  if (userId) userSocketMap[userId] = socket.id;

  await emitOnlineUsers();

  socket.on("disconnect", () => {
    console.log("A user disconnected", socket.id);
    delete userSocketMap[userId];

    setTimeout(() => {
      if (userSocketMap[userId]) return;
      emitOnlineUsers();
    }, 1500);
  });
});

export { io, app, server, userSocketMap };
