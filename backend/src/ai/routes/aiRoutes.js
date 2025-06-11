import express from "express";
import { handleAiChatStream } from "../controllers/aiController.js";

const router = express.Router();

router.post("/chat", handleAiChatStream); // POST /api/ai/chat

export default router;
