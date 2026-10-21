import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sqlite3 from 'sqlite3';

const here = path.dirname(fileURLToPath(import.meta.url));
const configuredPath = process.env.DATABASE_PATH || './data/auth.sqlite';
const databasePath = path.isAbsolute(configuredPath)
  ? configuredPath
  : path.resolve(process.cwd(), configuredPath);

fs.mkdirSync(path.dirname(databasePath), { recursive: true });

export const db = new sqlite3.Database(databasePath);

export function initializeDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      db.run('PRAGMA foreign_keys = ON');
      db.run(
        `CREATE TABLE IF NOT EXISTS users (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          name TEXT NOT NULL,
          email TEXT NOT NULL COLLATE NOCASE UNIQUE,
          password_hash TEXT NOT NULL,
          created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ', 'now'))
        )`,
        (error) => error ? reject(error) : resolve(),
      );
    });
  });
}

export function findUserByEmail(email) {
  return new Promise((resolve, reject) => {
    db.get(
      'SELECT id, name, email, password_hash, created_at FROM users WHERE email = ? COLLATE NOCASE',
      [email],
      (error, row) => error ? reject(error) : resolve(row || null),
    );
  });
}

export function createUser({ name, email, passwordHash }) {
  return new Promise((resolve, reject) => {
    db.run(
      'INSERT INTO users (name, email, password_hash) VALUES (?, ?, ?)',
      [name, email, passwordHash],
      function onInsert(error) {
        if (error) return reject(error);
        resolve({ id: this.lastID, name, email });
      },
    );
  });
}

export function publicUser(user) {
  return { id: user.id, name: user.name, email: user.email, createdAt: user.created_at || undefined };
}
