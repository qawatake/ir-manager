import sqlite3 from 'sqlite3';

const db = new sqlite3.Database('./ir.db', (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log('Connected to the ir.db database.');
});

const sqlLogEnabled = process.env.SQL_LOG === '1';

if (sqlLogEnabled) {
  const originalRun = db.run.bind(db);
  db.run = function (sql: string, ...params: any[]) {
    console.log('SQL Query:', sql, params);
    return originalRun(sql, ...params);
  };

  const originalAll = db.all.bind(db);
  db.all = function (sql: string, ...params: any[]) {
    console.log('SQL Query:', sql, params);
    return originalAll(sql, ...params);
  };
}

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

  db.run(`DROP TABLE IF EXISTS ir_data`);

  db.run(`CREATE TABLE IF NOT EXISTS ir_data (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    data TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )`);
});

export default db;
