const db = require('./database.js');
const { recalculateTeamPoints } = require('./points.js');

const teams = [
  { name: 'Brooklyn Kickers FC', borough: 'Brooklyn', points: 0 },
  { name: 'Queens United SC', borough: 'Queens', points: 0 },
  { name: 'Manhattan Strikers FC', borough: 'Manhattan', points: 0 },
  { name: 'Bronx Rovers FC', borough: 'Bronx', points: 0 },
];

const insertTeam = db.prepare(
  'INSERT OR IGNORE INTO teams (name, borough, points) VALUES (?, ?, ?)'
);

for (const team of teams) {
  insertTeam.run(team.name, team.borough, team.points);
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
    { name: 'Marcus Reyes', goals: 9, assists: 4 },
    { name: 'Jalen Osei', goals: 3, assists: 7 },
    { name: 'Devon Clarke', goals: 0, assists: 1 },
  ],
  'Queens United SC': [
    { name: 'Ravi Patel', goals: 6, assists: 5 },
    { name: 'Yusuf Demir', goals: 11, assists: 2 },
    { name: 'Ethan Wong', goals: 1, assists: 0 },
  ],
  'Manhattan Strikers FC': [
    { name: 'Diego Fernandez', goals: 8, assists: 3 },
    { name: 'Malik Johnson', goals: 2, assists: 6 },
    { name: 'Owen Sullivan', goals: 0, assists: 2 },
  ],
  'Bronx Rovers FC': [
    { name: 'Carlos Mendoza', goals: 7, assists: 1 },
    { name: 'Tyrell Brooks', goals: 4, assists: 8 },
    { name: 'Nico Russo', goals: 1, assists: 0 },
  ],
};

const { count: playerCount } = db
  .prepare('SELECT COUNT(*) AS count FROM players')
  .get();

if (playerCount === 0) {
  const insertPlayer = db.prepare(
    'INSERT INTO players (name, team_id, goals, assists) VALUES (?, ?, ?, ?)'
  );

  for (const [teamName, players] of Object.entries(playersByTeam)) {
    const teamId = teamIdByName[teamName];
    for (const player of players) {
      insertPlayer.run(player.name, teamId, player.goals, player.assists);
    }
  }

  console.log('Seeded players table.');
} else {
  console.log('Players table already has data, skipping.');
}

const matches = [
  {
    home: 'Brooklyn Kickers FC',
    away: 'Queens United SC',
    homeScore: 3,
    awayScore: 1,
    status: 'final',
  },
  {
    home: 'Manhattan Strikers FC',
    away: 'Bronx Rovers FC',
    homeScore: 2,
    awayScore: 2,
    status: 'final',
  },
  {
    home: 'Queens United SC',
    away: 'Manhattan Strikers FC',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
  },
  {
    home: 'Bronx Rovers FC',
    away: 'Brooklyn Kickers FC',
    homeScore: 0,
    awayScore: 0,
    status: 'scheduled',
  },
];

const { count: matchCount } = db
  .prepare('SELECT COUNT(*) AS count FROM matches')
  .get();

if (matchCount === 0) {
  const insertMatch = db.prepare(
    'INSERT INTO matches (home_team_id, away_team_id, home_score, away_score, status) VALUES (?, ?, ?, ?, ?)'
  );

  for (const match of matches) {
    insertMatch.run(
      teamIdByName[match.home],
      teamIdByName[match.away],
      match.homeScore,
      match.awayScore,
      match.status
    );
  }

  console.log('Seeded matches table.');
} else {
  console.log('Matches table already has data, skipping.');
}

for (const teamId of Object.values(teamIdByName)) {
  recalculateTeamPoints(teamId);
}

console.log('Backfilled team points from final matches.');
