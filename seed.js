const db = require('./database.js');

const teams = [
  { name: 'Brooklyn Kickers FC', borough: 'Brooklyn', points: 0 },
  { name: 'Queens United SC', borough: 'Queens', points: 0 },
  { name: 'Manhattan Strikers FC', borough: 'Manhattan', points: 0 },
  { name: 'Bronx Rovers FC', borough: 'Bronx', points: 0 },
];

const insert = db.prepare(
  'INSERT OR IGNORE INTO teams (name, borough, points) VALUES (?, ?, ?)'
);

for (const team of teams) {
  insert.run(team.name, team.borough, team.points);
}

console.log('Seeded teams table.');
