const db = require('./database.js');
const { recalculateTeamPoints } = require('./points.js');
const { hashPassword } = require('./auth.js');

const teams = [
  { name: 'Brooklyn Kickers FC', borough: 'Brooklyn', division: 'queens', points: 0 },
  { name: 'Queens United SC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Manhattan Strikers FC', borough: 'Manhattan', division: 'bronx', points: 0 },
  { name: 'Bronx Rovers FC', borough: 'Bronx', division: 'bronx', points: 0 },
];

const insertTeam = db.prepare(
  'INSERT OR IGNORE INTO teams (name, borough, division, points) VALUES (?, ?, ?, ?)'
);

for (const team of teams) {
  insertTeam.run(team.name, team.borough, team.division, team.points);
}

console.log('Seeded teams table.');

const teamIdByName = Object.fromEntries(
  db
    .prepare('SELECT id, name FROM teams')
    .all()
    .map((row) => [row.name, row.id])
);

const playersByTeam = {
  'Brooklyn Kickers FC': [
    { name: 'Marcus Reyes', position: 'MF', number: 10, goals: 9, assists: 4, apps: 14, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 84 },
    { name: 'Jalen Osei', position: 'FW', number: 9, goals: 3, assists: 7, apps: 13, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 78 },
    { name: 'Devon Clarke', position: 'DF', number: 4, goals: 0, assists: 1, apps: 14, yellow_cards: 3, red_cards: 0, clean_sheets: 0, rating: 72 },
    { name: 'Elijah Ward', position: 'GK', number: 1, goals: 0, assists: 0, apps: 14, yellow_cards: 0, red_cards: 0, clean_sheets: 7, rating: 75 },
    { name: 'Sam Rutherford', position: 'DF', number: 2, goals: 0, assists: 1, apps: 12, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 68 },
    { name: 'Miguel Torres', position: 'DF', number: 3, goals: 1, assists: 0, apps: 13, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 70 },
    { name: 'Andre Blake', position: 'DF', number: 5, goals: 0, assists: 0, apps: 10, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 66 },
    { name: 'Chris Duval', position: 'MF', number: 6, goals: 2, assists: 3, apps: 13, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 74 },
    { name: 'Noah Kim', position: 'MF', number: 8, goals: 1, assists: 2, apps: 11, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 69 },
    { name: 'Leo Faison', position: 'FW', number: 7, goals: 4, assists: 1, apps: 12, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 73 },
    { name: 'Adrian Souza', position: 'FW', number: 11, goals: 2, assists: 1, apps: 9, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 67 },
  ],
  'Queens United SC': [
    { name: 'Ravi Patel', position: 'MF', number: 8, goals: 6, assists: 5, apps: 14, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 80 },
    { name: 'Yusuf Demir', position: 'FW', number: 11, goals: 11, assists: 2, apps: 14, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 87 },
    { name: 'Ethan Wong', position: 'DF', number: 5, goals: 1, assists: 0, apps: 12, yellow_cards: 4, red_cards: 1, clean_sheets: 0, rating: 71 },
    { name: 'Victor Alden', position: 'GK', number: 1, goals: 0, assists: 0, apps: 14, yellow_cards: 0, red_cards: 0, clean_sheets: 5, rating: 74 },
    { name: 'Omar Siddiqui', position: 'DF', number: 2, goals: 0, assists: 1, apps: 13, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 69 },
    { name: 'Derek Lin', position: 'DF', number: 3, goals: 1, assists: 0, apps: 12, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 68 },
    { name: 'Pavel Novak', position: 'DF', number: 4, goals: 0, assists: 0, apps: 11, yellow_cards: 3, red_cards: 0, clean_sheets: 0, rating: 65 },
    { name: 'Julian Cho', position: 'MF', number: 6, goals: 2, assists: 4, apps: 14, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 77 },
    { name: 'Marco Silva', position: 'MF', number: 10, goals: 3, assists: 2, apps: 13, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 76 },
    { name: 'Tomas Reyes', position: 'FW', number: 7, goals: 5, assists: 2, apps: 13, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 78 },
    { name: 'Kwame Asante', position: 'FW', number: 9, goals: 3, assists: 1, apps: 10, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 71 },
  ],
  'Manhattan Strikers FC': [
    { name: 'Diego Fernandez', position: 'FW', number: 7, goals: 8, assists: 3, apps: 13, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 82 },
    { name: 'Malik Johnson', position: 'MF', number: 6, goals: 2, assists: 6, apps: 14, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 79 },
    { name: 'Owen Sullivan', position: 'GK', number: 1, goals: 0, assists: 2, apps: 14, yellow_cards: 0, red_cards: 0, clean_sheets: 6, rating: 76 },
    { name: 'Hassan Idris', position: 'DF', number: 2, goals: 0, assists: 1, apps: 13, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 70 },
    { name: 'Ben Whitfield', position: 'DF', number: 3, goals: 1, assists: 0, apps: 12, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 68 },
    { name: 'Luca Moretti', position: 'DF', number: 4, goals: 0, assists: 0, apps: 14, yellow_cards: 3, red_cards: 1, clean_sheets: 0, rating: 67 },
    { name: 'Andre Kowalski', position: 'DF', number: 5, goals: 0, assists: 1, apps: 11, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 66 },
    { name: 'Isaac Novak', position: 'MF', number: 8, goals: 2, assists: 3, apps: 13, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 75 },
    { name: 'Theo Marsh', position: 'MF', number: 10, goals: 1, assists: 4, apps: 12, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 74 },
    { name: 'Rafael Costa', position: 'FW', number: 9, goals: 6, assists: 2, apps: 14, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 80 },
    { name: 'Deshawn Miller', position: 'FW', number: 11, goals: 3, assists: 1, apps: 10, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 72 },
  ],
  'Bronx Rovers FC': [
    { name: 'Carlos Mendoza', position: 'FW', number: 9, goals: 7, assists: 1, apps: 13, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 81 },
    { name: 'Tyrell Brooks', position: 'MF', number: 10, goals: 4, assists: 8, apps: 14, yellow_cards: 3, red_cards: 0, clean_sheets: 0, rating: 83 },
    { name: 'Nico Russo', position: 'DF', number: 3, goals: 1, assists: 0, apps: 12, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 70 },
    { name: 'Patrick Doyle', position: 'GK', number: 1, goals: 0, assists: 0, apps: 13, yellow_cards: 0, red_cards: 0, clean_sheets: 4, rating: 73 },
    { name: 'Emeka Obi', position: 'DF', number: 2, goals: 0, assists: 0, apps: 12, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 67 },
    { name: 'Sean Farrell', position: 'DF', number: 4, goals: 1, assists: 0, apps: 13, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 69 },
    { name: 'Jorge Aguilar', position: 'DF', number: 5, goals: 0, assists: 1, apps: 11, yellow_cards: 2, red_cards: 0, clean_sheets: 0, rating: 66 },
    { name: 'Wesley Chan', position: 'MF', number: 6, goals: 2, assists: 2, apps: 13, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 73 },
    { name: 'Nate Fitzgerald', position: 'MF', number: 8, goals: 1, assists: 3, apps: 12, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 72 },
    { name: 'Bryan Cole', position: 'FW', number: 7, goals: 4, assists: 1, apps: 11, yellow_cards: 1, red_cards: 0, clean_sheets: 0, rating: 75 },
    { name: 'Ismael Diallo', position: 'FW', number: 11, goals: 2, assists: 0, apps: 9, yellow_cards: 0, red_cards: 0, clean_sheets: 0, rating: 68 },
  ],
};

const { count: playerCount } = db
  .prepare('SELECT COUNT(*) AS count FROM players')
  .get();

if (playerCount === 0) {
  const insertPlayer = db.prepare(
    `INSERT INTO players
      (name, team_id, goals, assists, position, number, apps, yellow_cards, red_cards, clean_sheets, rating)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const [teamName, players] of Object.entries(playersByTeam)) {
    const teamId = teamIdByName[teamName];
    for (const player of players) {
      insertPlayer.run(
        player.name,
        teamId,
        player.goals,
        player.assists,
        player.position,
        player.number,
        player.apps,
        player.yellow_cards,
        player.red_cards,
        player.clean_sheets,
        player.rating
      );
    }
  }

  console.log('Seeded players table.');
} else {
  console.log('Players table already has data, skipping.');
}

const playerIdByName = Object.fromEntries(
  db
    .prepare('SELECT id, name FROM players')
    .all()
    .map((row) => [row.name, row.id])
);

// Starting XIs reused across matches for the same team (no substitutes modeled yet).
const brooklynXI = [
  { name: 'Elijah Ward', number: 1, pos: 'GK' },
  { name: 'Sam Rutherford', number: 2, pos: 'DF' },
  { name: 'Miguel Torres', number: 3, pos: 'DF' },
  { name: 'Devon Clarke', number: 4, pos: 'DF' },
  { name: 'Andre Blake', number: 5, pos: 'DF' },
  { name: 'Chris Duval', number: 6, pos: 'MF' },
  { name: 'Leo Faison', number: 7, pos: 'FW' },
  { name: 'Noah Kim', number: 8, pos: 'MF' },
  { name: 'Jalen Osei', number: 9, pos: 'FW' },
  { name: 'Marcus Reyes', number: 10, pos: 'MF' },
  { name: 'Adrian Souza', number: 11, pos: 'FW' },
];
const queensXI = [
  { name: 'Victor Alden', number: 1, pos: 'GK' },
  { name: 'Omar Siddiqui', number: 2, pos: 'DF' },
  { name: 'Derek Lin', number: 3, pos: 'DF' },
  { name: 'Pavel Novak', number: 4, pos: 'DF' },
  { name: 'Ethan Wong', number: 5, pos: 'DF' },
  { name: 'Julian Cho', number: 6, pos: 'MF' },
  { name: 'Tomas Reyes', number: 7, pos: 'FW' },
  { name: 'Ravi Patel', number: 8, pos: 'MF' },
  { name: 'Kwame Asante', number: 9, pos: 'FW' },
  { name: 'Marco Silva', number: 10, pos: 'MF' },
  { name: 'Yusuf Demir', number: 11, pos: 'FW' },
];
const manhattanXI = [
  { name: 'Owen Sullivan', number: 1, pos: 'GK' },
  { name: 'Hassan Idris', number: 2, pos: 'DF' },
  { name: 'Ben Whitfield', number: 3, pos: 'DF' },
  { name: 'Luca Moretti', number: 4, pos: 'DF' },
  { name: 'Andre Kowalski', number: 5, pos: 'DF' },
  { name: 'Malik Johnson', number: 6, pos: 'MF' },
  { name: 'Diego Fernandez', number: 7, pos: 'FW' },
  { name: 'Isaac Novak', number: 8, pos: 'MF' },
  { name: 'Rafael Costa', number: 9, pos: 'FW' },
  { name: 'Theo Marsh', number: 10, pos: 'MF' },
  { name: 'Deshawn Miller', number: 11, pos: 'FW' },
];
const bronxXI = [
  { name: 'Patrick Doyle', number: 1, pos: 'GK' },
  { name: 'Emeka Obi', number: 2, pos: 'DF' },
  { name: 'Nico Russo', number: 3, pos: 'DF' },
  { name: 'Sean Farrell', number: 4, pos: 'DF' },
  { name: 'Jorge Aguilar', number: 5, pos: 'DF' },
  { name: 'Wesley Chan', number: 6, pos: 'MF' },
  { name: 'Bryan Cole', number: 7, pos: 'FW' },
  { name: 'Nate Fitzgerald', number: 8, pos: 'MF' },
  { name: 'Carlos Mendoza', number: 9, pos: 'FW' },
  { name: 'Tyrell Brooks', number: 10, pos: 'MF' },
  { name: 'Ismael Diallo', number: 11, pos: 'FW' },
];

const matches = [
  {
    home: 'Brooklyn Kickers FC',
    away: 'Queens United SC',
    homeScore: 3,
    awayScore: 1,
    status: 'ft',
    division: 'queens',
    competition: 'Queens Division',
    venue: 'Prospect Park Field 3',
    kickoffAt: '2026-07-13T15:00:00',
    homeFormation: '4-3-3',
    awayFormation: '4-3-3',
    lineup: { home: brooklynXI, away: queensXI },
    events: [
      { minute: 8, type: 'goal', side: 'home', player: 'Marcus Reyes', detail: 'Low finish from the edge of the box.' },
      { minute: 23, type: 'yellow', side: 'away', player: 'Ethan Wong', detail: 'Booked for a professional foul.' },
      { minute: 37, type: 'goal', side: 'away', player: 'Yusuf Demir', detail: 'Driven strike from 18 yards.' },
      { minute: 55, type: 'goal', side: 'home', player: 'Jalen Osei', detail: 'Tap-in from a rebound.' },
      { minute: 78, type: 'goal', side: 'home', player: 'Marcus Reyes', detail: 'Second of the night — curled effort into the top corner.' },
      { minute: 84, type: 'yellow', side: 'home', player: 'Devon Clarke', detail: 'Booked for time-wasting.' },
    ],
    clips: [
      { minute: 8, title: 'Reyes opens the scoring', views: 1200, tag: 'GOAL', side: 'home' },
      { minute: 78, title: 'Reyes doubles the lead', views: 1600, tag: 'GOAL', side: 'home' },
    ],
    motm: [
      { player: 'Marcus Reyes', blurb: '2 goals' },
      { player: 'Jalen Osei', blurb: '1 goal' },
      { player: 'Yusuf Demir', blurb: '1 goal' },
      { player: 'Devon Clarke', blurb: 'Defensive lock-down, 1 booking' },
    ],
  },
  {
    home: 'Manhattan Strikers FC',
    away: 'Bronx Rovers FC',
    homeScore: 2,
    awayScore: 2,
    status: 'ft',
    division: 'bronx',
    competition: 'Bronx Division',
    venue: 'Van Cortlandt Park Field 1',
    kickoffAt: '2026-07-13T17:00:00',
    homeFormation: '4-3-3',
    awayFormation: '4-3-3',
    lineup: { home: manhattanXI, away: bronxXI },
    events: [
      { minute: 15, type: 'goal', side: 'home', player: 'Diego Fernandez', detail: 'Volleyed home from a corner.' },
      { minute: 29, type: 'goal', side: 'away', player: 'Carlos Mendoza', detail: 'Composed finish after a quick counter.' },
      { minute: 61, type: 'goal', side: 'home', player: 'Malik Johnson', detail: 'Long-range effort into the bottom corner.' },
      { minute: 73, type: 'yellow', side: 'away', player: 'Tyrell Brooks', detail: 'Booked for a late tackle.' },
      { minute: 88, type: 'goal', side: 'away', player: 'Carlos Mendoza', detail: 'Equalizer — second of the match, header from a corner.' },
    ],
    clips: [
      { minute: 88, title: "Mendoza's late equalizer", views: 690, tag: 'GOAL', side: 'away' },
    ],
    motm: [
      { player: 'Carlos Mendoza', blurb: '2 goals' },
      { player: 'Diego Fernandez', blurb: '1 goal' },
      { player: 'Malik Johnson', blurb: '1 goal, long range' },
      { player: 'Owen Sullivan', blurb: 'Goalkeeper, key saves throughout' },
    ],
  },
  {
    home: 'Queens United SC',
    away: 'Manhattan Strikers FC',
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming',
    division: 'cross',
    competition: 'Interborough Friendly',
    venue: 'Astoria Park Field 2',
    kickoffAt: '2026-07-27T10:00:00',
  },
  {
    home: 'Bronx Rovers FC',
    away: 'Brooklyn Kickers FC',
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming',
    division: 'cross',
    competition: 'Interborough Friendly',
    venue: 'Pelham Bay Park Field 2',
    kickoffAt: '2026-07-27T12:30:00',
  },
  {
    home: 'Queens United SC',
    away: 'Brooklyn Kickers FC',
    homeScore: 1,
    awayScore: 1,
    status: 'live',
    division: 'queens',
    competition: 'Queens Division',
    venue: 'Flushing Meadows Pitch B',
    kickoffAt: '2026-07-20T16:00:00',
    homeFormation: '4-3-3',
    awayFormation: '4-3-3',
    lineup: { home: queensXI, away: brooklynXI },
    events: [
      { minute: 19, type: 'goal', side: 'home', player: 'Yusuf Demir', detail: 'First-time finish from a through ball.' },
      { minute: 44, type: 'goal', side: 'away', player: 'Marcus Reyes', detail: 'Equalizer just before half-time — a curling free kick.' },
    ],
  },
];

function matchKeyFor(match) {
  return `${teamIdByName[match.home]}|${teamIdByName[match.away]}|${match.kickoffAt}`;
}

const { count: matchCount } = db
  .prepare('SELECT COUNT(*) AS count FROM matches')
  .get();

if (matchCount === 0) {
  const insertMatch = db.prepare(
    `INSERT INTO matches
      (home_team_id, away_team_id, home_score, away_score, status, division, competition, venue, kickoff_at, home_formation, away_formation)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
  );

  for (const match of matches) {
    insertMatch.run(
      teamIdByName[match.home],
      teamIdByName[match.away],
      match.homeScore,
      match.awayScore,
      match.status,
      match.division,
      match.competition,
      match.venue,
      match.kickoffAt,
      match.homeFormation ?? null,
      match.awayFormation ?? null
    );
  }

  console.log('Seeded matches table.');
} else {
  console.log('Matches table already has data, skipping.');
}

const matchIdByKey = {};
for (const row of db
  .prepare('SELECT id, home_team_id, away_team_id, kickoff_at FROM matches')
  .all()) {
  matchIdByKey[`${row.home_team_id}|${row.away_team_id}|${row.kickoff_at}`] = row.id;
}

const { count: eventCount } = db
  .prepare('SELECT COUNT(*) AS count FROM match_events')
  .get();

if (eventCount === 0) {
  const insertEvent = db.prepare(
    `INSERT INTO match_events (match_id, minute, type, team_id, player_name, detail)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const match of matches) {
    if (!match.events) continue;
    const matchId = matchIdByKey[matchKeyFor(match)];
    for (const ev of match.events) {
      const teamId = ev.side === 'home' ? teamIdByName[match.home] : teamIdByName[match.away];
      insertEvent.run(matchId, ev.minute, ev.type, teamId, ev.player, ev.detail);
    }
  }

  console.log('Seeded match_events table.');
} else {
  console.log('match_events table already has data, skipping.');
}

const { count: lineupCount } = db
  .prepare('SELECT COUNT(*) AS count FROM match_lineups')
  .get();

if (lineupCount === 0) {
  const insertLineup = db.prepare(
    `INSERT INTO match_lineups (match_id, team_id, player_id, num, pos, is_starting)
     VALUES (?, ?, ?, ?, ?, 1)`
  );

  for (const match of matches) {
    if (!match.lineup) continue;
    const matchId = matchIdByKey[matchKeyFor(match)];
    const homeTeamId = teamIdByName[match.home];
    const awayTeamId = teamIdByName[match.away];

    for (const p of match.lineup.home) {
      insertLineup.run(matchId, homeTeamId, playerIdByName[p.name], p.number, p.pos);
    }
    for (const p of match.lineup.away) {
      insertLineup.run(matchId, awayTeamId, playerIdByName[p.name], p.number, p.pos);
    }
  }

  console.log('Seeded match_lineups table.');
} else {
  console.log('match_lineups table already has data, skipping.');
}

const { count: clipCount } = db
  .prepare('SELECT COUNT(*) AS count FROM match_clips')
  .get();

if (clipCount === 0) {
  const insertClip = db.prepare(
    `INSERT INTO match_clips (match_id, minute, title, views_count, tag, team_id)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const match of matches) {
    if (!match.clips) continue;
    const matchId = matchIdByKey[matchKeyFor(match)];
    for (const clip of match.clips) {
      const teamId = clip.side === 'home' ? teamIdByName[match.home] : teamIdByName[match.away];
      insertClip.run(matchId, clip.minute, clip.title, clip.views, clip.tag, teamId);
    }
  }

  console.log('Seeded match_clips table.');
} else {
  console.log('match_clips table already has data, skipping.');
}

const { count: motmCount } = db
  .prepare('SELECT COUNT(*) AS count FROM motm_candidates')
  .get();

if (motmCount === 0) {
  const insertMotm = db.prepare(
    `INSERT INTO motm_candidates (match_id, player_id, blurb, votes)
     VALUES (?, ?, ?, 0)`
  );

  for (const match of matches) {
    if (!match.motm) continue;
    const matchId = matchIdByKey[matchKeyFor(match)];
    for (const cand of match.motm) {
      insertMotm.run(matchId, playerIdByName[cand.player], cand.blurb);
    }
  }

  console.log('Seeded motm_candidates table.');
} else {
  console.log('motm_candidates table already has data, skipping.');
}

const coachesByTeam = {
  'Brooklyn Kickers FC': { email: 'coach@brooklynkickers.com', password: 'password123' },
  'Queens United SC': { email: 'coach@queensunited.com', password: 'password123' },
  'Manhattan Strikers FC': { email: 'coach@manhattanstrikers.com', password: 'password123' },
  'Bronx Rovers FC': { email: 'coach@bronxrovers.com', password: 'password123' },
};

const { count: userCount } = db.prepare('SELECT COUNT(*) AS count FROM users').get();

if (userCount === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, team_id, role) VALUES (?, ?, ?, ?)'
  );

  for (const [teamName, coach] of Object.entries(coachesByTeam)) {
    insertUser.run(coach.email, hashPassword(coach.password), teamIdByName[teamName], 'coach');
  }

  console.log('Seeded users table.');
} else {
  console.log('Users table already has data, skipping.');
}

const referees = [
  { name: 'Marcus Alvarado', level: 'Grade 8', available: 1 },
  { name: 'Diane Whitfield', level: 'Grade 7', available: 0 },
  { name: 'Carlos Nguyen', level: 'Grade 8', available: 1 },
  { name: 'Priya Osei', level: 'Grade 6', available: 0 },
];

const { count: refereeCount } = db.prepare('SELECT COUNT(*) AS count FROM referees').get();

if (refereeCount === 0) {
  const insertReferee = db.prepare(
    'INSERT INTO referees (name, level, available) VALUES (?, ?, ?)'
  );

  for (const referee of referees) {
    insertReferee.run(referee.name, referee.level, referee.available);
  }

  console.log('Seeded referees table.');
} else {
  console.log('Referees table already has data, skipping.');
}

const venues = [
  {
    name: 'Flushing Meadows–Corona Park',
    borough: 'Queens',
    photo: null,
    fields: [
      { name: 'Field 1', surface: 'Turf', note: 'Floodlit, next to the Unisphere' },
      { name: 'Field 2', surface: 'Grass', note: 'South end near the tennis courts — softer after rain' },
    ],
    parking: 'Meadow Lake lot off Meridian Rd — free, fills by 9am on Saturdays.',
    cleats: 'Turf trainers for Field 1; molded studs for Field 2.',
  },
  {
    name: "Randall's Island",
    borough: 'Manhattan',
    photo: null,
    fields: [
      { name: 'Field 1', surface: 'Turf', note: 'Icahn Stadium fields, under the Hell Gate Bridge' },
    ],
    parking: "Randall's Island lot via the RFK Bridge — metered.",
    cleats: 'Turf trainers recommended.',
  },
  {
    name: 'Harris Park',
    borough: 'Queens',
    photo: null,
    fields: [
      { name: 'Field 1', surface: 'Grass', note: 'Open lawn, shared with other pickup games' },
    ],
    parking: 'Street parking along the park perimeter.',
    cleats: 'Firm-ground studs — can get soft after rain.',
  },
];

const { count: venueCount } = db.prepare('SELECT COUNT(*) AS count FROM venues').get();

if (venueCount === 0) {
  const insertVenue = db.prepare(
    `INSERT INTO venues (name, borough, photo, fields_json, parking, cleats)
     VALUES (?, ?, ?, ?, ?, ?)`
  );

  for (const venue of venues) {
    insertVenue.run(
      venue.name,
      venue.borough,
      venue.photo,
      JSON.stringify(venue.fields),
      venue.parking,
      venue.cleats
    );
  }

  console.log('Seeded venues table.');
} else {
  console.log('Venues table already has data, skipping.');
}

const venueIdByName = Object.fromEntries(
  db
    .prepare('SELECT id, name FROM venues')
    .all()
    .map((row) => [row.name, row.id])
);

const friendlyRequests = [
  { team: 'Manhattan Strikers FC', date: '2026-08-01', time: '11:00 AM', venue: 'Flushing Meadows–Corona Park' },
  { team: 'Bronx Rovers FC', date: '2026-08-08', time: '9:00 AM', venue: "Randall's Island" },
];

const { count: friendlyRequestCount } = db
  .prepare('SELECT COUNT(*) AS count FROM friendly_requests')
  .get();

if (friendlyRequestCount === 0) {
  const insertRequest = db.prepare(
    'INSERT INTO friendly_requests (team_id, date, time, venue_id) VALUES (?, ?, ?, ?)'
  );

  for (const request of friendlyRequests) {
    insertRequest.run(
      teamIdByName[request.team],
      request.date,
      request.time,
      venueIdByName[request.venue]
    );
  }

  console.log('Seeded friendly_requests table.');
} else {
  console.log('friendly_requests table already has data, skipping.');
}

for (const teamId of Object.values(teamIdByName)) {
  recalculateTeamPoints(teamId);
}

console.log('Backfilled team points from final matches.');
