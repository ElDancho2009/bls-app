const express = require('express');
const db = require('./database.js');
const { recalculateTeamPoints } = require('./points.js');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('BLS App Engine is Live! ');
});

app.get('/api/teams', (req, res) => {
  const teams = db.prepare('SELECT * FROM teams').all();
  res.json(teams);
});

app.get('/api/players', (req, res) => {
  const players = db.prepare('SELECT * FROM players').all();
  res.json(players);
});

app.get('/api/matches', (req, res) => {
  const matches = db.prepare('SELECT * FROM matches').all();
  res.json(matches);
});

app.post('/api/matches/:id/result', (req, res) => {
  const matchId = Number(req.params.id);
  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: 'Match id must be an integer.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const { home_score, away_score } = req.body;
  if (
    !Number.isInteger(home_score) ||
    !Number.isInteger(away_score) ||
    home_score < 0 ||
    away_score < 0
  ) {
    return res
      .status(400)
      .json({ error: 'home_score and away_score must be non-negative integers.' });
  }

  try {
    db.exec('BEGIN');

    db.prepare(
      "UPDATE matches SET home_score = ?, away_score = ?, status = 'final' WHERE id = ?"
    ).run(home_score, away_score, matchId);

    recalculateTeamPoints(match.home_team_id);
    recalculateTeamPoints(match.away_team_id);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const updatedMatch = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  const homeTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.home_team_id);
  const awayTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.away_team_id);

  res.json({ match: updatedMatch, teams: [homeTeam, awayTeam] });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
