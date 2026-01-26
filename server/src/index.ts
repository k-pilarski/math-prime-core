import express from 'express';

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('Backend works!!');
});

app.listen(PORT, () => {
  console.log(`The server runs on http://localhost:${PORT}`);
});