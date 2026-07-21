const db = require('./database.js');
const { recalculateTeamPoints } = require('./points.js');
const { hashPassword } = require('./auth.js');

const teams = [
  { name: 'Apex United FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Black Wolves FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'FC Mosaico', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Gugo FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Hikmah FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Inter Bushwick FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Marine FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Stuy FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Valor FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Vaux FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
  { name: 'Viper FC', borough: 'Brooklyn', division: 'brooklyn', points: 0 },
];

const insertTeam = db.prepare(
  'INSERT OR IGNORE INTO teams (name, borough, division, points) VALUES (?, ?, ?, ?)'
);

for (const team of teams) {
  insertTeam.run(team.name, team.borough, team.division, team.points);
}

console.log('Seeded teams table.');

function crestInitials(name) {
  const words = name.replace(/\bFC\b|\bSC\b/g, '').trim().split(/\s+/);
  return words
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function crestDataUri(name) {
  let hash = 0;
  for (const char of name) hash = (hash * 31 + char.charCodeAt(0)) & 0xffffffff;
  const hue = Math.abs(hash) % 360;
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="64" height="64">
    <circle cx="32" cy="32" r="32" fill="hsl(${hue} 55% 38%)" />
    <text x="32" y="32" font-family="sans-serif" font-weight="700" font-size="22"
      fill="#fff" text-anchor="middle" dominant-baseline="central">${crestInitials(name)}</text>
  </svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
}

const teamsMissingCrest = db
  .prepare('SELECT id, name FROM teams WHERE logo_url IS NULL')
  .all();

if (teamsMissingCrest.length > 0) {
  const updateCrest = db.prepare('UPDATE teams SET logo_url = ? WHERE id = ?');
  for (const team of teamsMissingCrest) {
    updateCrest.run(crestDataUri(team.name), team.id);
  }
  console.log(`Generated placeholder crests for ${teamsMissingCrest.length} team(s).`);
}

const teamIdByName = Object.fromEntries(
  db
    .prepare('SELECT id, name FROM teams')
    .all()
    .map((row) => [row.name, row.id])
);

// Real 26-27 Brooklyn Division schedule (scraped from LeagueLobster) — 22 rounds,
// 110 fixtures, all unplayed. No rosters exist yet for these teams, so matches
// carry no lineups/events/clips/MOTM data until real results come in.
const brooklynMatches = [
  { home: 'Valor FC', away: 'Viper FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-08-22T12:00:00', round: 1 },
  { home: 'Vaux FC', away: 'Stuy FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-08-22T13:30:00', round: 1 },
  { home: 'Black Wolves FC', away: 'Apex United FC', venue: 'Highland Park', kickoffAt: '2026-08-22T14:00:00', round: 1 },
  { home: 'Inter Bushwick FC', away: 'Hikmah FC', venue: 'Mafera Park', kickoffAt: '2026-08-22T14:00:00', round: 1 },
  { home: 'Marine FC', away: 'Gugo FC', venue: 'Bill Brown Playground', kickoffAt: '2026-08-22T14:00:00', round: 1 },
  { home: 'Apex United FC', away: 'Valor FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-09-05T12:00:00', round: 2 },
  { home: 'Gugo FC', away: 'Vaux FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-09-05T14:00:00', round: 2 },
  { home: 'Marine FC', away: 'Inter Bushwick FC', venue: 'Bill Brown Playground', kickoffAt: '2026-09-05T14:00:00', round: 2 },
  { home: 'Stuy FC', away: 'FC Mosaico', venue: 'Caton Parade Grounds', kickoffAt: '2026-09-05T15:30:00', round: 2 },
  { home: 'Hikmah FC', away: 'Black Wolves FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-09-06T14:00:00', round: 2 },
  { home: 'Valor FC', away: 'Hikmah FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-09-12T12:00:00', round: 3 },
  { home: 'FC Mosaico', away: 'Gugo FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-09-12T13:30:00', round: 3 },
  { home: 'Black Wolves FC', away: 'Marine FC', venue: 'Highland Park', kickoffAt: '2026-09-12T14:00:00', round: 3 },
  { home: 'Inter Bushwick FC', away: 'Vaux FC', venue: 'Mafera Park', kickoffAt: '2026-09-12T14:00:00', round: 3 },
  { home: 'Viper FC', away: 'Apex United FC', venue: 'Pal’s Oval', kickoffAt: '2026-09-12T14:00:00', round: 3 },
  { home: 'FC Mosaico', away: 'Inter Bushwick FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-09-26T12:00:00', round: 4 },
  { home: 'Vaux FC', away: 'Black Wolves FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-09-26T13:30:00', round: 4 },
  { home: 'Hikmah FC', away: 'Viper FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-09-26T14:00:00', round: 4 },
  { home: 'Marine FC', away: 'Valor FC', venue: 'Bill Brown Playground', kickoffAt: '2026-09-26T14:00:00', round: 4 },
  { home: 'Gugo FC', away: 'Stuy FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-09-26T15:30:00', round: 4 },
  { home: 'Apex United FC', away: 'Hikmah FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-10-10T12:00:00', round: 5 },
  { home: 'Valor FC', away: 'Vaux FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-10-10T13:30:00', round: 5 },
  { home: 'Black Wolves FC', away: 'FC Mosaico', venue: 'Highland Park', kickoffAt: '2026-10-10T14:00:00', round: 5 },
  { home: 'Inter Bushwick FC', away: 'Stuy FC', venue: 'Mafera Park', kickoffAt: '2026-10-10T14:00:00', round: 5 },
  { home: 'Viper FC', away: 'Marine FC', venue: 'Pal’s Oval', kickoffAt: '2026-10-10T14:00:00', round: 5 },
  { home: 'FC Mosaico', away: 'Valor FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-10-17T12:00:00', round: 6 },
  { home: 'Vaux FC', away: 'Viper FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-10-17T13:30:00', round: 6 },
  { home: 'Stuy FC', away: 'Black Wolves FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-10-17T14:00:00', round: 6 },
  { home: 'Marine FC', away: 'Apex United FC', venue: 'Bill Brown Playground', kickoffAt: '2026-10-17T14:00:00', round: 6 },
  { home: 'Gugo FC', away: 'Inter Bushwick FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-10-17T15:30:00', round: 6 },
  { home: 'Valor FC', away: 'Stuy FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-10-31T12:00:00', round: 7 },
  { home: 'Apex United FC', away: 'Vaux FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-10-31T13:30:00', round: 7 },
  { home: 'Hikmah FC', away: 'Marine FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-10-31T14:00:00', round: 7 },
  { home: 'Black Wolves FC', away: 'Gugo FC', venue: 'Highland Park', kickoffAt: '2026-10-31T14:00:00', round: 7 },
  { home: 'Viper FC', away: 'FC Mosaico', venue: 'Pal’s Oval', kickoffAt: '2026-10-31T14:00:00', round: 7 },
  { home: 'Vaux FC', away: 'Hikmah FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-11-14T12:00:00', round: 8 },
  { home: 'FC Mosaico', away: 'Apex United FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-11-14T13:30:00', round: 8 },
  { home: 'Stuy FC', away: 'Viper FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-11-14T14:00:00', round: 8 },
  { home: 'Inter Bushwick FC', away: 'Black Wolves FC', venue: 'Mafera Park', kickoffAt: '2026-11-14T14:00:00', round: 8 },
  { home: 'Gugo FC', away: 'Valor FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-11-14T15:30:00', round: 8 },
  { home: 'Valor FC', away: 'Inter Bushwick FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-12-05T12:00:00', round: 9 },
  { home: 'Apex United FC', away: 'Stuy FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-12-05T13:30:00', round: 9 },
  { home: 'Hikmah FC', away: 'FC Mosaico', venue: 'Caton Parade Grounds', kickoffAt: '2026-12-05T14:00:00', round: 9 },
  { home: 'Marine FC', away: 'Vaux FC', venue: 'Bill Brown Playground', kickoffAt: '2026-12-05T14:00:00', round: 9 },
  { home: 'Viper FC', away: 'Gugo FC', venue: 'Pal’s Oval', kickoffAt: '2026-12-05T14:00:00', round: 9 },
  { home: 'FC Mosaico', away: 'Marine FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-12-12T12:00:00', round: 10 },
  { home: 'Stuy FC', away: 'Hikmah FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-12-12T14:00:00', round: 10 },
  { home: 'Black Wolves FC', away: 'Valor FC', venue: 'Highland Park', kickoffAt: '2026-12-12T14:00:00', round: 10 },
  { home: 'Inter Bushwick FC', away: 'Viper FC', venue: 'Mafera Park', kickoffAt: '2026-12-12T14:00:00', round: 10 },
  { home: 'Gugo FC', away: 'Apex United FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-12-12T15:30:00', round: 10 },
  { home: 'Apex United FC', away: 'Inter Bushwick FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-12-19T12:00:00', round: 11 },
  { home: 'Vaux FC', away: 'FC Mosaico', venue: 'Calvert Vaux Park', kickoffAt: '2026-12-19T13:30:00', round: 11 },
  { home: 'Hikmah FC', away: 'Gugo FC', venue: 'Caton Parade Grounds', kickoffAt: '2026-12-19T14:00:00', round: 11 },
  { home: 'Marine FC', away: 'Stuy FC', venue: 'Bill Brown Playground', kickoffAt: '2026-12-19T14:00:00', round: 11 },
  { home: 'Viper FC', away: 'Black Wolves FC', venue: 'Pal’s Oval', kickoffAt: '2026-12-19T14:00:00', round: 11 },
  { home: 'Apex United FC', away: 'Black Wolves FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-03-06T12:00:00', round: 12 },
  { home: 'Hikmah FC', away: 'Inter Bushwick FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-03-06T14:00:00', round: 12 },
  { home: 'Viper FC', away: 'Valor FC', venue: 'Pal’s Oval', kickoffAt: '2027-03-06T14:00:00', round: 12 },
  { home: 'Gugo FC', away: 'Marine FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-03-06T15:30:00', round: 12 },
  { home: 'Stuy FC', away: 'Vaux FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-03-07T14:00:00', round: 12 },
  { home: 'Valor FC', away: 'Apex United FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-03-20T12:00:00', round: 13 },
  { home: 'Vaux FC', away: 'Gugo FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-03-20T13:30:00', round: 13 },
  { home: 'Black Wolves FC', away: 'Hikmah FC', venue: 'Highland Park', kickoffAt: '2027-03-20T14:00:00', round: 13 },
  { home: 'Inter Bushwick FC', away: 'Marine FC', venue: 'Mafera Park', kickoffAt: '2027-03-20T14:00:00', round: 13 },
  { home: 'FC Mosaico', away: 'Stuy FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-03-20T15:00:00', round: 13 },
  { home: 'Apex United FC', away: 'Viper FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-03-27T12:00:00', round: 14 },
  { home: 'Vaux FC', away: 'Inter Bushwick FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-03-27T13:30:00', round: 14 },
  { home: 'Gugo FC', away: 'FC Mosaico', venue: 'Caton Parade Grounds', kickoffAt: '2027-03-27T14:00:00', round: 14 },
  { home: 'Marine FC', away: 'Black Wolves FC', venue: 'Bill Brown Playground', kickoffAt: '2027-03-27T14:00:00', round: 14 },
  { home: 'Hikmah FC', away: 'Valor FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-03-27T15:30:00', round: 14 },
  { home: 'Valor FC', away: 'Marine FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-04-10T12:00:00', round: 15 },
  { home: 'Stuy FC', away: 'Gugo FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-04-10T14:00:00', round: 15 },
  { home: 'Black Wolves FC', away: 'Vaux FC', venue: 'Highland Park', kickoffAt: '2027-04-10T14:00:00', round: 15 },
  { home: 'Inter Bushwick FC', away: 'FC Mosaico', venue: 'Mafera Park', kickoffAt: '2027-04-10T14:00:00', round: 15 },
  { home: 'Viper FC', away: 'Hikmah FC', venue: 'Pal’s Oval', kickoffAt: '2027-04-10T14:00:00', round: 15 },
  { home: 'FC Mosaico', away: 'Black Wolves FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-04-17T12:00:00', round: 16 },
  { home: 'Vaux FC', away: 'Valor FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-04-17T13:30:00', round: 16 },
  { home: 'Hikmah FC', away: 'Apex United FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-04-17T14:00:00', round: 16 },
  { home: 'Marine FC', away: 'Viper FC', venue: 'Bill Brown Playground', kickoffAt: '2027-04-17T14:00:00', round: 16 },
  { home: 'Stuy FC', away: 'Inter Bushwick FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-04-17T15:30:00', round: 16 },
  { home: 'Valor FC', away: 'FC Mosaico', venue: 'Calvert Vaux Park', kickoffAt: '2027-04-24T12:00:00', round: 17 },
  { home: 'Apex United FC', away: 'Marine FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-04-24T13:30:00', round: 17 },
  { home: 'Black Wolves FC', away: 'Stuy FC', venue: 'Highland Park', kickoffAt: '2027-04-24T14:00:00', round: 17 },
  { home: 'Inter Bushwick FC', away: 'Gugo FC', venue: 'Mafera Park', kickoffAt: '2027-04-24T14:00:00', round: 17 },
  { home: 'Viper FC', away: 'Vaux FC', venue: 'Pal’s Oval', kickoffAt: '2027-04-24T14:00:00', round: 17 },
  { home: 'Vaux FC', away: 'Apex United FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-01T12:00:00', round: 18 },
  { home: 'FC Mosaico', away: 'Viper FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-01T13:30:00', round: 18 },
  { home: 'Stuy FC', away: 'Valor FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-01T14:00:00', round: 18 },
  { home: 'Marine FC', away: 'Hikmah FC', venue: 'Bill Brown Playground', kickoffAt: '2027-05-01T14:00:00', round: 18 },
  { home: 'Gugo FC', away: 'Black Wolves FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-01T15:30:00', round: 18 },
  { home: 'Apex United FC', away: 'FC Mosaico', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-08T12:00:00', round: 19 },
  { home: 'Valor FC', away: 'Gugo FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-08T13:30:00', round: 19 },
  { home: 'Hikmah FC', away: 'Vaux FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-08T14:00:00', round: 19 },
  { home: 'Black Wolves FC', away: 'Inter Bushwick FC', venue: 'Highland Park', kickoffAt: '2027-05-08T14:00:00', round: 19 },
  { home: 'Viper FC', away: 'Stuy FC', venue: 'Pal’s Oval', kickoffAt: '2027-05-08T14:00:00', round: 19 },
  { home: 'FC Mosaico', away: 'Hikmah FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-15T12:00:00', round: 20 },
  { home: 'Vaux FC', away: 'Marine FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-15T13:30:00', round: 20 },
  { home: 'Stuy FC', away: 'Apex United FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-15T14:00:00', round: 20 },
  { home: 'Inter Bushwick FC', away: 'Valor FC', venue: 'Mafera Park', kickoffAt: '2027-05-15T14:00:00', round: 20 },
  { home: 'Gugo FC', away: 'Viper FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-15T15:30:00', round: 20 },
  { home: 'Valor FC', away: 'Black Wolves FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-22T12:00:00', round: 21 },
  { home: 'Apex United FC', away: 'Gugo FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-22T13:30:00', round: 21 },
  { home: 'Hikmah FC', away: 'Stuy FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-22T14:00:00', round: 21 },
  { home: 'Marine FC', away: 'FC Mosaico', venue: 'Bill Brown Playground', kickoffAt: '2027-05-22T14:00:00', round: 21 },
  { home: 'Viper FC', away: 'Inter Bushwick FC', venue: 'Pal’s Oval', kickoffAt: '2027-05-22T14:00:00', round: 21 },
  { home: 'FC Mosaico', away: 'Vaux FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-29T12:00:00', round: 22 },
  { home: 'Stuy FC', away: 'Marine FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-29T14:00:00', round: 22 },
  { home: 'Black Wolves FC', away: 'Viper FC', venue: 'Highland Park', kickoffAt: '2027-05-29T14:00:00', round: 22 },
  { home: 'Inter Bushwick FC', away: 'Apex United FC', venue: 'Mafera Park', kickoffAt: '2027-05-29T14:00:00', round: 22 },
  { home: 'Gugo FC', away: 'Hikmah FC', venue: 'Caton Parade Grounds', kickoffAt: '2027-05-29T15:30:00', round: 22 },
];

const matches = brooklynMatches.map((m) => ({
  home: m.home,
  away: m.away,
  homeScore: 0,
  awayScore: 0,
  status: 'upcoming',
  division: 'brooklyn',
  competition: 'Brooklyn Division',
  venue: m.venue,
  kickoffAt: m.kickoffAt,
}));

function matchKeyFor(match) {
  return `${teamIdByName[match.home]}|${teamIdByName[match.away]}|${match.kickoffAt}`;
}

const { count: matchCount } = db
  .prepare('SELECT COUNT(*) AS count FROM matches')
  .get();

if (matchCount === 0) {
  const insertMatch = db.prepare(
    `INSERT INTO matches
      (home_team_id, away_team_id, home_score, away_score, status, division, competition, venue, kickoff_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
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
      match.kickoffAt
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

function coachSlug(name) {
  return name.replace(/\bFC\b|\bSC\b/g, '').replace(/[^a-zA-Z]/g, '').toLowerCase();
}

const { count: userCount } = db.prepare('SELECT COUNT(*) AS count FROM users').get();

if (userCount === 0) {
  const insertUser = db.prepare(
    'INSERT INTO users (email, password_hash, team_id, role) VALUES (?, ?, ?, ?)'
  );

  for (const team of teams) {
    const email = `coach@${coachSlug(team.name)}.com`;
    insertUser.run(email, hashPassword('password123'), teamIdByName[team.name], 'coach');
  }

  console.log('Seeded users table.');
} else {
  console.log('Users table already has data, skipping.');
}

const referees = [
  { name: 'Marcus Alvarado', level: 'Grade 8', available: 1, pin: '1234' },
  { name: 'Diane Whitfield', level: 'Grade 7', available: 0, pin: '2345' },
  { name: 'Carlos Nguyen', level: 'Grade 8', available: 1, pin: '3456' },
  { name: 'Priya Osei', level: 'Grade 6', available: 0, pin: '4567' },
];

const { count: refereeCount } = db.prepare('SELECT COUNT(*) AS count FROM referees').get();

if (refereeCount === 0) {
  const insertReferee = db.prepare(
    'INSERT INTO referees (name, level, available, pin) VALUES (?, ?, ?, ?)'
  );

  for (const referee of referees) {
    insertReferee.run(referee.name, referee.level, referee.available, referee.pin);
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
  { team: 'Vaux FC', date: '2026-08-01', time: '11:00 AM', venue: 'Flushing Meadows–Corona Park' },
  { team: 'Marine FC', date: '2026-08-08', time: '9:00 AM', venue: "Randall's Island" },
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

const bulletins = [
  {
    title: 'Registration for the Fall season opens August 1st',
    body: 'Rosters lock two weeks before the first matchday — get your paperwork in early to avoid late fees.',
  },
  {
    title: 'Reminder: referee sign-off is mandatory for all Division matches',
    body: 'Match sheets submitted more than 48 hours after kickoff will not count toward standings.',
  },
];

const { count: bulletinCount } = db.prepare('SELECT COUNT(*) AS count FROM bulletins').get();

if (bulletinCount === 0) {
  const insertBulletin = db.prepare('INSERT INTO bulletins (title, body) VALUES (?, ?)');
  for (const bulletin of bulletins) {
    insertBulletin.run(bulletin.title, bulletin.body);
  }
  console.log('Seeded bulletins table.');
} else {
  console.log('Bulletins table already has data, skipping.');
}

for (const teamId of Object.values(teamIdByName)) {
  recalculateTeamPoints(teamId);
}

console.log('Backfilled team points from final matches.');
