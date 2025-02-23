import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import axios from "axios";

const app = express();
const port = 3001;

interface Button {
  id: number;
  remote_id: number;
  name: string;
  ir_data: string | null;
}

app.use(cors());
app.use(express.json());

// Activity Log Middleware
app.use((req, res, next) => {
  const start = Date.now();

  res.on("finish", () => {
    const duration = Date.now() - start;
    const log = {
      timestamp: new Date().toISOString(),
      method: req.method,
      url: req.originalUrl,
      body: req.body,
      status: res.statusCode,
      duration: duration + "ms",
    };
    console.log(JSON.stringify(log));
  });

  next();
});

const db = new sqlite3.Database("./ir.db", (err) => {
  if (err) {
    console.error(err.message);
  }
  console.log("Connected to the ir.db database.");
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

app.get("/", (req, res) => {
  res.send("IR Manager Backend!");
});

// API endpoints will be added here

// Remotes API
app.get("/remotes", (req, res) => {
  db.all("SELECT * FROM remotes", (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

interface Remote {
  id: number;
  name: string;
}

app.get("/remotes/:id", (req, res) => {
  db.get(
    "SELECT * FROM remotes WHERE id = ?",
    [req.params.id],
    (err, row: Remote) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (row) {
          res.json(row);
        } else {
          res.status(404).send("Remote not found");
        }
      }
    }
  );
});

app.post("/remotes", (req, res) => {
  const { name } = req.body;
  db.run("INSERT INTO remotes (name) VALUES (?)", [name], function (err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.put("/remotes/:id", (req, res) => {
  const { name } = req.body;
  db.run(
    "UPDATE remotes SET name = ? WHERE id = ?",
    [name, req.params.id],
    (err) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        res.send("Remote updated");
      }
    }
  );
});

app.delete("/buttons/:id", (req, res) => {
  db.run("DELETE FROM buttons WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send("Button deleted");
    }
  });
});

app.delete("/remotes/:id", (req, res) => {
  db.run("DELETE FROM remotes WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send("Remote deleted");
    }
  });
});

app.listen(port, () => {
  console.log(`IR Manager Backend listening on port ${port}`);
});

// Buttons API
app.get("/remotes/:remote_id/buttons", (req, res) => {
  const remoteId = req.params.remote_id;
  db.all(
    "SELECT * FROM buttons WHERE remote_id = ?",
    [remoteId],
    (err, rows: Button[]) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        const buttonsWithStatus = rows.map((button) => {
          let status = "pending";
          if (button.ir_data) {
            status = "success";
          } else {
            status = "pending";
          }
          return { ...button, status };
        });
        res.json(buttonsWithStatus);
      }
    }
  );
});

app.get("/buttons/:id", (req, res) => {
  db.get(
    "SELECT * FROM buttons WHERE id = ?",
    [req.params.id],
    (err, row: Button) => {
      if (err) {
        res.status(500).send(err.message);
      } else {
        if (row) {
          res.json(row);
        } else {
          res.status(404).send("Button not found");
        }
      }
    }
  );
});

app.post("/remotes/:remote_id/buttons", async (req, res) => {
  const { name } = req.body;
  const remoteId = req.params.remote_id;

  try {
    const response = await axios.post(`${IR_SERVER_URL}/register`, {});
    const irData = response.data;

    if (irData[0] === irData[1] && irData[1] === irData[2]) {
      db.run(
        "INSERT INTO buttons (remote_id, name, ir_data) VALUES (?, ?, ?)",
        [remoteId, name, irData[0]],
        function (err) {
          if (err) {
            console.error(err);
            res.status(500).json({
              message: "リモコンの登録に失敗しました。",
              error: err.message,
            });
          } else {
            const buttonId = this.lastID;
            res.json({ id: buttonId });
          }
        }
      );
    } else {
      res.status(400).json({
        message: "赤外線データの受信に失敗しました。もう一度お試しください。",
      });
    }
  } catch (error: any) {
    console.error(error);
    res.status(500).json({
      message: "赤外線データの登録に失敗しました。",
      error: error.message,
    });
  }
});

const IR_SERVER_URL = "http://localhost:3002";

app.post("/transmit/:id", async (req, res) => {
  const buttonId = req.params.id;

  try {
    const button = await new Promise<Button>((resolve, reject) => {
      db.get(
        "SELECT * FROM buttons WHERE id = ?",
        [buttonId],
        (err, row: Button) => {
          if (err) {
            reject(err);
          } else {
            resolve(row);
          }
        }
      );
    });

    if (!button) {
      res.status(404).send("Button not found");
      return;
    }

    const irData = button.ir_data;

    if (irData) {
      await axios.post(`${IR_SERVER_URL}/transmit`, {
        irData: irData,
      });
      res.send("IR data transmitted");
    } else {
      res.status(400).send("IR data not available");
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to transmit IR data");
  }
});

app.delete("/buttons/:id", (req, res) => {
  db.run("DELETE FROM buttons WHERE id = ?", [req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send("Button deleted");
    }
  });
});
