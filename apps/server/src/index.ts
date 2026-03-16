import express from "express";
import cors from "cors";
import { Server } from "@colyseus/core";
import { WebSocketTransport } from "@colyseus/ws-transport";
import { createServer } from "http";
import { PropHuntRoom } from "./rooms/PropHuntRoom";

const PORT = parseInt(process.env.PORT ?? "2567", 10);

const app = express();
app.use(cors());
app.use(express.json());

// Health check
app.get("/health", (_req, res) => {
  res.json({ status: "ok" });
});

const httpServer = createServer(app);

const gameServer = new Server({
  transport: new WebSocketTransport({ server: httpServer }),
});

gameServer.define("prop_hunt", PropHuntRoom);

gameServer.listen(PORT).then(() => {
  console.log(`✅ Colyseus server running on ws://localhost:${PORT}`);
});

