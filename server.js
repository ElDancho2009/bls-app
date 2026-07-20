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

function recentForm(teamId, excludeMatchId) {
  const rows = db
    .prepare(
      `SELECT id, home_team_id, away_team_id, home_score, away_score
       FROM matches
       WHERE status = 'ft' AND id != ? AND (home_team_id = ? OR away_team_id = ?)
       ORDER BY kickoff_at DESC
       LIMIT 5`
    )
    .all(excludeMatchId, teamId, teamId);

  return rows.reverse().map((m) => {
    const isHome = m.home_team_id === teamId;
    const gf = isHome ? m.home_score : m.away_score;
    const ga = isHome ? m.away_score : m.home_score;
    if (gf > ga) return 'W';
    if (gf < ga) return 'L';
    return 'D';
  });
}

app.get('/api/matches/:id', (req, res) => {
  const matchId = Number(req.params.id);
  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: 'Match id must be an integer.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const homeTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.home_team_id);
  const awayTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.away_team_id);

  const events = db
    .prepare('SELECT * FROM match_events WHERE match_id = ? ORDER BY minute ASC')
    .all(matchId);

  const lineupRows = db
    .prepare(
      `SELECT ml.*, p.name AS player_name
       FROM match_lineups ml
       JOIN players p ON p.id = ml.player_id
       WHERE ml.match_id = ?
       ORDER BY ml.num ASC`
    )
    .all(matchId);

  const lineups = {
    home: lineupRows.filter((row) => row.team_id === match.home_team_id),
    away: lineupRows.filter((row) => row.team_id === match.away_team_id),
  };

  const media = db
    .prepare('SELECT * FROM match_clips WHERE match_id = ? ORDER BY minute ASC')
    .all(matchId);

  const motm = db
    .prepare(
      `SELECT mc.*, p.name AS player_name
       FROM motm_candidates mc
       JOIN players p ON p.id = mc.player_id
       WHERE mc.match_id = ?
       ORDER BY mc.votes DESC`
    )
    .all(matchId);

  const form = {
    home: recentForm(match.home_team_id, matchId),
    away: recentForm(match.away_team_id, matchId),
  };

  res.json({ match, homeTeam, awayTeam, events, lineups, media, motm, form });
});

app.post('/api/matches/:id/motm/:candidateId/vote', (req, res) => {
  const matchId = Number(req.params.id);
  const candidateId = Number(req.params.candidateId);
  if (!Number.isInteger(matchId) || !Number.isInteger(candidateId)) {
    return res.status(400).json({ error: 'Match id and candidate id must be integers.' });
  }

  const candidate = db
    .prepare('SELECT * FROM motm_candidates WHERE id = ? AND match_id = ?')
    .get(candidateId, matchId);
  if (!candidate) {
    return res.status(404).json({ error: 'MOTM candidate not found for this match.' });
  }

  db.prepare('UPDATE motm_candidates SET votes = votes + 1 WHERE id = ?').run(candidateId);

  const updated = db.prepare('SELECT * FROM motm_candidates WHERE id = ?').get(candidateId);
  res.json(updated);
});

app.get('/api/standings', (req, res) => {
  const { division } = req.query;
  const whereClause = division ? 'WHERE t.division = ?' : '';
  const params = division ? [division] : [];

  const standings = db
    .prepare(
      `WITH team_matches AS (
         SELECT home_team_id AS team_id, home_score AS gf, away_score AS ga
         FROM matches
         WHERE status = 'ft' AND (division IS NULL OR division != 'cross')
         UNION ALL
         SELECT away_team_id AS team_id, away_score AS gf, home_score AS ga
         FROM matches
         WHERE status = 'ft' AND (division IS NULL OR division != 'cross')
       )
       SELECT
         t.id, t.name, t.division,
         COUNT(tm.team_id) AS gp,
         COALESCE(SUM(CASE WHEN tm.gf > tm.ga THEN 1 ELSE 0 END), 0) AS w,
         COALESCE(SUM(CASE WHEN tm.gf < tm.ga THEN 1 ELSE 0 END), 0) AS l,
         COALESCE(SUM(CASE WHEN tm.gf = tm.ga THEN 1 ELSE 0 END), 0) AS d,
         COALESCE(SUM(tm.gf), 0) AS gf,
         COALESCE(SUM(tm.ga), 0) AS ga,
         COALESCE(SUM(tm.gf), 0) - COALESCE(SUM(tm.ga), 0) AS gd,
         COALESCE(SUM(CASE WHEN tm.gf > tm.ga THEN 3 WHEN tm.gf = tm.ga THEN 1 ELSE 0 END), 0) AS pts
       FROM teams t
       LEFT JOIN team_matches tm ON tm.team_id = t.id
       ${whereClause}
       GROUP BY t.id
       ORDER BY pts DESC, gd DESC, gf DESC`
    )
    .all(...params);

  res.json(standings);
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

  const { home_score, away_score } = req.body || {};
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
      "UPDATE matches SET home_score = ?, away_score = ?, status = 'ft' WHERE id = ?"
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

app.use((err, req, res, next) => {
  console.error(err);
  const status = err.status || err.statusCode || 500;
  res.status(status).json({ error: status === 500 ? 'Internal server error.' : err.message });
});

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
