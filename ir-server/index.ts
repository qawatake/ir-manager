import express from 'express';
import cors from 'cors';

const app = express();
app.use(cors());
app.use(express.json());

const port = 3002;

app.post('/register', async (req, res) => {
  console.log(`Received register request`);

  // Mock IR data
  const buffer1 = Buffer.from(Math.random().toString(36).slice(-8));
  const irData1 = buffer1.toString('base64');
  const buffer2 = Buffer.from(Math.random().toString(36).slice(-8));
  const irData2 = buffer2.toString('base64');
  const buffer3 = Buffer.from(Math.random().toString(36).slice(-8));
  const irData3 = buffer3.toString('base64');

  const allSame = Math.random() < 0.5;

  const responseData = [
    allSame ? irData1 : irData1,
    allSame ? irData1 : irData2,
    allSame ? irData1 : irData3,
  ];

  await new Promise((resolve) => setTimeout(resolve, 2000));

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
