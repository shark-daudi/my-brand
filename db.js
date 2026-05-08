// db.js — Database initialization
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const DB_PATH = path.join(__dirname, 'data', 'mybrand.db');

// Ensure data directory exists
const fs = require('fs');
const dataDir = path.join(__dirname, 'data');
if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir);

const db = new sqlite3.Database(DB_PATH, (err) => {
  if (err) console.error('DB connection error:', err);
  else console.log('✅ SQLite connected:', DB_PATH);
});

// Enable foreign keys
db.run('PRAGMA foreign_keys = ON');

// ── Create tables ──
db.serialize(() => {

  // Users table
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      name        TEXT    NOT NULL,
      email       TEXT    UNIQUE NOT NULL,
      password    TEXT    NOT NULL,
      role        TEXT    DEFAULT 'user',
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Contact messages table
  db.run(`
    CREATE TABLE IF NOT EXISTS messages (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name  TEXT NOT NULL,
      last_name   TEXT NOT NULL,
      email       TEXT NOT NULL,
      service     TEXT,
      message     TEXT NOT NULL,
      is_read     INTEGER DEFAULT 0,
      created_at  DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Sessions / refresh tokens
  db.run(`
    CREATE TABLE IF NOT EXISTS refresh_tokens (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id     INTEGER NOT NULL,
      token       TEXT    NOT NULL,
      expires_at  DATETIME NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Tables ready');
});

module.exports = db;
