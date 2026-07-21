const express = require('express');
const db = require('./database.js');
const { recalculateTeamPoints } = require('./points.js');
const {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  requireAuth,
} = require('./auth.js');

const app = express();
const PORT = 3000;

app.use(express.json());

app.get('/', (req, res) => {
  res.send('BLS App Engine is Live! ');
});

app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'email and password are required.' });
  }

  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  if (!user || !verifyPassword(password, user.password_hash)) {
    return res.status(401).json({ error: 'Invalid email or password.' });
  }

  const { token } = createSession(user.id);
  res.json({
    token,
    user: { id: user.id, email: user.email, teamId: user.team_id, role: user.role },
  });
});

app.post('/api/auth/logout', requireAuth, (req, res) => {
  destroySession(req.sessionToken);
  res.status(204).end();
});

app.get('/api/auth/me', requireAuth, (req, res) => {
  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(req.user.team_id);
  res.json({ user: req.user, team });
});

app.get('/api/teams', (req, res) => {
  const teams = db.prepare('SELECT * FROM teams').all();
  res.json(teams);
});

app.get('/api/players', (req, res) => {
  const { team_id } = req.query;
  if (team_id !== undefined) {
    const teamId = Number(team_id);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ error: 'team_id must be an integer.' });
    }
    const players = db.prepare('SELECT * FROM players WHERE team_id = ?').all(teamId);
    return res.json(players);
  }

  const players = db.prepare('SELECT * FROM players').all();
  res.json(players);
});

app.patch('/api/players/:id/status', requireAuth, (req, res) => {
  const playerId = Number(req.params.id);
  if (!Number.isInteger(playerId)) {
    return res.status(400).json({ error: 'Player id must be an integer.' });
  }

  const { status } = req.body || {};
  if (status !== 'available' && status !== 'injured') {
    return res.status(400).json({ error: "status must be 'available' or 'injured'." });
  }

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }
  if (player.team_id !== req.user.team_id) {
    return res.status(403).json({ error: 'You can only update players on your own team.' });
  }

  db.prepare('UPDATE players SET status = ? WHERE id = ?').run(status, playerId);
  const updated = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  res.json(updated);
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

app.put('/api/matches/:id/lineup', requireAuth, (req, res) => {
  const matchId = Number(req.params.id);
  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: 'Match id must be an integer.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const teamId = req.user.team_id;
  const isHome = match.home_team_id === teamId;
  const isAway = match.away_team_id === teamId;
  if (!isHome && !isAway) {
    return res.status(403).json({ error: 'Your team is not part of this match.' });
  }

  const { formation, players } = req.body || {};
  if (typeof formation !== 'string' || !Array.isArray(players) || players.length === 0) {
    return res
      .status(400)
      .json({ error: 'formation (string) and players (non-empty array) are required.' });
  }
  for (const p of players) {
    if (!Number.isInteger(p.playerId) || !Number.isInteger(p.num) || typeof p.pos !== 'string') {
      return res.status(400).json({ error: 'Each player needs playerId, num, and pos.' });
    }
  }

  try {
    db.exec('BEGIN');

    db.prepare('DELETE FROM match_lineups WHERE match_id = ? AND team_id = ?').run(
      matchId,
      teamId
    );

    const insertLineup = db.prepare(
      'INSERT INTO match_lineups (match_id, team_id, player_id, num, pos, is_starting) VALUES (?, ?, ?, ?, ?, 1)'
    );
    for (const p of players) {
      insertLineup.run(matchId, teamId, p.playerId, p.num, p.pos);
    }

    const formationColumn = isHome ? 'home_formation' : 'away_formation';
    db.prepare(`UPDATE matches SET ${formationColumn} = ? WHERE id = ?`).run(formation, matchId);

    db.exec('COMMIT');
  } catch (err) {
    db.exec('ROLLBACK');
    throw err;
  }

  const lineup = db
    .prepare(
      `SELECT ml.*, p.name AS player_name
       FROM match_lineups ml
       JOIN players p ON p.id = ml.player_id
       WHERE ml.match_id = ? AND ml.team_id = ?
       ORDER BY ml.num ASC`
    )
    .all(matchId, teamId);

  res.json({ formation, lineup });
});

app.get('/api/referees', (req, res) => {
  const referees = db.prepare('SELECT * FROM referees').all();
  res.json(referees);
});

app.get('/api/matches/:id/referees', (req, res) => {
  const matchId = Number(req.params.id);
  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: 'Match id must be an integer.' });
  }

  const referees = db
    .prepare(
      `SELECT r.*
       FROM match_referees mr
       JOIN referees r ON r.id = mr.referee_id
       WHERE mr.match_id = ?`
    )
    .all(matchId);
  res.json(referees);
});

app.post('/api/matches/:id/referees/:refId', requireAuth, (req, res) => {
  const matchId = Number(req.params.id);
  const refId = Number(req.params.refId);
  if (!Number.isInteger(matchId) || !Number.isInteger(refId)) {
    return res.status(400).json({ error: 'Match id and referee id must be integers.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  if (match.home_team_id !== req.user.team_id && match.away_team_id !== req.user.team_id) {
    return res.status(403).json({ error: 'Your team is not part of this match.' });
  }

  const referee = db.prepare('SELECT * FROM referees WHERE id = ?').get(refId);
  if (!referee) {
    return res.status(404).json({ error: 'Referee not found.' });
  }
  if (!referee.available) {
    return res.status(400).json({ error: 'Referee is not available.' });
  }

  db.prepare('INSERT OR IGNORE INTO match_referees (match_id, referee_id) VALUES (?, ?)').run(
    matchId,
    refId
  );

  const referees = db
    .prepare(
      `SELECT r.*
       FROM match_referees mr
       JOIN referees r ON r.id = mr.referee_id
       WHERE mr.match_id = ?`
    )
    .all(matchId);
  res.json(referees);
});

app.delete('/api/matches/:id/referees/:refId', requireAuth, (req, res) => {
  const matchId = Number(req.params.id);
  const refId = Number(req.params.refId);
  if (!Number.isInteger(matchId) || !Number.isInteger(refId)) {
    return res.status(400).json({ error: 'Match id and referee id must be integers.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  if (match.home_team_id !== req.user.team_id && match.away_team_id !== req.user.team_id) {
    return res.status(403).json({ error: 'Your team is not part of this match.' });
  }

  db.prepare('DELETE FROM match_referees WHERE match_id = ? AND referee_id = ?').run(
    matchId,
    refId
  );
  res.status(204).end();
});

app.get('/api/venues', (req, res) => {
  const venues = db
    .prepare('SELECT * FROM venues')
    .all()
    .map((venue) => ({
      ...venue,
      fields: JSON.parse(venue.fields_json),
      fields_json: undefined,
    }));
  res.json(venues);
});

app.get('/api/friendly-requests', requireAuth, (req, res) => {
  const teamId = req.user.team_id;

  const requests = db
    .prepare(
      `SELECT fr.*, t.name AS team_name, t.division AS team_division
       FROM friendly_requests fr
       JOIN teams t ON t.id = fr.team_id
       WHERE fr.team_id != ?
       ORDER BY fr.date ASC`
    )
    .all(teamId);

  const invitedRequestIds = new Set(
    db
      .prepare('SELECT request_id FROM friendly_invites WHERE inviting_team_id = ?')
      .all(teamId)
      .map((row) => row.request_id)
  );

  const withVenue = requests.map((request) => {
    const venue = request.venue_id
      ? db.prepare('SELECT * FROM venues WHERE id = ?').get(request.venue_id)
      : null;
    return {
      ...request,
      venue: venue
        ? { ...venue, fields: JSON.parse(venue.fields_json), fields_json: undefined }
        : null,
      invited: invitedRequestIds.has(request.id),
    };
  });

  res.json(withVenue);
});

app.post('/api/friendly-requests', requireAuth, (req, res) => {
  const { date, time, venueId } = req.body || {};
  if (typeof date !== 'string' || typeof time !== 'string') {
    return res.status(400).json({ error: 'date and time are required.' });
  }
  if (venueId !== undefined && venueId !== null && !Number.isInteger(venueId)) {
    return res.status(400).json({ error: 'venueId must be an integer if provided.' });
  }

  const result = db
    .prepare('INSERT INTO friendly_requests (team_id, date, time, venue_id) VALUES (?, ?, ?, ?)')
    .run(req.user.team_id, date, time, venueId ?? null);

  const created = db
    .prepare('SELECT * FROM friendly_requests WHERE id = ?')
    .get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.post('/api/friendly-requests/:id/invite', requireAuth, (req, res) => {
  const requestId = Number(req.params.id);
  if (!Number.isInteger(requestId)) {
    return res.status(400).json({ error: 'Request id must be an integer.' });
  }

  const request = db.prepare('SELECT * FROM friendly_requests WHERE id = ?').get(requestId);
  if (!request) {
    return res.status(404).json({ error: 'Friendly request not found.' });
  }
  if (request.team_id === req.user.team_id) {
    return res.status(400).json({ error: 'You cannot invite your own team.' });
  }

  db.prepare(
    'INSERT OR IGNORE INTO friendly_invites (request_id, inviting_team_id) VALUES (?, ?)'
  ).run(requestId, req.user.team_id);

  res.status(201).json({ requestId, invited: true });
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
