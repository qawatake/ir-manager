import express from 'express';
import cors from 'cors';
import sqlite3 from 'sqlite3';

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

app.get('/', (req, res) => {
  res.send('IR Manager Backend');
});

// API endpoints will be added here

// Remotes API
app.get('/remotes', (req, res) => {
  db.all('SELECT * FROM remotes', (err, rows) => {
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

app.get('/remotes/:id', (req, res) => {
  db.get('SELECT * FROM remotes WHERE id = ?', [req.params.id], (err, row: Remote) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (row) {
        res.json(row);
      } else {
        res.status(404).send('Remote not found');
      }
    }
  });
});

app.post('/remotes', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO remotes (name) VALUES (?)', [name], function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.put('/remotes/:id', (req, res) => {
  const { name } = req.body;
  db.run('UPDATE remotes SET name = ? WHERE id = ?', [name, req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Remote updated');
    }
  });
});

app.delete('/remotes/:id', (req, res) => {
  db.run('DELETE FROM remotes WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Remote deleted');
    }
  });
});

// Buttons API
app.get('/remotes/:remote_id/buttons', (req, res) => {
  const remoteId = req.params.remote_id;
  db.all('SELECT * FROM buttons WHERE remote_id = ?', [remoteId], (err, rows: Button[]) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      const buttonsWithStatus = rows.map(button => {
        let status = 'pending';
        if (button.ir_data) {
          status = 'success';
        } else if (irData[button.id] && irData[button.id].length > 0) {
          status = 'warning';
        }
        return { ...button, status };
      });
      res.json(buttonsWithStatus);
    }
  });
});

app.get('/buttons/:id', (req, res) => {
  db.get('SELECT * FROM buttons WHERE id = ?', [req.params.id], (err, row: Button) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (row) {
        res.json(row);
      } else {
        res.status(404).send('Button not found');
      }
    }
  });
});


app.post('/remotes/:remote_id/buttons', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO buttons (remote_id, name) VALUES (?, ?)', [req.params.remote_id, name], function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ id: this.lastID });
    }
  });
});

app.put('/buttons/:id', (req, res) => {
  const { name, ir_data } = req.body;
  db.run('UPDATE buttons SET name = ?, ir_data = ? WHERE id = ?', [name, ir_data, req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Button updated');
    }
  });
});

app.delete('/buttons/:id', (req, res) => {
  db.run('DELETE FROM buttons WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Button deleted');
    }
  });
});

// Endpoint to check for available IR data
app.get('/irdata/:button_id', (req, res) => {
  const buttonId = req.params.button_id;

  if (irData[buttonId] && irData[buttonId].length === 3) {
    const first = irData[buttonId][0];
    const allEqual = irData[buttonId].every(d => d === first);

    if (allEqual) {
      res.json({ data: first });
      return;
    }
  }

  res.status(404).send('IR data not found');
});

interface IRData {
  [buttonId: string]: string[];
}

const irData: IRData = {};

// Endpoint to receive IR data
app.post('/irdata/:button_id', (req, res) => {
  const buttonId = req.params.button_id;
  const data = req.body.data;

  if (!irData[buttonId]) {
    irData[buttonId] = [];
  }

  irData[buttonId].push(data);

  if (irData[buttonId].length < 3) {
    res.send(`Received IR data for button ${buttonId}. Waiting for more data (${irData[buttonId].length}/3)`);
    return;
  }

  const first = irData[buttonId][0];
  const allEqual = irData[buttonId].every(d => d === first);

  if (!allEqual) {
    irData[buttonId] = [];
    res.status(400).send('Received IR data is not consistent. Please try again.');
    return;
  }

  // Store the IR data in the database
  db.run('UPDATE buttons SET ir_data = ? WHERE id = ?', [first, buttonId], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      delete irData[buttonId];
      res.send('IR data received and stored successfully');
    }
  });
});

// Endpoint to send IR data to IR transmission service
app.post('/sendir/:button_id', (req, res) => {
  const buttonId = req.params.button_id;

  db.get('SELECT ir_data FROM buttons WHERE id = ?', [buttonId], (err, row: Button) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      if (row && row.ir_data) {
        const irData = row.ir_data;
        // TODO: Implement logic to send the IR data to the IR transmission service.
        console.log(`Sending IR data for button ${buttonId}: ${irData}`);
        res.send('IR data sent to IR transmission service');
      } else {
        res.status(404).send('IR data not found for this button');
      }
    }
  });
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
