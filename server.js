const express = require('express');
const db = require('./database.js');

const app = express();
const PORT = 3000;

app.get('/', (req, res) => {
  res.send('BLS App Engine is Live! ');
});

app.get('/api/teams', (req, res) => {
  const teams = db.prepare('SELECT * FROM teams').all();
  res.json(teams);
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
