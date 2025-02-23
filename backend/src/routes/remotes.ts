import express from 'express';
import db from '../db';

const router = express.Router();

router.get('/', (req, res) => {
  db.all('SELECT * FROM remotes', (err, rows) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json(rows);
    }
  });
});

router.get('/:id', (req, res) => {
  db.get('SELECT * FROM remotes WHERE id = ?', [req.params.id], (err, row) => {
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

router.post('/', (req, res) => {
  const { name } = req.body;
  db.run('INSERT INTO remotes (name) VALUES (?)', [name], function(err) {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.json({ id: this.lastID });
    }
  });
});

router.put('/:id', (req, res) => {
  const { name } = req.body;
  db.run('UPDATE remotes SET name = ? WHERE id = ?', [name, req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Remote updated');
    }
  });
});

router.delete('/:id', (req, res) => {
  db.run('DELETE FROM remotes WHERE id = ?', [req.params.id], (err) => {
    if (err) {
      res.status(500).send(err.message);
    } else {
      res.send('Remote deleted');
    }
  });
});

export default router;
