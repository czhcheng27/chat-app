import express from "express";
import dotenv from "dotenv";
import cookieParser from "cookie-parser";
import cors from "cors";

import path from "path";

import { connectDB } from "./lib/db.js";

import authRoutes from "./routes/auth.route.js";
import aiRoutes from "./ai/routes/aiRoutes.js";
import messageRoutes from "./routes/message.route.js";
import { app, server } from "./lib/socket.js";

dotenv.config();

const PORT = process.env.PORT || 5001;
const __dirname = path.resolve();

const allowedOrigins = [
  "http://localhost:5173", // Vite
  "http://localhost:3000", // CRA 或其他
  "https://czhcheng27.github.io",
  "https://chat-app-244z.onrender.com",
  "https://chat-app-tan-chi.vercel.app",
  "https://projects.czhcheng27.workers.dev",
];

app.use(express.json({ limit: "5mb" }));
app.use(cookieParser());
app.use(
  cors({
    origin: function (origin, callback) {
      // 如果 origin 是 undefined（比如 curl、Postman），也允许
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        console.warn("CORS blocked:", origin);
        callback(null, false); // 不抛错，防止崩服务
      }
    },
    credentials: true,
  })
);

app.use("/api/auth", authRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/ai", aiRoutes);

if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.join(__dirname, "../frontend/dist")));

  app.get("*", (req, res) => {
    res.sendFile(path.join(__dirname, "../frontend", "dist", "index.html"));
  });
}

server.listen(PORT, () => {
  console.log("server is running on PORT:" + PORT);
  connectDB();
});
