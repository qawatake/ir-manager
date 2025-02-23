import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./ir.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the ir.db database.');
});

db.serialize(() => {
  db.run(`CREATE TABLE IF NOT EXISTS remotes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL
  )`);

  db.run(`CREATE TABLE IF NOT EXISTS buttons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    remote_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    ir_data TEXT,
    FOREIGN KEY (remote_id) REFERENCES remotes(id)
  )`);
});

export default db;
