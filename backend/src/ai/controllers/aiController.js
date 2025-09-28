import { openai } from "../services/openai.js";

export const handleAiChatStream = async (req, res) => {
  const { messages } = req.body;

  res.writeHead(200, {
    "Content-Type": "text/event-stream; charset=utf-8",
    "Cache-Control": "no-cache, no-transform",
    Connection: "keep-alive",
  });

  try {
    const stream = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices?.[0]?.delta?.content;
      if (content) {
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: [DONE]\n\n`);
    res.end();
  } catch (err) {
    console.error("OpenAI error:", err);
    if (!res.headersSent) {
      res.status(500).json({ error: err.message });
    }
  }
};