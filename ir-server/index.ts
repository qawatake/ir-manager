import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const port = 3002;

app.post('/register', (req, res) => {
  const buttonId = req.body.buttonId;
  console.log(`Received register request for buttonId: ${buttonId}`);

  // Mock IR data
  const irData1 = Math.random().toString(36).slice(-8);
  const irData2 = Math.random().toString(36).slice(-8);
  const irData3 = Math.random().toString(36).slice(-8);

  const allSame = Math.random() < 0.5;

  const responseData = [
    allSame ? irData1 : irData1,
    allSame ? irData1 : irData2,
    allSame ? irData1 : irData3,
  ];

  // Respond with IR data three times
  res.json(responseData);
});

app.post('/transmit', (req, res) => {
  const irData = req.body.irData;
  console.log(`Received transmit request with irData: ${irData}`);
  res.send('OK');
});

app.listen(port, () => {
  console.log(`IR server listening on port ${port}`);
});
