import express from 'express';
import db from '../db';
import { startListening, getIrData as getIrDataFromService, clearIrData, irData } from '../ir-service.js';

const router = express.Router();

interface Button {
  id: number;
  remote_id: number;
  name: string;
  ir_data: string | null;
}

router.get('/remotes/:remote_id/buttons', (req, res) => {
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

router.get('/buttons/:id', (req, res) => {
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

router.post('/remotes/:remote_id/buttons', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO buttons (remote_id, name) VALUES (?, ?)', [req.params.remote_id, name], function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ id: this.lastID });
    }
  });
});

router.put('/buttons/:id', (req, res) => {
  const { name, ir_data } = req.body;
  db.run('UPDATE buttons SET name = ?, ir_data = ? WHERE id = ?', [name, ir_data, req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Button updated');
    }
  });
});

router.delete('/buttons/:id', (req, res) => {
  db.run('DELETE FROM buttons WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Button deleted');
    }
  });
});

// Endpoint to start listening for IR data
router.post('/listenir/:button_id', (req, res) => {
  const buttonId = req.params.button_id;
  startListening(buttonId);
  console.log(`Start listening IR data for button ${buttonId}`);
  res.send('Start listening IR data');
});

// Endpoint to check for available IR data
router.get('/irdata/:button_id', (req, res) => {
  const buttonId = req.params.button_id;
  const irDataFromService = getIrDataFromService(buttonId);

  if (irDataFromService) {
    res.json({ data: irDataFromService });
  } else {
    res.status(404).send('IR data not found');
  }
});

export default router;
