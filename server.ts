import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import { WebSocketServer } from "ws";
import { createServer } from "http";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("aura.db");

// Initialize DB
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    email TEXT UNIQUE,
    role TEXT DEFAULT 'user'
  );

  CREATE TABLE IF NOT EXISTS characters (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    name TEXT,
    personality TEXT,
    niche TEXT,
    avatar_url TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS content (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    type TEXT, -- 'image', 'video', 'post'
    url TEXT,
    prompt TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(character_id) REFERENCES characters(id)
  );

  CREATE TABLE IF NOT EXISTS chat_history (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    character_id INTEGER,
    role TEXT, -- 'user', 'assistant'
    message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(character_id) REFERENCES characters(id)
  );
`);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", timestamp: new Date().toISOString() });
  });

  app.get("/api/characters", (req, res) => {
    const characters = db.prepare("SELECT * FROM characters ORDER BY created_at DESC").all();
    res.json(characters);
  });

  app.post("/api/characters", (req, res) => {
    const { name, personality, niche, avatar_url } = req.body;
    const result = db.prepare(
      "INSERT INTO characters (name, personality, niche, avatar_url) VALUES (?, ?, ?, ?)"
    ).run(name, personality, niche, avatar_url);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/content/:characterId", (req, res) => {
    const content = db.prepare("SELECT * FROM content WHERE character_id = ? ORDER BY created_at DESC")
      .all(req.params.characterId);
    res.json(content);
  });

  app.post("/api/content", (req, res) => {
    const { character_id, type, url, prompt } = req.body;
    const result = db.prepare(
      "INSERT INTO content (character_id, type, url, prompt) VALUES (?, ?, ?, ?)"
    ).run(character_id, type, url, prompt);
    res.json({ id: result.lastInsertRowid });
  });

  app.get("/api/chat/:characterId", (req, res) => {
    const history = db.prepare("SELECT * FROM chat_history WHERE character_id = ? ORDER BY created_at ASC")
      .all(req.params.characterId);
    res.json(history);
  });

  app.post("/api/chat", (req, res) => {
    const { character_id, role, message } = req.body;
    const result = db.prepare(
      "INSERT INTO chat_history (character_id, role, message) VALUES (?, ?, ?)"
    ).run(character_id, role, message);
    res.json({ id: result.lastInsertRowid });
  });

  // WebSocket handling
  wss.on("connection", (ws) => {
    console.log("New client connected");
    ws.on("message", (message) => {
      console.log(`Received: ${message}`);
      // Echo for now or handle specific events
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  server.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
