import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const db = new Database("shg_system.db");

// Initialize Database Tables
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE,
    password TEXT,
    full_name TEXT,
    role TEXT DEFAULT 'member', -- 'admin', 'member'
    group_id INTEGER,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS savings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount DECIMAL(10, 2),
    type TEXT, -- 'deposit', 'withdrawal'
    transaction_date DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS loans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    amount DECIMAL(10, 2),
    interest_rate DECIMAL(5, 2),
    status TEXT DEFAULT 'pending', -- 'pending', 'approved', 'rejected', 'paid'
    applied_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    approved_at DATETIME,
    FOREIGN KEY(user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS meetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_id INTEGER,
    title TEXT,
    meeting_date DATETIME,
    location TEXT,
    minutes TEXT,
    FOREIGN KEY(group_id) REFERENCES groups(id)
  );

  CREATE TABLE IF NOT EXISTS attendance (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    meeting_id INTEGER,
    user_id INTEGER,
    status TEXT, -- 'present', 'absent'
    FOREIGN KEY(meeting_id) REFERENCES meetings(id),
    FOREIGN KEY(user_id) REFERENCES users(id)
  );
`);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // --- API Routes ---

  // Auth
  app.post("/api/login", (req, res) => {
    const { username, password } = req.body;
    const user = db.prepare("SELECT * FROM users WHERE username = ? AND password = ?").get(username, password);
    if (user) {
      res.json({ success: true, user });
    } else {
      res.status(401).json({ success: false, message: "Invalid credentials" });
    }
  });

  app.post("/api/register", (req, res) => {
    const { username, password, fullName, role } = req.body;
    try {
      const result = db.prepare("INSERT INTO users (username, password, full_name, role) VALUES (?, ?, ?, ?)").run(username, password, fullName, role || 'member');
      res.json({ success: true, id: result.lastInsertRowid });
    } catch (error: any) {
      res.status(400).json({ success: false, message: error.message });
    }
  });

  // Dashboard Stats
  app.get("/api/stats", (req, res) => {
    const totalMembers = db.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'member'").get() as any;
    const totalSavings = db.prepare("SELECT SUM(CASE WHEN type = 'deposit' THEN amount ELSE -amount END) as total FROM savings").get() as any;
    const activeLoans = db.prepare("SELECT COUNT(*) as count FROM loans WHERE status = 'approved'").get() as any;
    
    res.json({
      members: totalMembers.count,
      savings: totalSavings.total || 0,
      loans: activeLoans.count
    });
  });

  // Savings
  app.get("/api/savings/:userId", (req, res) => {
    const savings = db.prepare("SELECT * FROM savings WHERE user_id = ? ORDER BY transaction_date DESC").all(req.params.userId);
    res.json(savings);
  });

  app.post("/api/savings", (req, res) => {
    const { userId, amount, type } = req.body;
    db.prepare("INSERT INTO savings (user_id, amount, type) VALUES (?, ?, ?)").run(userId, amount, type);
    res.json({ success: true });
  });

  // Loans
  app.get("/api/loans/:userId", (req, res) => {
    const loans = db.prepare("SELECT * FROM loans WHERE user_id = ? ORDER BY applied_at DESC").all(req.params.userId);
    res.json(loans);
  });

  app.post("/api/loans", (req, res) => {
    const { userId, amount, interestRate } = req.body;
    db.prepare("INSERT INTO loans (user_id, amount, interest_rate) VALUES (?, ?, ?)").run(userId, amount, interestRate);
    res.json({ success: true });
  });

  // Admin: All Loans
  app.get("/api/admin/loans", (req, res) => {
    const loans = db.prepare(`
      SELECT l.*, u.full_name 
      FROM loans l 
      JOIN users u ON l.user_id = u.id 
      ORDER BY l.applied_at DESC
    `).all();
    res.json(loans);
  });

  app.post("/api/admin/loans/approve", (req, res) => {
    const { loanId } = req.body;
    db.prepare("UPDATE loans SET status = 'approved', approved_at = CURRENT_TIMESTAMP WHERE id = ?").run(loanId);
    res.json({ success: true });
  });

  // --- Vite Middleware ---
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

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
