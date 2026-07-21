const express = require('express');
const db = require('./database.js');
const { recalculateTeamPoints } = require('./points.js');
const {
  hashPassword,
  verifyPassword,
  createSession,
  destroySession,
  requireAuth,
  requireRole,
} = require('./auth.js');

const app = express();
const PORT = 3000;

app.use(express.json());

// A league_director can act on any team's resources; everyone else must own
// the resource (team_id) they're trying to modify.
function ownsOrOverrides(req, ownerTeamId) {
  return req.user.role === 'league_director' || req.user.team_id === ownerTeamId;
}

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
    user: {
      id: user.id,
      email: user.email,
      team_id: user.team_id,
      role: user.role,
      referee_id: user.referee_id,
    },
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

app.get('/api/teams/:id', (req, res) => {
  const teamId = Number(req.params.id);
  if (!Number.isInteger(teamId)) {
    return res.status(400).json({ error: 'Team id must be an integer.' });
  }

  const team = db.prepare('SELECT * FROM teams WHERE id = ?').get(teamId);
  if (!team) {
    return res.status(404).json({ error: 'Team not found.' });
  }

  const divisionStandings = db
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
         t.id,
         COUNT(tm.team_id) AS gp,
         COALESCE(SUM(tm.gf), 0) - COALESCE(SUM(tm.ga), 0) AS gd,
         COALESCE(SUM(CASE WHEN tm.gf > tm.ga THEN 3 WHEN tm.gf = tm.ga THEN 1 ELSE 0 END), 0) AS pts
       FROM teams t
       LEFT JOIN team_matches tm ON tm.team_id = t.id
       WHERE t.division = ?
       GROUP BY t.id
       ORDER BY pts DESC, gd DESC`
    )
    .all(team.division);

  const rank = divisionStandings.findIndex((s) => s.id === teamId) + 1;
  const teamStanding = divisionStandings.find((s) => s.id === teamId) ?? { gp: 0, gd: 0, pts: 0 };

  const pastMatches = db
    .prepare(
      `SELECT m.*, home.name AS home_name, home.logo_url AS home_logo_url,
              away.name AS away_name, away.logo_url AS away_logo_url
       FROM matches m
       JOIN teams home ON home.id = m.home_team_id
       JOIN teams away ON away.id = m.away_team_id
       WHERE m.status = 'ft' AND (m.home_team_id = ? OR m.away_team_id = ?)
       ORDER BY m.kickoff_at DESC`
    )
    .all(teamId, teamId);

  const results = pastMatches.map((m) => {
    const isHome = m.home_team_id === teamId;
    const gf = isHome ? m.home_score : m.away_score;
    const ga = isHome ? m.away_score : m.home_score;
    const resultLetter = gf > ga ? 'W' : gf < ga ? 'L' : 'D';
    const opponent = isHome
      ? { id: m.away_team_id, name: m.away_name, logoUrl: m.away_logo_url }
      : { id: m.home_team_id, name: m.home_name, logoUrl: m.home_logo_url };

    return {
      matchId: m.id,
      resultLetter,
      opponent,
      vsLabel: isHome ? 'vs' : '@',
      competition: m.competition,
      scoreText: `${gf}-${ga}`,
    };
  });

  res.json({
    team,
    rank,
    gp: teamStanding.gp,
    gd: teamStanding.gd,
    pts: teamStanding.pts,
    results,
  });
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

const PLAYER_POSITIONS = ['GK', 'DF', 'MF', 'FW'];

app.post(
  '/api/players',
  requireAuth,
  requireRole('coach_manager', 'league_director'),
  (req, res) => {
    const { name, number, position } = req.body || {};

    if (typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({ error: 'name is required.' });
    }
    if (!Number.isInteger(number) || number < 1 || number > 99) {
      return res.status(400).json({ error: 'number must be an integer between 1 and 99.' });
    }
    if (!PLAYER_POSITIONS.includes(position)) {
      return res.status(400).json({ error: `position must be one of: ${PLAYER_POSITIONS.join(', ')}.` });
    }

    let teamId;
    if (req.user.role === 'league_director') {
      teamId = Number(req.body?.teamId);
      if (!Number.isInteger(teamId)) {
        return res.status(400).json({ error: 'teamId is required for league directors.' });
      }
      const team = db.prepare('SELECT id FROM teams WHERE id = ?').get(teamId);
      if (!team) {
        return res.status(404).json({ error: 'Team not found.' });
      }
    } else {
      teamId = req.user.team_id;
    }

    const existingNumber = db
      .prepare('SELECT id FROM players WHERE team_id = ? AND number = ?')
      .get(teamId, number);
    if (existingNumber) {
      return res.status(409).json({ error: `Number ${number} is already taken on this team.` });
    }

    const { lastInsertRowid } = db
      .prepare('INSERT INTO players (name, team_id, position, number) VALUES (?, ?, ?, ?)')
      .run(name.trim(), teamId, position, number);
    const created = db.prepare('SELECT * FROM players WHERE id = ?').get(lastInsertRowid);
    res.status(201).json(created);
  }
);

app.patch(
  '/api/players/:id/status',
  requireAuth,
  requireRole('coach_manager', 'league_director'),
  (req, res) => {
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
    if (!ownsOrOverrides(req, player.team_id)) {
      return res.status(403).json({ error: 'You can only update players on your own team.' });
    }

    db.prepare('UPDATE players SET status = ? WHERE id = ?').run(status, playerId);
    const updated = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
    res.json(updated);
  }
);

app.put(
  '/api/players/:id/verify',
  requireAuth,
  requireRole('league_director'),
  (req, res) => {
    const playerId = Number(req.params.id);
    if (!Number.isInteger(playerId)) {
      return res.status(400).json({ error: 'Player id must be an integer.' });
    }

    const { verified } = req.body || {};
    if (typeof verified !== 'boolean') {
      return res.status(400).json({ error: 'verified must be a boolean.' });
    }

    const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
    if (!player) {
      return res.status(404).json({ error: 'Player not found.' });
    }

    db.prepare('UPDATE players SET verified = ? WHERE id = ?').run(verified ? 1 : 0, playerId);
    const updated = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
    res.json(updated);
  }
);

app.get('/api/matches', (req, res) => {
  const matches = db.prepare('SELECT * FROM matches').all();
  res.json(matches);
});

app.get('/api/bulletins', (req, res) => {
  const bulletins = db.prepare('SELECT * FROM bulletins ORDER BY created_at DESC').all();
  res.json(bulletins);
});

app.post('/api/news', requireAuth, requireRole('league_director'), (req, res) => {
  const { title, body } = req.body || {};
  if (typeof title !== 'string' || !title.trim() || typeof body !== 'string' || !body.trim()) {
    return res.status(400).json({ error: 'title and body are required.' });
  }

  const result = db
    .prepare('INSERT INTO bulletins (title, body, author_id) VALUES (?, ?, ?)')
    .run(title, body, req.user.id);

  const created = db.prepare('SELECT * FROM bulletins WHERE id = ?').get(result.lastInsertRowid);
  res.status(201).json(created);
});

app.get('/api/discipline', (req, res) => {
  const suspended = db
    .prepare(
      `SELECT p.*, t.name AS team_name, t.logo_url AS team_logo_url
       FROM players p
       JOIN teams t ON t.id = p.team_id
       WHERE p.red_cards >= 1
       ORDER BY p.red_cards DESC`
    )
    .all();

  const dangerZone = db
    .prepare(
      `SELECT p.*, t.name AS team_name, t.logo_url AS team_logo_url
       FROM players p
       JOIN teams t ON t.id = p.team_id
       WHERE p.red_cards = 0 AND p.yellow_cards >= 2
       ORDER BY p.yellow_cards DESC`
    )
    .all();

  res.json({ suspended, dangerZone });
});

app.get('/api/gotw', (req, res) => {
  const clips = db
    .prepare(
      `SELECT mc.id, mc.minute, mc.title, mc.gotw_votes AS votes,
              home.name AS home_name, away.name AS away_name
       FROM match_clips mc
       JOIN matches m ON m.id = mc.match_id
       JOIN teams home ON home.id = m.home_team_id
       JOIN teams away ON away.id = m.away_team_id
       WHERE mc.is_gotw_candidate = 1
       ORDER BY mc.gotw_votes DESC`
    )
    .all()
    .map((c) => ({ ...c, context: `${c.home_name} vs ${c.away_name}` }));

  res.json(clips);
});

app.post('/api/gotw/:clipId/vote', (req, res) => {
  const clipId = Number(req.params.clipId);
  if (!Number.isInteger(clipId)) {
    return res.status(400).json({ error: 'Clip id must be an integer.' });
  }

  const clip = db
    .prepare('SELECT * FROM match_clips WHERE id = ? AND is_gotw_candidate = 1')
    .get(clipId);
  if (!clip) {
    return res.status(404).json({ error: 'Goal of the Week candidate not found.' });
  }

  db.prepare('UPDATE match_clips SET gotw_votes = gotw_votes + 1 WHERE id = ?').run(clipId);
  const updated = db
    .prepare('SELECT id, gotw_votes AS votes FROM match_clips WHERE id = ?')
    .get(clipId);
  res.json(updated);
});

function weeklyStatsByPlayerId() {
  const rows = db
    .prepare(
      `SELECT p.id AS player_id,
              SUM(CASE WHEN me.type = 'goal' THEN 1 ELSE 0 END) AS goals,
              SUM(CASE WHEN me.type = 'assist' THEN 1 ELSE 0 END) AS assists
       FROM players p
       LEFT JOIN match_events me ON me.player_name = p.name
       GROUP BY p.id`
    )
    .all();
  return Object.fromEntries(rows.map((r) => [r.player_id, { goals: r.goals, assists: r.assists }]));
}

app.get('/api/potw', (req, res) => {
  const candidates = db
    .prepare(
      `SELECT pc.id, pc.votes, p.id AS player_id, p.name, t.name AS team_name, t.logo_url AS team_logo_url
       FROM potw_candidates pc
       JOIN players p ON p.id = pc.player_id
       JOIN teams t ON t.id = p.team_id
       ORDER BY pc.votes DESC`
    )
    .all();

  const stats = weeklyStatsByPlayerId();

  res.json(
    candidates.map((c) => ({
      id: c.id,
      playerId: c.player_id,
      name: c.name,
      teamName: c.team_name,
      teamLogoUrl: c.team_logo_url,
      votes: c.votes,
      goals: stats[c.player_id]?.goals ?? 0,
      assists: stats[c.player_id]?.assists ?? 0,
    }))
  );
});

app.post('/api/potw/:candidateId/vote', (req, res) => {
  const candidateId = Number(req.params.candidateId);
  if (!Number.isInteger(candidateId)) {
    return res.status(400).json({ error: 'Candidate id must be an integer.' });
  }

  const candidate = db.prepare('SELECT * FROM potw_candidates WHERE id = ?').get(candidateId);
  if (!candidate) {
    return res.status(404).json({ error: 'Player of the Week candidate not found.' });
  }

  db.prepare('UPDATE potw_candidates SET votes = votes + 1 WHERE id = ?').run(candidateId);
  const updated = db.prepare('SELECT * FROM potw_candidates WHERE id = ?').get(candidateId);
  res.json(updated);
});

app.get('/api/totw', (req, res) => {
  const picks = db
    .prepare(
      `SELECT tp.id, p.id AS player_id, p.name, p.number, p.position, p.rating,
              p.goals, p.assists, p.clean_sheets,
              t.name AS team_name, t.logo_url AS team_logo_url
       FROM totw_picks tp
       JOIN players p ON p.id = tp.player_id
       JOIN teams t ON t.id = p.team_id
       ORDER BY tp.id ASC`
    )
    .all();

  const potwWinner = db
    .prepare('SELECT player_id FROM potw_candidates ORDER BY votes DESC LIMIT 1')
    .get();

  res.json(
    picks.map((p) => ({
      id: p.id,
      playerId: p.player_id,
      name: p.name,
      number: p.number,
      position: p.position,
      rating: p.rating,
      statLine: p.position === 'GK' ? `${p.clean_sheets} CS` : `${p.goals}G ${p.assists}A`,
      teamName: p.team_name,
      teamLogoUrl: p.team_logo_url,
      isPlayerOfWeek: potwWinner != null && p.player_id === potwWinner.player_id,
    }))
  );
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

function topScorer(teamId) {
  return db
    .prepare('SELECT name, goals FROM players WHERE team_id = ? ORDER BY goals DESC LIMIT 1')
    .get(teamId);
}

function topKeeper(teamId) {
  return db
    .prepare(
      "SELECT name, clean_sheets FROM players WHERE team_id = ? AND position = 'GK' ORDER BY clean_sheets DESC LIMIT 1"
    )
    .get(teamId);
}

function topRatedPlayer(teamId) {
  return db
    .prepare('SELECT name, rating FROM players WHERE team_id = ? ORDER BY rating DESC LIMIT 1')
    .get(teamId);
}

app.get('/api/matches/motw', (req, res) => {
  const match = db.prepare('SELECT * FROM matches WHERE is_motw = 1 LIMIT 1').get();
  if (!match) {
    return res.status(404).json({ error: 'No Match of the Week is set.' });
  }

  const homeTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.home_team_id);
  const awayTeam = db.prepare('SELECT * FROM teams WHERE id = ?').get(match.away_team_id);

  const homeScorer = topScorer(match.home_team_id);
  const awayScorer = topScorer(match.away_team_id);
  const homeKeeper = topKeeper(match.home_team_id);
  const awayKeeper = topKeeper(match.away_team_id);
  const homeStar = topRatedPlayer(match.home_team_id);
  const awayStar = topRatedPlayer(match.away_team_id);

  res.json({
    match,
    homeTeam,
    awayTeam,
    form: {
      home: recentForm(match.home_team_id, match.id),
      away: recentForm(match.away_team_id, match.id),
    },
    offenseLeader: `${homeScorer?.name ?? 'TBD'} (${homeScorer?.goals ?? 0}) · ${awayScorer?.name ?? 'TBD'} (${awayScorer?.goals ?? 0})`,
    defenseLeader: `${homeKeeper?.name ?? 'TBD'} (${homeKeeper?.clean_sheets ?? 0} CS) · ${awayKeeper?.name ?? 'TBD'} (${awayKeeper?.clean_sheets ?? 0} CS)`,
    homePlayer: homeStar ? `${homeStar.name} (${homeStar.rating})` : 'TBD',
    awayPlayer: awayStar ? `${awayStar.name} (${awayStar.rating})` : 'TBD',
  });
});

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

function refereePinIsValid(matchId, pin) {
  if (typeof pin !== 'string' || pin.length === 0) return false;
  const match = db
    .prepare(
      `SELECT 1
       FROM match_referees mr
       JOIN referees r ON r.id = mr.referee_id
       WHERE mr.match_id = ? AND r.pin = ?`
    )
    .get(matchId, pin);
  return !!match;
}

// Login proves who a referee is (role='referee', linked via referee_id);
// the match PIN proves they're the one actually on the pitch for this
// specific fixture. league_director skips both checks (admin override).
app.post(
  '/api/matches/:id/signoff',
  requireAuth,
  requireRole('referee', 'league_director'),
  (req, res) => {
    const matchId = Number(req.params.id);
    if (!Number.isInteger(matchId)) {
      return res.status(400).json({ error: 'Match id must be an integer.' });
    }

    const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    if (!match) {
      return res.status(404).json({ error: 'Match not found.' });
    }
    if (match.ref_sheet_submitted_at) {
      return res.status(400).json({ error: 'This match sheet has already been submitted.' });
    }

    const { pin, motmPlayerId } = req.body || {};

    if (req.user.role === 'referee') {
      const assigned = db
        .prepare('SELECT 1 FROM match_referees WHERE match_id = ? AND referee_id = ?')
        .get(matchId, req.user.referee_id);
      if (!assigned) {
        return res.status(403).json({ error: 'You are not assigned to referee this match.' });
      }
      if (!refereePinIsValid(matchId, pin)) {
        return res.status(403).json({ error: 'Invalid referee PIN for this match.' });
      }
    }

    if (!Number.isInteger(motmPlayerId)) {
      return res.status(400).json({ error: 'motmPlayerId is required.' });
    }

    db.prepare(
      `UPDATE matches
       SET ref_sheet_submitted_at = datetime('now'), official_motm_player_id = ?
       WHERE id = ?`
    ).run(motmPlayerId, matchId);

    const updated = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
    res.json(updated);
  }
);

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

app.put(
  '/api/matches/:id/lineup',
  requireAuth,
  requireRole('coach_manager', 'league_director'),
  (req, res) => {
  const matchId = Number(req.params.id);
  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: 'Match id must be an integer.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  // A director isn't tied to a team, so they must say which side of the
  // match they're setting the lineup for; a coach_manager always acts on
  // their own team.
  let teamId;
  if (req.user.role === 'league_director') {
    teamId = Number(req.body?.teamId);
    if (!Number.isInteger(teamId)) {
      return res.status(400).json({ error: 'teamId is required for league_director lineup submissions.' });
    }
  } else {
    teamId = req.user.team_id;
  }

  const isHome = match.home_team_id === teamId;
  const isAway = match.away_team_id === teamId;
  if (!isHome && !isAway) {
    return res.status(403).json({ error: 'Your team is not part of this match.' });
  }

  const { formation, players, bench } = req.body || {};
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
  if (bench !== undefined && !Array.isArray(bench)) {
    return res.status(400).json({ error: 'bench must be an array of player ids if provided.' });
  }

  const selectedPlayerIds = [...players.map((p) => p.playerId), ...(bench ?? [])];
  const unverified = db
    .prepare(
      `SELECT id FROM players WHERE verified = 0 AND id IN (${selectedPlayerIds.map(() => '?').join(',')})`
    )
    .all(...selectedPlayerIds);
  if (unverified.length > 0) {
    return res.status(400).json({
      error: 'Lineup includes unverified players.',
      playerIds: unverified.map((p) => p.id),
    });
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

    if (bench && bench.length > 0) {
      const benchPlayers = db
        .prepare(`SELECT id, number, position FROM players WHERE id IN (${bench.map(() => '?').join(',')})`)
        .all(...bench);
      const insertBench = db.prepare(
        'INSERT INTO match_lineups (match_id, team_id, player_id, num, pos, is_starting) VALUES (?, ?, ?, ?, ?, 0)'
      );
      for (const bp of benchPlayers) {
        insertBench.run(matchId, teamId, bp.id, bp.number, bp.position);
      }
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
  }
);

function checkinBadge(player) {
  if (player.status === 'injured') {
    return {
      badgeLabel: 'Injured',
      badgeBg: '#d1293f',
      badgeColor: '#fff',
      flagged: true,
      bannerText: 'Marked injured — cannot be fielded this match.',
      canCheckIn: false,
    };
  }
  if (player.red_cards >= 1) {
    return {
      badgeLabel: 'Suspended',
      badgeBg: '#d1293f',
      badgeColor: '#fff',
      flagged: true,
      bannerText: 'Serving a suspension from a red card — cannot be fielded this match.',
      canCheckIn: false,
    };
  }
  if (player.yellow_cards >= 2) {
    return {
      badgeLabel: 'Danger Zone',
      badgeBg: 'oklch(0.3 0.09 90)',
      badgeColor: 'oklch(0.82 0.16 90)',
      flagged: true,
      bannerText: 'One more caution away from a suspension.',
      canCheckIn: true,
    };
  }
  return { badgeLabel: 'Available', badgeBg: null, badgeColor: null, flagged: false, canCheckIn: true };
}

app.get('/api/matches/:id/checkins', requireAuth, (req, res) => {
  const matchId = Number(req.params.id);
  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: 'Match id must be an integer.' });
  }

  const teamId = req.user.team_id;
  const players = db.prepare('SELECT * FROM players WHERE team_id = ? ORDER BY number ASC').all(teamId);
  const checkins = db
    .prepare('SELECT player_id, checked_in FROM match_checkins WHERE match_id = ?')
    .all(matchId);
  const checkedInByPlayerId = Object.fromEntries(
    checkins.map((c) => [c.player_id, !!c.checked_in])
  );

  res.json(
    players.map((p) => ({
      id: p.id,
      name: p.name,
      number: p.number,
      position: p.position,
      checkedIn: checkedInByPlayerId[p.id] ?? false,
      ...checkinBadge(p),
    }))
  );
});

app.post(
  '/api/matches/:id/checkins/:playerId',
  requireAuth,
  requireRole('coach_manager', 'league_director'),
  (req, res) => {
  const matchId = Number(req.params.id);
  const playerId = Number(req.params.playerId);
  if (!Number.isInteger(matchId) || !Number.isInteger(playerId)) {
    return res.status(400).json({ error: 'Match id and player id must be integers.' });
  }

  const player = db.prepare('SELECT * FROM players WHERE id = ?').get(playerId);
  if (!player) {
    return res.status(404).json({ error: 'Player not found.' });
  }
  if (!ownsOrOverrides(req, player.team_id)) {
    return res.status(403).json({ error: 'You can only check in players on your own team.' });
  }

  const existing = db
    .prepare('SELECT * FROM match_checkins WHERE match_id = ? AND player_id = ?')
    .get(matchId, playerId);
  const nextValue = existing ? (existing.checked_in ? 0 : 1) : 1;

  db.prepare(
    `INSERT INTO match_checkins (match_id, player_id, checked_in) VALUES (?, ?, ?)
     ON CONFLICT (match_id, player_id) DO UPDATE SET checked_in = excluded.checked_in`
  ).run(matchId, playerId, nextValue);

  res.json({ playerId, checkedIn: !!nextValue });
  }
);

app.get('/api/matches/:id/pitch-sheet', requireAuth, (req, res) => {
  const matchId = Number(req.params.id);
  if (!Number.isInteger(matchId)) {
    return res.status(400).json({ error: 'Match id must be an integer.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }

  const teamId = req.user.team_id;
  if (match.home_team_id !== teamId && match.away_team_id !== teamId) {
    return res.status(403).json({ error: 'Your team is not part of this match.' });
  }

  const lineupRows = db
    .prepare(
      `SELECT ml.*, p.name AS player_name
       FROM match_lineups ml
       JOIN players p ON p.id = ml.player_id
       WHERE ml.match_id = ? AND ml.team_id = ?
       ORDER BY ml.is_starting DESC, ml.num ASC`
    )
    .all(matchId, teamId);

  const checkins = db
    .prepare('SELECT player_id, checked_in FROM match_checkins WHERE match_id = ?')
    .all(matchId);
  const checkedInByPlayerId = Object.fromEntries(
    checkins.map((c) => [c.player_id, !!c.checked_in])
  );

  const toRow = (row) => ({
    playerId: row.player_id,
    num: row.num,
    name: row.player_name,
    pos: row.pos,
    verified: checkedInByPlayerId[row.player_id] ?? false,
  });

  res.json({
    starters: lineupRows.filter((r) => r.is_starting).map(toRow),
    substitutes: lineupRows.filter((r) => !r.is_starting).map(toRow),
  });
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

app.post(
  '/api/matches/:id/referees/:refId',
  requireAuth,
  requireRole('coach_manager', 'league_director'),
  (req, res) => {
  const matchId = Number(req.params.id);
  const refId = Number(req.params.refId);
  if (!Number.isInteger(matchId) || !Number.isInteger(refId)) {
    return res.status(400).json({ error: 'Match id and referee id must be integers.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  if (!ownsOrOverrides(req, match.home_team_id) && !ownsOrOverrides(req, match.away_team_id)) {
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
  }
);

app.delete(
  '/api/matches/:id/referees/:refId',
  requireAuth,
  requireRole('coach_manager', 'league_director'),
  (req, res) => {
  const matchId = Number(req.params.id);
  const refId = Number(req.params.refId);
  if (!Number.isInteger(matchId) || !Number.isInteger(refId)) {
    return res.status(400).json({ error: 'Match id and referee id must be integers.' });
  }

  const match = db.prepare('SELECT * FROM matches WHERE id = ?').get(matchId);
  if (!match) {
    return res.status(404).json({ error: 'Match not found.' });
  }
  if (!ownsOrOverrides(req, match.home_team_id) && !ownsOrOverrides(req, match.away_team_id)) {
    return res.status(403).json({ error: 'Your team is not part of this match.' });
  }

  db.prepare('DELETE FROM match_referees WHERE match_id = ? AND referee_id = ?').run(
    matchId,
    refId
  );
  res.status(204).end();
  }
);

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

app.post('/api/friendly-requests', requireAuth, requireRole('coach_manager'), (req, res) => {
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

app.post('/api/friendly-requests/:id/invite', requireAuth, requireRole('coach_manager'), (req, res) => {
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
         t.id, t.name, t.division, t.logo_url,
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

app.post('/api/matches/:id/result', requireAuth, requireRole('league_director'), (req, res) => {
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
