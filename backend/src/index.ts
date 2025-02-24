import express from "express";
import cors from "cors";
import sqlite3 from "sqlite3";
import axios from "axios";
import db from "./db.js";

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

app.post("/irdata", (req, res) => {
  const { data } = req.body;

  if (!data) {
    res.status(400).send("Data is required");
    return;
  }

  try {
    db.run(
      "INSERT INTO ir_data (data) VALUES (?)",
      [data],
      function (err) {
        if (err) {
          console.error(err);
          res.status(500).send(err.message);
        } else {
          res.json({ id: this.lastID });
        }
      }
    );
  } catch (error) {
    console.error(error);
    res.status(500).send("Failed to store data");
  }
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
  const requestTime = new Date();

  let attempt = 0;
  while (attempt < 60) {
    try {
      // Fetch ir_data created after the request time
      const irDataRows: { data: string; created_at: string }[] = await new Promise((resolve, reject) => {
        db.all<{ data: string; created_at: string }>(
          "SELECT data, created_at FROM ir_data WHERE created_at >= strftime('%Y-%m-%d %H:%M:%S', ?)",
          [requestTime.toISOString()],
          (err, rows) => {
            if (err) {
              reject(err);
            } else {
              resolve(rows);
            }
          }
        );
      });

      // Group ir_data by data value
      const dataCounts: { [data: string]: number } = {};
      irDataRows.forEach((row) => {
        dataCounts[row.data] = (dataCounts[row.data] || 0) + 1;
      });

      // Find data with at least 3 occurrences
      let matchingData: string | null = null;
      for (const data in dataCounts) {
        if (dataCounts[data] >= 1) {
          matchingData = data;
          break;
        }
      }

      if (matchingData) {
        // Create button record
        db.run(
          "INSERT INTO buttons (remote_id, name, ir_data) VALUES (?, ?, ?)",
          [remoteId, name, matchingData],
          function (err) {
            if (err) {
              console.error(err);
              res.status(500).json({
                message: "Failed to create button record.",
                error: err.message,
              });
            } else {
              const buttonId = this.lastID;
              res.json({ id: buttonId });
            }
          }
        );
        return; // Exit the loop after successful button creation
      } else {
        // Wait 1 second before retrying
        await new Promise((resolve) => setTimeout(resolve, 1000));
        attempt++;
      }
    } catch (error: any) {
      console.error(error);
      res.status(500).json({
        message: "Failed to process IR data.",
        error: error.message,
      });
      return;
    }
  }

  // Timeout error
  res.status(408).json({
    message: "Timeout: Failed to receive enough IR data. Please try again.",
  });
});

const IR_SERVER_URL = "http://192.168.10.116";

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
      await axios.post(`${IR_SERVER_URL}/ir`, {
        data: irData,
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
