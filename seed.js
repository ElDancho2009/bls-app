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
  { name: 'Cobham United', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Stiff Bucku FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Pasias FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Wakefield FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Grit City FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Ubiquitous FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'FC Schutzstern', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Dark Knights FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Warriors FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'West Side Warriors', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Desconocides FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Harlem FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'North Park FC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Bronx Bengals', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Knights SC', borough: 'Bronx', division: 'bronx', points: 0 },
  { name: 'Nexia Madrid', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Woodside Rovers FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Beacon AFC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Los Juga Vonitos', borough: 'Queens', division: 'queens', points: 0 },
  { name: '38 FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Hispanics FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Mimar Sinan United', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Beschissen FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Queens United', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Malevolent Thorns FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Ilithios Malakas FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Momo FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Venom FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Borough Kings', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'PS11 FC', borough: 'Queens', division: 'queens', points: 0 },
  { name: 'Cloud FC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Hudson River SC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Labubu SC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Sunnyside FC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Catalonia FC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Norwood United', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Elmhurst FC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'P Ballers', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Inter SC', borough: 'Citywide', division: 'first', points: 0 },
  { name: '49 Antics', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'LIC Brexits', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Jerome Park FC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Rosedale FC', borough: 'Citywide', division: 'first', points: 0 },
  { name: 'Club Atletico', borough: 'Citywide', division: 'first', points: 0 },
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

// Real 26-27 Bronx Division schedule (scraped from LeagueLobster) — 20 rounds,
// 150 fixtures, all unplayed. Same caveat as Brooklyn: no rosters yet, so no
// lineups/events/clips/MOTM data until real results come in.
const bronxMatches = [
  { home: 'North Park FC', away: 'Dark Knights FC', venue: 'Randalls Island', kickoffAt: '2026-08-22T12:00:00', round: 1 },
  { home: 'Cobham United', away: 'Warriors FC', venue: 'Randalls Island', kickoffAt: '2026-08-22T14:00:00', round: 1 },
  { home: 'Grit City FC', away: 'Bronx Bengals', venue: 'Quarry Ballfields', kickoffAt: '2026-08-22T16:00:00', round: 1 },
  { home: 'Knights SC', away: 'Ubiquitous FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-08-22T17:00:00', round: 1 },
  { home: 'Stiff Bucku FC', away: 'West Side Warriors', venue: 'Randalls Island', kickoffAt: '2026-08-23T12:00:00', round: 1 },
  { home: 'Pasias FC', away: 'FC Schutzstern', venue: 'Allerton Field', kickoffAt: '2026-08-23T12:00:00', round: 1 },
  { home: 'Wakefield FC', away: 'Harlem FC', venue: 'Harris Park', kickoffAt: '2026-08-23T13:00:00', round: 1 },
  { home: 'Dark Knights FC', away: 'Desconocides FC', venue: 'Randalls Island', kickoffAt: '2026-08-23T14:00:00', round: 1 },
  { home: 'Dark Knights FC', away: 'West Side Warriors', venue: 'Randalls Island', kickoffAt: '2026-08-29T12:00:00', round: 2 },
  { home: 'Stiff Bucku FC', away: 'Harlem FC', venue: 'Randalls Island', kickoffAt: '2026-08-29T14:00:00', round: 2 },
  { home: 'Grit City FC', away: 'North Park FC', venue: 'Quarry Ballfields', kickoffAt: '2026-08-29T16:00:00', round: 2 },
  { home: 'Desconocides FC', away: 'Bronx Bengals', venue: 'Roberto Clemente State Park', kickoffAt: '2026-08-29T17:00:00', round: 2 },
  { home: 'Cobham United', away: 'Ubiquitous FC', venue: 'Randalls Island', kickoffAt: '2026-08-30T12:00:00', round: 2 },
  { home: 'FC Schutzstern', away: 'Stiff Bucku FC', venue: 'Crotona Park', kickoffAt: '2026-08-30T12:00:00', round: 2 },
  { home: 'Wakefield FC', away: 'Knights SC', venue: 'Harris Park', kickoffAt: '2026-08-30T13:00:00', round: 2 },
  { home: 'Warriors FC', away: 'Pasias FC', venue: 'Van Cortlandt Stadium', kickoffAt: '2026-08-30T13:30:00', round: 2 },
  { home: 'Stiff Bucku FC', away: 'Desconocides FC', venue: 'Randalls Island', kickoffAt: '2026-09-05T12:00:00', round: 3 },
  { home: 'Cobham United', away: 'West Side Warriors', venue: 'Randalls Island', kickoffAt: '2026-09-05T14:00:00', round: 3 },
  { home: 'Knights SC', away: 'Harlem FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-05T17:00:00', round: 3 },
  { home: 'Dark Knights FC', away: 'Bronx Bengals', venue: 'Randalls Island', kickoffAt: '2026-09-06T12:00:00', round: 3 },
  { home: 'Pasias FC', away: 'North Park FC', venue: 'Allerton Field', kickoffAt: '2026-09-06T12:00:00', round: 3 },
  { home: 'FC Schutzstern', away: 'Wakefield FC', venue: 'Crotona Park', kickoffAt: '2026-09-06T12:00:00', round: 3 },
  { home: 'Warriors FC', away: 'Ubiquitous FC', venue: 'Van Cortlandt Stadium', kickoffAt: '2026-09-06T13:30:00', round: 3 },
  { home: 'Desconocides FC', away: 'Grit City FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-06T17:00:00', round: 3 },
  { home: 'Bronx Bengals', away: 'Pasias FC', venue: 'Randalls Island', kickoffAt: '2026-09-19T12:00:00', round: 4 },
  { home: 'Stiff Bucku FC', away: 'Cobham United', venue: 'Randalls Island', kickoffAt: '2026-09-19T14:00:00', round: 4 },
  { home: 'Knights SC', away: 'West Side Warriors', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-19T17:00:00', round: 4 },
  { home: 'Harlem FC', away: 'West Side Warriors', venue: 'Randalls Island', kickoffAt: '2026-09-20T12:00:00', round: 4 },
  { home: 'FC Schutzstern', away: 'North Park FC', venue: 'Crotona Park', kickoffAt: '2026-09-20T12:00:00', round: 4 },
  { home: 'Ubiquitous FC', away: 'Grit City FC', venue: 'Jacob H Schiff Playground', kickoffAt: '2026-09-20T12:00:00', round: 4 },
  { home: 'Wakefield FC', away: 'Dark Knights FC', venue: 'Harris Park', kickoffAt: '2026-09-20T13:00:00', round: 4 },
  { home: 'Warriors FC', away: 'Desconocides FC', venue: 'Van Cortlandt Stadium', kickoffAt: '2026-09-20T13:30:00', round: 4 },
  { home: 'Cobham United', away: 'Pasias FC', venue: 'Randalls Island', kickoffAt: '2026-09-26T12:00:00', round: 5 },
  { home: 'North Park FC', away: 'Harlem FC', venue: 'Randalls Island', kickoffAt: '2026-09-26T14:00:00', round: 5 },
  { home: 'West Side Warriors', away: 'Bronx Bengals', venue: 'Thomas Jefferson Park', kickoffAt: '2026-09-26T15:00:00', round: 5 },
  { home: 'Knights SC', away: 'Stiff Bucku FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-26T17:00:00', round: 5 },
  { home: 'Dark Knights FC', away: 'Ubiquitous FC', venue: 'Randalls Island', kickoffAt: '2026-09-27T12:00:00', round: 5 },
  { home: 'Warriors FC', away: 'Grit City FC', venue: 'Van Cortlandt Stadium', kickoffAt: '2026-09-27T13:30:00', round: 5 },
  { home: 'Bronx Bengals', away: 'Wakefield FC', venue: 'Randalls Island', kickoffAt: '2026-09-27T14:00:00', round: 5 },
  { home: 'Desconocides FC', away: 'FC Schutzstern', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-27T17:00:00', round: 5 },
  { home: 'Stiff Bucku FC', away: 'Bronx Bengals', venue: 'Randalls Island', kickoffAt: '2026-10-10T12:00:00', round: 6 },
  { home: 'Cobham United', away: 'Dark Knights FC', venue: 'Randalls Island', kickoffAt: '2026-10-10T14:00:00', round: 6 },
  { home: 'West Side Warriors', away: 'Warriors FC', venue: 'Thomas Jefferson Park', kickoffAt: '2026-10-10T15:00:00', round: 6 },
  { home: 'Knights SC', away: 'Grit City FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-10-10T17:00:00', round: 6 },
  { home: 'Pasias FC', away: 'Desconocides FC', venue: 'Allerton Field', kickoffAt: '2026-10-11T12:00:00', round: 6 },
  { home: 'FC Schutzstern', away: 'Harlem FC', venue: 'Crotona Park', kickoffAt: '2026-10-11T12:00:00', round: 6 },
  { home: 'Ubiquitous FC', away: 'North Park FC', venue: 'Jacob H Schiff Playground', kickoffAt: '2026-10-11T12:00:00', round: 6 },
  { home: 'Desconocides FC', away: 'Wakefield FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-10-11T17:00:00', round: 6 },
  { home: 'Bronx Bengals', away: 'Grit City FC', venue: 'Randalls Island', kickoffAt: '2026-10-17T12:00:00', round: 7 },
  { home: 'Cobham United', away: 'North Park FC', venue: 'Randalls Island', kickoffAt: '2026-10-17T14:00:00', round: 7 },
  { home: 'West Side Warriors', away: 'Stiff Bucku FC', venue: 'Thomas Jefferson Park', kickoffAt: '2026-10-17T15:00:00', round: 7 },
  { home: 'Knights SC', away: 'Warriors FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-10-17T17:00:00', round: 7 },
  { home: 'Dark Knights FC', away: 'Desconocides FC', venue: 'Randalls Island', kickoffAt: '2026-10-18T12:00:00', round: 7 },
  { home: 'Pasias FC', away: 'Harlem FC', venue: 'Allerton Field', kickoffAt: '2026-10-18T12:00:00', round: 7 },
  { home: 'FC Schutzstern', away: 'Cobham United', venue: 'Crotona Park', kickoffAt: '2026-10-18T12:00:00', round: 7 },
  { home: 'Ubiquitous FC', away: 'Wakefield FC', venue: 'Jacob H Schiff Playground', kickoffAt: '2026-10-18T12:00:00', round: 7 },
  { home: 'Bronx Bengals', away: 'Cobham United', venue: 'Randalls Island', kickoffAt: '2026-10-31T12:00:00', round: 8 },
  { home: 'Harlem FC', away: 'Desconocides FC', venue: 'Randalls Island', kickoffAt: '2026-10-31T14:00:00', round: 8 },
  { home: 'West Side Warriors', away: 'North Park FC', venue: 'Thomas Jefferson Park', kickoffAt: '2026-10-31T15:00:00', round: 8 },
  { home: 'Grit City FC', away: 'FC Schutzstern', venue: 'Quarry Ballfields', kickoffAt: '2026-10-31T16:00:00', round: 8 },
  { home: 'Stiff Bucku FC', away: 'Wakefield FC', venue: 'Randalls Island', kickoffAt: '2026-11-01T12:00:00', round: 8 },
  { home: 'Pasias FC', away: 'Knights SC', venue: 'Allerton Field', kickoffAt: '2026-11-01T12:00:00', round: 8 },
  { home: 'Ubiquitous FC', away: 'FC Schutzstern', venue: 'Jacob H Schiff Playground', kickoffAt: '2026-11-01T12:00:00', round: 8 },
  { home: 'Warriors FC', away: 'Dark Knights FC', venue: 'Van Cortlandt Stadium', kickoffAt: '2026-11-01T13:30:00', round: 8 },
  { home: 'North Park FC', away: 'Bronx Bengals', venue: 'Randalls Island', kickoffAt: '2026-11-14T12:00:00', round: 9 },
  { home: 'Dark Knights FC', away: 'FC Schutzstern', venue: 'Randalls Island', kickoffAt: '2026-11-14T14:00:00', round: 9 },
  { home: 'Grit City FC', away: 'Harlem FC', venue: 'Quarry Ballfields', kickoffAt: '2026-11-14T16:00:00', round: 9 },
  { home: 'Desconocides FC', away: 'West Side Warriors', venue: 'Roberto Clemente State Park', kickoffAt: '2026-11-14T17:00:00', round: 9 },
  { home: 'Bronx Bengals', away: 'Warriors FC', venue: 'Randalls Island', kickoffAt: '2026-11-15T12:00:00', round: 9 },
  { home: 'Ubiquitous FC', away: 'Stiff Bucku FC', venue: 'Jacob H Schiff Playground', kickoffAt: '2026-11-15T12:00:00', round: 9 },
  { home: 'Wakefield FC', away: 'Pasias FC', venue: 'Harris Park', kickoffAt: '2026-11-15T13:00:00', round: 9 },
  { home: 'Knights SC', away: 'Cobham United', venue: 'Roberto Clemente State Park', kickoffAt: '2026-11-15T17:00:00', round: 9 },
  { home: 'North Park FC', away: 'Pasias FC', venue: 'Randalls Island', kickoffAt: '2026-12-05T12:00:00', round: 10 },
  { home: 'Harlem FC', away: 'Knights SC', venue: 'Randalls Island', kickoffAt: '2026-12-05T14:00:00', round: 10 },
  { home: 'West Side Warriors', away: 'Cobham United', venue: 'Thomas Jefferson Park', kickoffAt: '2026-12-05T15:00:00', round: 10 },
  { home: 'Desconocides FC', away: 'Stiff Bucku FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-12-05T17:00:00', round: 10 },
  { home: 'Stiff Bucku FC', away: 'Grit City FC', venue: 'Randalls Island', kickoffAt: '2026-12-06T12:00:00', round: 10 },
  { home: 'Ubiquitous FC', away: 'Warriors FC', venue: 'Jacob H Schiff Playground', kickoffAt: '2026-12-06T12:00:00', round: 10 },
  { home: 'Wakefield FC', away: 'FC Schutzstern', venue: 'Harris Park', kickoffAt: '2026-12-06T13:00:00', round: 10 },
  { home: 'Bronx Bengals', away: 'Dark Knights FC', venue: 'Randalls Island', kickoffAt: '2026-12-06T14:00:00', round: 10 },
  { home: 'North Park FC', away: 'Warriors FC', venue: 'Randalls Island', kickoffAt: '2026-12-12T12:00:00', round: 11 },
  { home: 'Dark Knights FC', away: 'Knights SC', venue: 'Randalls Island', kickoffAt: '2026-12-12T14:00:00', round: 11 },
  { home: 'West Side Warriors', away: 'FC Schutzstern', venue: 'Thomas Jefferson Park', kickoffAt: '2026-12-12T15:00:00', round: 11 },
  { home: 'Desconocides FC', away: 'Ubiquitous FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-12-12T17:00:00', round: 11 },
  { home: 'Bronx Bengals', away: 'Harlem FC', venue: 'Randalls Island', kickoffAt: '2026-12-13T12:00:00', round: 11 },
  { home: 'Pasias FC', away: 'Stiff Bucku FC', venue: 'Allerton Field', kickoffAt: '2026-12-13T12:00:00', round: 11 },
  { home: 'Wakefield FC', away: 'Grit City FC', venue: 'Harris Park', kickoffAt: '2026-12-13T13:00:00', round: 11 },
  { home: 'Stiff Bucku FC', away: 'Dark Knights FC', venue: 'Randalls Island', kickoffAt: '2026-12-19T12:00:00', round: 12 },
  { home: 'Cobham United', away: 'Desconocides FC', venue: 'Randalls Island', kickoffAt: '2026-12-19T14:00:00', round: 12 },
  { home: 'Knights SC', away: 'North Park FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-12-19T17:00:00', round: 12 },
  { home: 'Pasias FC', away: 'Grit City FC', venue: 'Allerton Field', kickoffAt: '2026-12-20T12:00:00', round: 12 },
  { home: 'FC Schutzstern', away: 'Warriors FC', venue: 'Crotona Park', kickoffAt: '2026-12-20T12:00:00', round: 12 },
  { home: 'Ubiquitous FC', away: 'Harlem FC', venue: 'Jacob H Schiff Playground', kickoffAt: '2026-12-20T12:00:00', round: 12 },
  { home: 'Wakefield FC', away: 'West Side Warriors', venue: 'Harris Park', kickoffAt: '2026-12-20T13:00:00', round: 12 },
  { home: 'Cobham United', away: 'Grit City FC', venue: 'Randalls Island', kickoffAt: '2027-03-06T12:00:00', round: 13 },
  { home: 'North Park FC', away: 'Wakefield FC', venue: 'Randalls Island', kickoffAt: '2027-03-06T14:00:00', round: 13 },
  { home: 'West Side Warriors', away: 'Ubiquitous FC', venue: 'Thomas Jefferson Park', kickoffAt: '2027-03-06T15:00:00', round: 13 },
  { home: 'Desconocides FC', away: 'Knights SC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-03-06T17:00:00', round: 13 },
  { home: 'Dark Knights FC', away: 'Pasias FC', venue: 'Randalls Island', kickoffAt: '2027-03-07T12:00:00', round: 13 },
  { home: 'Warriors FC', away: 'Harlem FC', venue: 'Van Cortlandt Stadium', kickoffAt: '2027-03-07T13:30:00', round: 13 },
  { home: 'Bronx Bengals', away: 'FC Schutzstern', venue: 'Randalls Island', kickoffAt: '2027-03-07T14:00:00', round: 13 },
  { home: 'Harlem FC', away: 'Wakefield FC', venue: 'Randalls Island', kickoffAt: '2027-03-20T12:00:00', round: 14 },
  { home: 'North Park FC', away: 'Cobham United', venue: 'Randalls Island', kickoffAt: '2027-03-20T14:00:00', round: 14 },
  { home: 'West Side Warriors', away: 'Knights SC', venue: 'Thomas Jefferson Park', kickoffAt: '2027-03-20T15:00:00', round: 14 },
  { home: 'Grit City FC', away: 'Stiff Bucku FC', venue: 'Quarry Ballfields', kickoffAt: '2027-03-20T16:00:00', round: 14 },
  { home: 'Desconocides FC', away: 'Pasias FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-03-20T17:00:00', round: 14 },
  { home: 'FC Schutzstern', away: 'Ubiquitous FC', venue: 'Crotona Park', kickoffAt: '2027-03-21T12:00:00', round: 14 },
  { home: 'Warriors FC', away: 'Bronx Bengals', venue: 'Van Cortlandt Stadium', kickoffAt: '2027-03-21T13:30:00', round: 14 },
  { home: 'Bronx Bengals', away: 'Ubiquitous FC', venue: 'Randalls Island', kickoffAt: '2027-03-27T12:00:00', round: 15 },
  { home: 'Stiff Bucku FC', away: 'North Park FC', venue: 'Randalls Island', kickoffAt: '2027-03-27T14:00:00', round: 15 },
  { home: 'Grit City FC', away: 'Dark Knights FC', venue: 'Quarry Ballfields', kickoffAt: '2027-03-27T16:00:00', round: 15 },
  { home: 'Knights SC', away: 'FC Schutzstern', venue: 'Roberto Clemente State Park', kickoffAt: '2027-03-27T17:00:00', round: 15 },
  { home: 'Harlem FC', away: 'Cobham United', venue: 'Randalls Island', kickoffAt: '2027-03-28T12:00:00', round: 15 },
  { home: 'Pasias FC', away: 'West Side Warriors', venue: 'Allerton Field', kickoffAt: '2027-03-28T12:00:00', round: 15 },
  { home: 'Wakefield FC', away: 'Warriors FC', venue: 'Harris Park', kickoffAt: '2027-03-28T13:00:00', round: 15 },
  { home: 'Harlem FC', away: 'Dark Knights FC', venue: 'Randalls Island', kickoffAt: '2027-04-10T12:00:00', round: 16 },
  { home: 'Stiff Bucku FC', away: 'Warriors FC', venue: 'Randalls Island', kickoffAt: '2027-04-10T14:00:00', round: 16 },
  { home: 'Grit City FC', away: 'West Side Warriors', venue: 'Quarry Ballfields', kickoffAt: '2027-04-10T16:00:00', round: 16 },
  { home: 'Desconocides FC', away: 'North Park FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-04-10T17:00:00', round: 16 },
  { home: 'Bronx Bengals', away: 'Knights SC', venue: 'Randalls Island', kickoffAt: '2027-04-11T12:00:00', round: 16 },
  { home: 'Pasias FC', away: 'Ubiquitous FC', venue: 'Allerton Field', kickoffAt: '2027-04-11T12:00:00', round: 16 },
  { home: 'Cobham United', away: 'Wakefield FC', venue: 'Randalls Island', kickoffAt: '2027-04-11T14:00:00', round: 16 },
  { home: 'Dark Knights FC', away: 'Grit City FC', venue: 'Randalls Island', kickoffAt: '2027-04-17T12:00:00', round: 17 },
  { home: 'North Park FC', away: 'Stiff Bucku FC', venue: 'Randalls Island', kickoffAt: '2027-04-17T14:00:00', round: 17 },
  { home: 'West Side Warriors', away: 'Pasias FC', venue: 'Thomas Jefferson Park', kickoffAt: '2027-04-17T15:00:00', round: 17 },
  { home: 'Harlem FC', away: 'Cobham United', venue: 'Randalls Island', kickoffAt: '2027-04-18T12:00:00', round: 17 },
  { home: 'FC Schutzstern', away: 'Knights SC', venue: 'Crotona Park', kickoffAt: '2027-04-18T12:00:00', round: 17 },
  { home: 'Ubiquitous FC', away: 'Bronx Bengals', venue: 'Jacob H Schiff Playground', kickoffAt: '2027-04-18T12:00:00', round: 17 },
  { home: 'Warriors FC', away: 'Wakefield FC', venue: 'Van Cortlandt Stadium', kickoffAt: '2027-04-18T13:30:00', round: 17 },
  { home: 'Harlem FC', away: 'Ubiquitous FC', venue: 'Randalls Island', kickoffAt: '2027-04-24T12:00:00', round: 18 },
  { home: 'Dark Knights FC', away: 'Stiff Bucku FC', venue: 'Randalls Island', kickoffAt: '2027-04-24T14:00:00', round: 18 },
  { home: 'West Side Warriors', away: 'Wakefield FC', venue: 'Thomas Jefferson Park', kickoffAt: '2027-04-24T15:00:00', round: 18 },
  { home: 'Grit City FC', away: 'Pasias FC', venue: 'Quarry Ballfields', kickoffAt: '2027-04-24T16:00:00', round: 18 },
  { home: 'Cobham United', away: 'Desconocides FC', venue: 'Randalls Island', kickoffAt: '2027-04-25T12:00:00', round: 18 },
  { home: 'Warriors FC', away: 'FC Schutzstern', venue: 'Van Cortlandt Stadium', kickoffAt: '2027-04-25T13:30:00', round: 18 },
  { home: 'North Park FC', away: 'Knights SC', venue: 'Randalls Island', kickoffAt: '2027-04-25T14:00:00', round: 18 },
  { home: 'Harlem FC', away: 'Warriors FC', venue: 'Randalls Island', kickoffAt: '2027-05-01T12:00:00', round: 19 },
  { home: 'Grit City FC', away: 'Cobham United', venue: 'Quarry Ballfields', kickoffAt: '2027-05-01T16:00:00', round: 19 },
  { home: 'Knights SC', away: 'Desconocides FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-05-01T17:00:00', round: 19 },
  { home: 'Pasias FC', away: 'Dark Knights FC', venue: 'Allerton Field', kickoffAt: '2027-05-02T12:00:00', round: 19 },
  { home: 'FC Schutzstern', away: 'Bronx Bengals', venue: 'Crotona Park', kickoffAt: '2027-05-02T12:00:00', round: 19 },
  { home: 'Ubiquitous FC', away: 'West Side Warriors', venue: 'Jacob H Schiff Playground', kickoffAt: '2027-05-02T12:00:00', round: 19 },
  { home: 'Wakefield FC', away: 'North Park FC', venue: 'Harris Park', kickoffAt: '2027-05-02T13:00:00', round: 19 },
  { home: 'Harlem FC', away: 'Stiff Bucku FC', venue: 'Randalls Island', kickoffAt: '2027-05-08T12:00:00', round: 20 },
  { home: 'North Park FC', away: 'Dark Knights FC', venue: 'Randalls Island', kickoffAt: '2027-05-08T14:00:00', round: 20 },
  { home: 'Grit City FC', away: 'Desconocides FC', venue: 'Quarry Ballfields', kickoffAt: '2027-05-08T16:00:00', round: 20 },
  { home: 'FC Schutzstern', away: 'Pasias FC', venue: 'Crotona Park', kickoffAt: '2027-05-09T12:00:00', round: 20 },
  { home: 'Ubiquitous FC', away: 'Knights SC', venue: 'Jacob H Schiff Playground', kickoffAt: '2027-05-09T12:00:00', round: 20 },
  { home: 'Wakefield FC', away: 'Bronx Bengals', venue: 'Harris Park', kickoffAt: '2027-05-09T13:00:00', round: 20 },
  { home: 'Warriors FC', away: 'Cobham United', venue: 'Van Cortlandt Stadium', kickoffAt: '2027-05-09T13:30:00', round: 20 },
];

// Real 26-27 Queens Division schedule (scraped from LeagueLobster) — 20 rounds,
// 150 fixtures, all unplayed. Same caveat as Brooklyn/Bronx: no rosters yet.
const queensMatches = [
  { home: 'Los Juga Vonitos', away: 'Venom FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-08-22T10:00:00', round: 1 },
  { home: 'Nexia Madrid', away: 'Malevolent Thorns FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-08-22T11:00:00', round: 1 },
  { home: 'Momo FC', away: '38 FC', venue: 'Big Bush Park', kickoffAt: '2026-08-22T12:00:00', round: 1 },
  { home: 'Beschissen FC', away: 'Borough Kings', venue: 'Jack Mcmanus Field', kickoffAt: '2026-08-22T12:00:00', round: 1 },
  { home: 'PS11 FC', away: 'Mimar Sinan United', venue: 'Big Bush Park', kickoffAt: '2026-08-22T14:00:00', round: 1 },
  { home: 'Beacon AFC', away: 'Los Juga Vonitos', venue: 'Jack Mcmanus Field', kickoffAt: '2026-08-22T14:00:00', round: 1 },
  { home: 'Ilithios Malakas FC', away: 'Queens United', venue: 'Kosmos Soccer Field', kickoffAt: '2026-08-23T11:00:00', round: 1 },
  { home: 'Woodside Rovers FC', away: 'Hispanics FC', venue: 'Frank Principe Park', kickoffAt: '2026-08-23T14:00:00', round: 1 },
  { home: 'Los Juga Vonitos', away: 'Malevolent Thorns FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-08-29T10:00:00', round: 2 },
  { home: 'Ilithios Malakas FC', away: 'Borough Kings', venue: 'Kosmos Soccer Field', kickoffAt: '2026-08-29T11:00:00', round: 2 },
  { home: 'PS11 FC', away: 'Woodside Rovers FC', venue: 'Big Bush Park', kickoffAt: '2026-08-29T12:00:00', round: 2 },
  { home: 'Beschissen FC', away: 'Hispanics FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-08-29T12:00:00', round: 2 },
  { home: 'Momo FC', away: 'Beacon AFC', venue: 'Big Bush Park', kickoffAt: '2026-08-29T14:00:00', round: 2 },
  { home: '38 FC', away: 'Venom FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-08-29T14:00:00', round: 2 },
  { home: 'Nexia Madrid', away: 'Mimar Sinan United', venue: 'Kosmos Soccer Field', kickoffAt: '2026-08-30T11:00:00', round: 2 },
  { home: 'Queens United', away: 'Nexia Madrid', venue: 'Pal’s Oval', kickoffAt: '2026-08-30T14:00:00', round: 2 },
  { home: 'Los Juga Vonitos', away: '38 FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-09-05T10:00:00', round: 3 },
  { home: 'Ilithios Malakas FC', away: 'Beacon AFC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-09-05T11:00:00', round: 3 },
  { home: 'Borough Kings', away: 'Hispanics FC', venue: 'Big Bush Park', kickoffAt: '2026-09-05T12:00:00', round: 3 },
  { home: 'Beschissen FC', away: 'Malevolent Thorns FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-09-05T12:00:00', round: 3 },
  { home: 'Momo FC', away: 'Venom FC', venue: 'Big Bush Park', kickoffAt: '2026-09-05T14:00:00', round: 3 },
  { home: 'Nexia Madrid', away: 'Venom FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-09-06T11:00:00', round: 3 },
  { home: 'Queens United', away: 'PS11 FC', venue: 'Pal’s Oval', kickoffAt: '2026-09-06T14:00:00', round: 3 },
  { home: 'Woodside Rovers FC', away: 'Mimar Sinan United', venue: 'Frank Principe Park', kickoffAt: '2026-09-06T14:00:00', round: 3 },
  { home: 'Nexia Madrid', away: 'Beschissen FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-09-19T11:00:00', round: 4 },
  { home: 'PS11 FC', away: 'Los Juga Vonitos', venue: 'Big Bush Park', kickoffAt: '2026-09-19T12:00:00', round: 4 },
  { home: 'Mimar Sinan United', away: 'Malevolent Thorns FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-09-19T12:00:00', round: 4 },
  { home: 'Hispanics FC', away: 'Momo FC', venue: 'Big Bush Park', kickoffAt: '2026-09-19T14:00:00', round: 4 },
  { home: '38 FC', away: 'Ilithios Malakas FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-09-19T14:00:00', round: 4 },
  { home: 'Borough Kings', away: 'Venom FC', venue: 'Big Bush Park', kickoffAt: '2026-09-20T12:00:00', round: 4 },
  { home: 'Queens United', away: 'Beacon AFC', venue: 'Pal’s Oval', kickoffAt: '2026-09-20T14:00:00', round: 4 },
  { home: 'Woodside Rovers FC', away: 'Malevolent Thorns FC', venue: 'Frank Principe Park', kickoffAt: '2026-09-20T14:00:00', round: 4 },
  { home: 'Los Juga Vonitos', away: 'Hispanics FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-09-26T10:00:00', round: 5 },
  { home: 'Venom FC', away: 'Queens United', venue: 'Kosmos Soccer Field', kickoffAt: '2026-09-26T11:00:00', round: 5 },
  { home: 'Momo FC', away: 'Borough Kings', venue: 'Big Bush Park', kickoffAt: '2026-09-26T12:00:00', round: 5 },
  { home: '38 FC', away: 'PS11 FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-09-26T12:00:00', round: 5 },
  { home: 'Beschissen FC', away: 'Ilithios Malakas FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-09-26T14:00:00', round: 5 },
  { home: 'Mimar Sinan United', away: 'Beacon AFC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-09-26T16:00:00', round: 5 },
  { home: 'Malevolent Thorns FC', away: '38 FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-09-27T10:00:00', round: 5 },
  { home: 'Woodside Rovers FC', away: 'Nexia Madrid', venue: 'Frank Principe Park', kickoffAt: '2026-09-27T14:00:00', round: 5 },
  { home: 'Ilithios Malakas FC', away: 'Venom FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-10-10T11:00:00', round: 6 },
  { home: 'Hispanics FC', away: 'Beacon AFC', venue: 'Big Bush Park', kickoffAt: '2026-10-10T12:00:00', round: 6 },
  { home: 'Beschissen FC', away: 'Los Juga Vonitos', venue: 'Jack Mcmanus Field', kickoffAt: '2026-10-10T12:00:00', round: 6 },
  { home: 'PS11 FC', away: 'Venom FC', venue: 'Big Bush Park', kickoffAt: '2026-10-10T14:00:00', round: 6 },
  { home: 'Nexia Madrid', away: '38 FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-10-11T11:00:00', round: 6 },
  { home: 'Borough Kings', away: 'Malevolent Thorns FC', venue: 'Big Bush Park', kickoffAt: '2026-10-11T12:00:00', round: 6 },
  { home: 'Queens United', away: 'Mimar Sinan United', venue: 'Pal’s Oval', kickoffAt: '2026-10-11T14:00:00', round: 6 },
  { home: 'Woodside Rovers FC', away: 'Momo FC', venue: 'Frank Principe Park', kickoffAt: '2026-10-11T14:00:00', round: 6 },
  { home: 'Malevolent Thorns FC', away: 'Nexia Madrid', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-10-17T10:00:00', round: 7 },
  { home: 'Venom FC', away: 'Los Juga Vonitos', venue: 'Kosmos Soccer Field', kickoffAt: '2026-10-17T11:00:00', round: 7 },
  { home: 'Borough Kings', away: 'Woodside Rovers FC', venue: 'Big Bush Park', kickoffAt: '2026-10-17T12:00:00', round: 7 },
  { home: 'Beschissen FC', away: 'Beacon AFC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-10-17T12:00:00', round: 7 },
  { home: 'Hispanics FC', away: 'PS11 FC', venue: 'Big Bush Park', kickoffAt: '2026-10-17T14:00:00', round: 7 },
  { home: '38 FC', away: 'Momo FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-10-17T14:00:00', round: 7 },
  { home: 'Ilithios Malakas FC', away: 'Mimar Sinan United', venue: 'Kosmos Soccer Field', kickoffAt: '2026-10-18T11:00:00', round: 7 },
  { home: 'Queens United', away: 'Beschissen FC', venue: 'Pal’s Oval', kickoffAt: '2026-10-18T14:00:00', round: 7 },
  { home: 'Malevolent Thorns FC', away: 'Beacon AFC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-10-31T10:00:00', round: 8 },
  { home: 'Ilithios Malakas FC', away: 'Woodside Rovers FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-10-31T11:00:00', round: 8 },
  { home: 'Hispanics FC', away: 'Queens United', venue: 'Big Bush Park', kickoffAt: '2026-10-31T12:00:00', round: 8 },
  { home: '38 FC', away: 'Beschissen FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-10-31T12:00:00', round: 8 },
  { home: 'Borough Kings', away: 'Los Juga Vonitos', venue: 'Big Bush Park', kickoffAt: '2026-10-31T14:00:00', round: 8 },
  { home: 'Mimar Sinan United', away: 'Venom FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-10-31T14:00:00', round: 8 },
  { home: 'Nexia Madrid', away: 'PS11 FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-11-01T11:00:00', round: 8 },
  { home: 'Momo FC', away: 'Queens United', venue: 'Big Bush Park', kickoffAt: '2026-11-01T12:00:00', round: 8 },
  { home: 'Los Juga Vonitos', away: 'Queens United', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-11-14T10:00:00', round: 9 },
  { home: 'Venom FC', away: 'Malevolent Thorns FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-11-14T11:00:00', round: 9 },
  { home: 'Hispanics FC', away: 'Nexia Madrid', venue: 'Big Bush Park', kickoffAt: '2026-11-14T12:00:00', round: 9 },
  { home: 'Beacon AFC', away: '38 FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-11-14T12:00:00', round: 9 },
  { home: 'PS11 FC', away: 'Ilithios Malakas FC', venue: 'Big Bush Park', kickoffAt: '2026-11-14T14:00:00', round: 9 },
  { home: '38 FC', away: 'Borough Kings', venue: 'Jack Mcmanus Field', kickoffAt: '2026-11-14T14:00:00', round: 9 },
  { home: 'Momo FC', away: 'Mimar Sinan United', venue: 'Big Bush Park', kickoffAt: '2026-11-15T12:00:00', round: 9 },
  { home: 'Woodside Rovers FC', away: 'Beschissen FC', venue: 'Frank Principe Park', kickoffAt: '2026-11-15T14:00:00', round: 9 },
  { home: 'Malevolent Thorns FC', away: 'Beschissen FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-12-05T10:00:00', round: 10 },
  { home: 'Nexia Madrid', away: 'Momo FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-12-05T11:00:00', round: 10 },
  { home: 'Hispanics FC', away: 'Borough Kings', venue: 'Big Bush Park', kickoffAt: '2026-12-05T12:00:00', round: 10 },
  { home: 'Beacon AFC', away: 'Ilithios Malakas FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-12-05T12:00:00', round: 10 },
  { home: 'PS11 FC', away: 'Queens United', venue: 'Big Bush Park', kickoffAt: '2026-12-05T14:00:00', round: 10 },
  { home: '38 FC', away: 'Los Juga Vonitos', venue: 'Jack Mcmanus Field', kickoffAt: '2026-12-05T14:00:00', round: 10 },
  { home: 'Mimar Sinan United', away: 'Woodside Rovers FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-12-05T16:00:00', round: 10 },
  { home: 'Venom FC', away: 'Nexia Madrid', venue: 'Kosmos Soccer Field', kickoffAt: '2026-12-06T11:00:00', round: 10 },
  { home: 'Malevolent Thorns FC', away: 'Queens United', venue: 'Flushing Meadows Corona Park', kickoffAt: '2026-12-12T10:00:00', round: 11 },
  { home: 'Ilithios Malakas FC', away: 'Nexia Madrid', venue: 'Kosmos Soccer Field', kickoffAt: '2026-12-12T11:00:00', round: 11 },
  { home: 'Momo FC', away: 'PS11 FC', venue: 'Big Bush Park', kickoffAt: '2026-12-12T12:00:00', round: 11 },
  { home: 'Beacon AFC', away: 'Borough Kings', venue: 'Jack Mcmanus Field', kickoffAt: '2026-12-12T12:00:00', round: 11 },
  { home: 'Mimar Sinan United', away: '38 FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-12-12T14:00:00', round: 11 },
  { home: 'Venom FC', away: 'Hispanics FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-12-13T11:00:00', round: 11 },
  { home: 'Woodside Rovers FC', away: 'Los Juga Vonitos', venue: 'Frank Principe Park', kickoffAt: '2026-12-13T14:00:00', round: 11 },
  { home: 'Ilithios Malakas FC', away: 'Momo FC', venue: 'Kosmos Soccer Field', kickoffAt: '2026-12-19T11:00:00', round: 12 },
  { home: 'Hispanics FC', away: 'Mimar Sinan United', venue: 'Big Bush Park', kickoffAt: '2026-12-19T12:00:00', round: 12 },
  { home: 'Beschissen FC', away: 'Venom FC', venue: 'Jack Mcmanus Field', kickoffAt: '2026-12-19T12:00:00', round: 12 },
  { home: 'PS11 FC', away: 'Malevolent Thorns FC', venue: 'Big Bush Park', kickoffAt: '2026-12-19T14:00:00', round: 12 },
  { home: 'Nexia Madrid', away: 'Los Juga Vonitos', venue: 'Kosmos Soccer Field', kickoffAt: '2026-12-20T11:00:00', round: 12 },
  { home: 'Queens United', away: 'Borough Kings', venue: 'Pal’s Oval', kickoffAt: '2026-12-20T14:00:00', round: 12 },
  { home: 'Woodside Rovers FC', away: 'Beacon AFC', venue: 'Frank Principe Park', kickoffAt: '2026-12-20T14:00:00', round: 12 },
  { home: 'Los Juga Vonitos', away: 'Ilithios Malakas FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-03-06T10:00:00', round: 13 },
  { home: 'Venom FC', away: 'Woodside Rovers FC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-03-06T11:00:00', round: 13 },
  { home: 'Borough Kings', away: 'Mimar Sinan United', venue: 'Big Bush Park', kickoffAt: '2027-03-06T12:00:00', round: 13 },
  { home: 'Beacon AFC', away: 'PS11 FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-06T12:00:00', round: 13 },
  { home: 'Beschissen FC', away: 'Momo FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-06T14:00:00', round: 13 },
  { home: '38 FC', away: 'Queens United', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-06T16:00:00', round: 13 },
  { home: 'Malevolent Thorns FC', away: 'Hispanics FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-03-07T10:00:00', round: 13 },
  { home: 'Malevolent Thorns FC', away: 'Woodside Rovers FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-03-20T10:00:00', round: 14 },
  { home: 'Nexia Madrid', away: 'Momo FC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-03-20T11:00:00', round: 14 },
  { home: 'Borough Kings', away: '38 FC', venue: 'Big Bush Park', kickoffAt: '2027-03-20T12:00:00', round: 14 },
  { home: 'Mimar Sinan United', away: 'PS11 FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-20T12:00:00', round: 14 },
  { home: 'Beacon AFC', away: 'Beschissen FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-20T14:00:00', round: 14 },
  { home: 'Venom FC', away: 'Ilithios Malakas FC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-03-21T11:00:00', round: 14 },
  { home: 'Queens United', away: 'Hispanics FC', venue: 'Pal’s Oval', kickoffAt: '2027-03-21T14:00:00', round: 14 },
  { home: 'Los Juga Vonitos', away: 'Momo FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-03-27T10:00:00', round: 15 },
  { home: 'Ilithios Malakas FC', away: 'Malevolent Thorns FC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-03-27T11:00:00', round: 15 },
  { home: 'PS11 FC', away: 'Borough Kings', venue: 'Big Bush Park', kickoffAt: '2027-03-27T12:00:00', round: 15 },
  { home: 'Beacon AFC', away: 'Nexia Madrid', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-27T12:00:00', round: 15 },
  { home: '38 FC', away: 'Hispanics FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-27T14:00:00', round: 15 },
  { home: 'Beschissen FC', away: 'Mimar Sinan United', venue: 'Jack Mcmanus Field', kickoffAt: '2027-03-27T16:00:00', round: 15 },
  { home: 'Woodside Rovers FC', away: 'Queens United', venue: 'Frank Principe Park', kickoffAt: '2027-03-28T14:00:00', round: 15 },
  { home: 'Los Juga Vonitos', away: 'Mimar Sinan United', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-04-10T10:00:00', round: 16 },
  { home: 'Nexia Madrid', away: 'Borough Kings', venue: 'Kosmos Soccer Field', kickoffAt: '2027-04-10T11:00:00', round: 16 },
  { home: 'Momo FC', away: 'Malevolent Thorns FC', venue: 'Big Bush Park', kickoffAt: '2027-04-10T12:00:00', round: 16 },
  { home: '38 FC', away: 'Woodside Rovers FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-04-10T12:00:00', round: 16 },
  { home: 'Hispanics FC', away: 'Ilithios Malakas FC', venue: 'Big Bush Park', kickoffAt: '2027-04-10T14:00:00', round: 16 },
  { home: 'Beschissen FC', away: 'PS11 FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-04-10T14:00:00', round: 16 },
  { home: 'Venom FC', away: 'Beacon AFC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-04-11T11:00:00', round: 16 },
  { home: 'Malevolent Thorns FC', away: 'Ilithios Malakas FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-04-17T10:00:00', round: 17 },
  { home: 'Borough Kings', away: 'PS11 FC', venue: 'Big Bush Park', kickoffAt: '2027-04-17T12:00:00', round: 17 },
  { home: 'Beacon AFC', away: 'Nexia Madrid', venue: 'Jack Mcmanus Field', kickoffAt: '2027-04-17T12:00:00', round: 17 },
  { home: 'Momo FC', away: 'Los Juga Vonitos', venue: 'Big Bush Park', kickoffAt: '2027-04-17T14:00:00', round: 17 },
  { home: 'Mimar Sinan United', away: 'Beschissen FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-04-17T14:00:00', round: 17 },
  { home: 'Hispanics FC', away: '38 FC', venue: 'Big Bush Park', kickoffAt: '2027-04-18T12:00:00', round: 17 },
  { home: 'Queens United', away: 'Woodside Rovers FC', venue: 'Pal’s Oval', kickoffAt: '2027-04-18T14:00:00', round: 17 },
  { home: 'Malevolent Thorns FC', away: 'PS11 FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-04-24T10:00:00', round: 18 },
  { home: 'Ilithios Malakas FC', away: 'Momo FC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-04-24T11:00:00', round: 18 },
  { home: 'Borough Kings', away: 'Queens United', venue: 'Big Bush Park', kickoffAt: '2027-04-24T12:00:00', round: 18 },
  { home: 'Mimar Sinan United', away: 'Hispanics FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-04-24T12:00:00', round: 18 },
  { home: 'Beacon AFC', away: 'Woodside Rovers FC', venue: 'Jack Mcmanus Field', kickoffAt: '2027-04-24T14:00:00', round: 18 },
  { home: 'Los Juga Vonitos', away: 'Nexia Madrid', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-04-25T10:00:00', round: 18 },
  { home: 'Venom FC', away: 'Beschissen FC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-04-25T11:00:00', round: 18 },
  { home: 'Los Juga Vonitos', away: 'Ilithios Malakas FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-05-01T10:00:00', round: 19 },
  { home: 'Momo FC', away: 'Beschissen FC', venue: 'Big Bush Park', kickoffAt: '2027-05-01T12:00:00', round: 19 },
  { home: 'Mimar Sinan United', away: 'Borough Kings', venue: 'Jack Mcmanus Field', kickoffAt: '2027-05-01T12:00:00', round: 19 },
  { home: 'PS11 FC', away: 'Beacon AFC', venue: 'Big Bush Park', kickoffAt: '2027-05-01T14:00:00', round: 19 },
  { home: 'Malevolent Thorns FC', away: 'Hispanics FC', venue: 'Flushing Meadows Corona Park', kickoffAt: '2027-05-02T10:00:00', round: 19 },
  { home: 'Queens United', away: '38 FC', venue: 'Pal’s Oval', kickoffAt: '2027-05-02T14:00:00', round: 19 },
  { home: 'Woodside Rovers FC', away: 'Venom FC', venue: 'Frank Principe Park', kickoffAt: '2027-05-02T14:00:00', round: 19 },
  { home: 'Venom FC', away: 'Momo FC', venue: 'Kosmos Soccer Field', kickoffAt: '2027-05-08T11:00:00', round: 20 },
  { home: 'Hispanics FC', away: 'Woodside Rovers FC', venue: 'Big Bush Park', kickoffAt: '2027-05-08T12:00:00', round: 20 },
  { home: 'Beacon AFC', away: 'Los Juga Vonitos', venue: 'Jack Mcmanus Field', kickoffAt: '2027-05-08T12:00:00', round: 20 },
  { home: 'Borough Kings', away: 'Beschissen FC', venue: 'Big Bush Park', kickoffAt: '2027-05-08T14:00:00', round: 20 },
  { home: 'Mimar Sinan United', away: 'Nexia Madrid', venue: 'Jack Mcmanus Field', kickoffAt: '2027-05-08T14:00:00', round: 20 },
  { home: 'PS11 FC', away: '38 FC', venue: 'Big Bush Park', kickoffAt: '2027-05-09T12:00:00', round: 20 },
  { home: 'Queens United', away: 'Ilithios Malakas FC', venue: 'Pal’s Oval', kickoffAt: '2027-05-09T14:00:00', round: 20 },
];

// Real First Division 26-27 schedule (scraped from LeagueLobster) — 26 rounds,
// 182 fixtures, all unplayed. Same caveat as the other divisions: no rosters yet.
const firstDivisionMatches = [
  { home: 'Cloud FC', away: 'Hudson River SC', venue: 'Randalls Island', kickoffAt: '2026-08-29T10:00:00', round: 1 },
  { home: 'Labubu SC', away: 'Sunnyside FC', venue: 'St Michael\'s Field', kickoffAt: '2026-08-29T12:00:00', round: 1 },
  { home: 'Catalonia FC', away: 'Norwood United', venue: 'St Michael\'s Field', kickoffAt: '2026-08-29T14:00:00', round: 1 },
  { home: 'Elmhurst FC', away: 'P Ballers', venue: 'Frank Principe Park', kickoffAt: '2026-08-29T14:00:00', round: 1 },
  { home: 'Inter SC', away: '49 Antics', venue: 'Roberto Clemente State Park', kickoffAt: '2026-08-29T16:00:00', round: 1 },
  { home: 'LIC Brexits', away: 'Jerome Park FC', venue: 'Astoria Park', kickoffAt: '2026-08-29T16:30:00', round: 1 },
  { home: 'Rosedale FC', away: 'Club Atletico', venue: 'Randalls Island', kickoffAt: '2026-08-29T17:00:00', round: 1 },
  { home: 'Hudson River SC', away: 'Club Atletico', venue: 'St Michael\'s Field', kickoffAt: '2026-09-01T12:00:00', round: 2 },
  { home: 'Sunnyside FC', away: 'Cloud FC', venue: 'St Michael\'s Field', kickoffAt: '2026-09-01T14:00:00', round: 2 },
  { home: 'Elmhurst FC', away: 'Catalonia FC', venue: 'Frank Principe Park', kickoffAt: '2026-09-01T14:00:00', round: 2 },
  { home: 'P Ballers', away: 'LIC Brexits', venue: 'Calvert Vaux Park', kickoffAt: '2026-09-01T14:30:00', round: 2 },
  { home: 'Jerome Park FC', away: 'Inter SC', venue: 'Harlem River Park', kickoffAt: '2026-09-01T15:00:00', round: 2 },
  { home: 'Norwood United', away: 'Labubu SC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-01T16:00:00', round: 2 },
  { home: '49 Antics', away: 'Rosedale FC', venue: 'Harlem River Park', kickoffAt: '2026-09-02T15:00:00', round: 2 },
  { home: 'Cloud FC', away: 'Norwood United', venue: 'Randalls Island', kickoffAt: '2026-09-05T10:00:00', round: 3 },
  { home: 'Club Atletico', away: 'Sunnyside FC', venue: 'Highland Park', kickoffAt: '2026-09-05T11:20:00', round: 3 },
  { home: 'Labubu SC', away: 'Elmhurst FC', venue: 'St Michael\'s Field', kickoffAt: '2026-09-05T12:00:00', round: 3 },
  { home: 'Catalonia FC', away: 'LIC Brexits', venue: 'St Michael\'s Field', kickoffAt: '2026-09-05T14:00:00', round: 3 },
  { home: 'Inter SC', away: 'P Ballers', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-05T16:00:00', round: 3 },
  { home: 'Rosedale FC', away: 'Hudson River SC', venue: 'Randalls Island', kickoffAt: '2026-09-05T17:00:00', round: 3 },
  { home: '49 Antics', away: 'Jerome Park FC', venue: 'Harlem River Park', kickoffAt: '2026-09-06T16:00:00', round: 3 },
  { home: 'Sunnyside FC', away: 'Hudson River SC', venue: 'St Michael\'s Field', kickoffAt: '2026-09-19T12:00:00', round: 4 },
  { home: 'Elmhurst FC', away: 'Cloud FC', venue: 'Frank Principe Park', kickoffAt: '2026-09-19T14:00:00', round: 4 },
  { home: 'P Ballers', away: '49 Antics', venue: 'Calvert Vaux Park', kickoffAt: '2026-09-19T14:30:00', round: 4 },
  { home: 'Inter SC', away: 'Catalonia FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-19T15:00:00', round: 4 },
  { home: 'Jerome Park FC', away: 'Rosedale FC', venue: 'Harlem River Park', kickoffAt: '2026-09-19T15:00:00', round: 4 },
  { home: 'LIC Brexits', away: 'Labubu SC', venue: 'Astoria Park', kickoffAt: '2026-09-19T16:30:00', round: 4 },
  { home: 'Norwood United', away: 'Club Atletico', venue: 'Roberto Clemente State Park', kickoffAt: '2026-09-20T16:00:00', round: 4 },
  { home: 'Club Atletico', away: 'Elmhurst FC', venue: 'Highland Park', kickoffAt: '2026-10-10T11:20:00', round: 5 },
  { home: 'Hudson River SC', away: 'Norwood United', venue: 'St Michael\'s Field', kickoffAt: '2026-10-10T13:30:00', round: 5 },
  { home: 'Jerome Park FC', away: 'P Ballers', venue: 'Harlem River Park', kickoffAt: '2026-10-10T15:00:00', round: 5 },
  { home: 'Rosedale FC', away: 'Sunnyside FC', venue: 'Randalls Island', kickoffAt: '2026-10-10T17:00:00', round: 5 },
  { home: 'Catalonia FC', away: '49 Antics', venue: 'St Michael\'s Field', kickoffAt: '2026-10-11T14:00:00', round: 5 },
  { home: 'Cloud FC', away: 'LIC Brexits', venue: 'Randalls Island', kickoffAt: '2026-10-12T10:00:00', round: 5 },
  { home: 'Labubu SC', away: 'Inter SC', venue: 'St Michael\'s Field', kickoffAt: '2026-10-12T12:00:00', round: 5 },
  { home: 'Elmhurst FC', away: 'Hudson River SC', venue: 'Frank Principe Park', kickoffAt: '2026-11-07T14:00:00', round: 6 },
  { home: 'P Ballers', away: 'Rosedale FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-11-07T14:30:00', round: 6 },
  { home: 'Jerome Park FC', away: 'Catalonia FC', venue: 'Harlem River Park', kickoffAt: '2026-11-07T15:00:00', round: 6 },
  { home: 'Inter SC', away: 'Cloud FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-11-07T16:00:00', round: 6 },
  { home: 'LIC Brexits', away: 'Club Atletico', venue: 'Astoria Park', kickoffAt: '2026-11-07T16:30:00', round: 6 },
  { home: 'Norwood United', away: 'Sunnyside FC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-11-08T15:00:00', round: 6 },
  { home: '49 Antics', away: 'Labubu SC', venue: 'Harlem River Park', kickoffAt: '2026-11-08T16:00:00', round: 6 },
  { home: 'Club Atletico', away: 'Inter SC', venue: 'Highland Park', kickoffAt: '2026-11-14T11:20:00', round: 7 },
  { home: 'Labubu SC', away: 'Jerome Park FC', venue: 'St Michael\'s Field', kickoffAt: '2026-11-14T12:00:00', round: 7 },
  { home: 'Catalonia FC', away: 'P Ballers', venue: 'St Michael\'s Field', kickoffAt: '2026-11-14T14:00:00', round: 7 },
  { home: 'Rosedale FC', away: 'Norwood United', venue: 'Randalls Island', kickoffAt: '2026-11-14T17:00:00', round: 7 },
  { home: 'Cloud FC', away: '49 Antics', venue: 'Randalls Island', kickoffAt: '2026-11-15T10:00:00', round: 7 },
  { home: 'Sunnyside FC', away: 'Elmhurst FC', venue: 'St Michael\'s Field', kickoffAt: '2026-11-15T12:00:00', round: 7 },
  { home: 'Hudson River SC', away: 'LIC Brexits', venue: 'St Michael\'s Field', kickoffAt: '2026-11-15T14:00:00', round: 7 },
  { home: 'Catalonia FC', away: 'Rosedale FC', venue: 'St Michael\'s Field', kickoffAt: '2026-11-21T12:00:00', round: 8 },
  { home: 'Elmhurst FC', away: 'Norwood United', venue: 'Frank Principe Park', kickoffAt: '2026-11-21T14:00:00', round: 8 },
  { home: 'P Ballers', away: 'Labubu SC', venue: 'Calvert Vaux Park', kickoffAt: '2026-11-21T14:30:00', round: 8 },
  { home: 'Jerome Park FC', away: 'Cloud FC', venue: 'Harlem River Park', kickoffAt: '2026-11-21T15:00:00', round: 8 },
  { home: 'Inter SC', away: 'Hudson River SC', venue: 'Roberto Clemente State Park', kickoffAt: '2026-11-21T16:00:00', round: 8 },
  { home: 'LIC Brexits', away: 'Sunnyside FC', venue: 'Astoria Park', kickoffAt: '2026-11-21T16:30:00', round: 8 },
  { home: '49 Antics', away: 'Club Atletico', venue: 'Harlem River Park', kickoffAt: '2026-11-22T16:00:00', round: 8 },
  { home: 'Cloud FC', away: 'P Ballers', venue: 'Randalls Island', kickoffAt: '2026-11-28T10:00:00', round: 9 },
  { home: 'Club Atletico', away: 'Jerome Park FC', venue: 'Highland Park', kickoffAt: '2026-11-28T11:20:00', round: 9 },
  { home: 'Sunnyside FC', away: 'Inter SC', venue: 'St Michael\'s Field', kickoffAt: '2026-11-28T12:00:00', round: 9 },
  { home: 'Hudson River SC', away: '49 Antics', venue: 'St Michael\'s Field', kickoffAt: '2026-11-28T15:00:00', round: 9 },
  { home: 'Norwood United', away: 'LIC Brexits', venue: 'Roberto Clemente State Park', kickoffAt: '2026-11-28T16:00:00', round: 9 },
  { home: 'Rosedale FC', away: 'Elmhurst FC', venue: 'Randalls Island', kickoffAt: '2026-11-28T17:00:00', round: 9 },
  { home: 'Labubu SC', away: 'Catalonia FC', venue: 'St Michael\'s Field', kickoffAt: '2026-11-29T12:00:00', round: 9 },
  { home: 'Catalonia FC', away: 'Cloud FC', venue: 'St Michael\'s Field', kickoffAt: '2026-12-05T12:00:00', round: 10 },
  { home: 'P Ballers', away: 'Club Atletico', venue: 'Calvert Vaux Park', kickoffAt: '2026-12-05T14:30:00', round: 10 },
  { home: 'Jerome Park FC', away: 'Hudson River SC', venue: 'Harlem River Park', kickoffAt: '2026-12-05T15:00:00', round: 10 },
  { home: 'Inter SC', away: 'Norwood United', venue: 'Roberto Clemente State Park', kickoffAt: '2026-12-05T16:00:00', round: 10 },
  { home: 'LIC Brexits', away: 'Elmhurst FC', venue: 'Astoria Park', kickoffAt: '2026-12-05T16:30:00', round: 10 },
  { home: 'Labubu SC', away: 'Rosedale FC', venue: 'St Michael\'s Field', kickoffAt: '2026-12-06T12:00:00', round: 10 },
  { home: '49 Antics', away: 'Sunnyside FC', venue: 'Harlem River Park', kickoffAt: '2026-12-06T15:00:00', round: 10 },
  { home: 'Club Atletico', away: 'Catalonia FC', venue: 'Highland Park', kickoffAt: '2026-12-12T11:20:00', round: 11 },
  { home: 'Hudson River SC', away: 'P Ballers', venue: 'St Michael\'s Field', kickoffAt: '2026-12-12T12:00:00', round: 11 },
  { home: 'Elmhurst FC', away: 'Inter SC', venue: 'Frank Principe Park', kickoffAt: '2026-12-12T14:00:00', round: 11 },
  { home: 'Norwood United', away: '49 Antics', venue: 'Roberto Clemente State Park', kickoffAt: '2026-12-12T16:00:00', round: 11 },
  { home: 'Rosedale FC', away: 'LIC Brexits', venue: 'Randalls Island', kickoffAt: '2026-12-12T17:00:00', round: 11 },
  { home: 'Cloud FC', away: 'Labubu SC', venue: 'Randalls Island', kickoffAt: '2026-12-13T10:00:00', round: 11 },
  { home: 'Sunnyside FC', away: 'Jerome Park FC', venue: 'St Michael\'s Field', kickoffAt: '2026-12-13T14:00:00', round: 11 },
  { home: 'Catalonia FC', away: 'Hudson River SC', venue: 'St Michael\'s Field', kickoffAt: '2026-12-19T13:30:00', round: 12 },
  { home: 'P Ballers', away: 'Sunnyside FC', venue: 'Calvert Vaux Park', kickoffAt: '2026-12-19T14:30:00', round: 12 },
  { home: 'Jerome Park FC', away: 'Norwood United', venue: 'Harlem River Park', kickoffAt: '2026-12-19T15:00:00', round: 12 },
  { home: 'Inter SC', away: 'LIC Brexits', venue: 'Roberto Clemente State Park', kickoffAt: '2026-12-19T16:00:00', round: 12 },
  { home: 'Cloud FC', away: 'Rosedale FC', venue: 'Randalls Island', kickoffAt: '2026-12-20T10:00:00', round: 12 },
  { home: 'Labubu SC', away: 'Club Atletico', venue: 'St Michael\'s Field', kickoffAt: '2026-12-20T12:00:00', round: 12 },
  { home: '49 Antics', away: 'Elmhurst FC', venue: 'Harlem River Park', kickoffAt: '2026-12-20T15:00:00', round: 12 },
  { home: 'Club Atletico', away: 'Cloud FC', venue: 'Highland Park', kickoffAt: '2027-03-13T11:20:00', round: 13 },
  { home: 'Sunnyside FC', away: 'Catalonia FC', venue: 'St Michael\'s Field', kickoffAt: '2027-03-13T12:00:00', round: 13 },
  { home: 'Hudson River SC', away: 'Labubu SC', venue: 'St Michael\'s Field', kickoffAt: '2027-03-13T14:00:00', round: 13 },
  { home: 'Elmhurst FC', away: 'Jerome Park FC', venue: 'Frank Principe Park', kickoffAt: '2027-03-13T14:00:00', round: 13 },
  { home: 'Norwood United', away: 'P Ballers', venue: 'Roberto Clemente State Park', kickoffAt: '2027-03-13T16:00:00', round: 13 },
  { home: 'LIC Brexits', away: '49 Antics', venue: 'Astoria Park', kickoffAt: '2027-03-13T16:30:00', round: 13 },
  { home: 'Rosedale FC', away: 'Inter SC', venue: 'Randalls Island', kickoffAt: '2027-03-13T17:00:00', round: 13 },
  { home: 'Club Atletico', away: 'Rosedale FC', venue: 'Highland Park', kickoffAt: '2027-03-20T11:20:00', round: 14 },
  { home: 'Hudson River SC', away: 'Cloud FC', venue: 'St Michael\'s Field', kickoffAt: '2027-03-20T12:00:00', round: 14 },
  { home: 'P Ballers', away: 'Elmhurst FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-03-20T14:30:00', round: 14 },
  { home: 'Jerome Park FC', away: 'LIC Brexits', venue: 'Harlem River Park', kickoffAt: '2027-03-20T15:00:00', round: 14 },
  { home: 'Norwood United', away: 'Catalonia FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-03-20T16:00:00', round: 14 },
  { home: 'Sunnyside FC', away: 'Labubu SC', venue: 'St Michael\'s Field', kickoffAt: '2027-03-21T13:30:00', round: 14 },
  { home: '49 Antics', away: 'Inter SC', venue: 'Harlem River Park', kickoffAt: '2027-03-21T16:00:00', round: 14 },
  { home: 'Cloud FC', away: 'Sunnyside FC', venue: 'Randalls Island', kickoffAt: '2027-03-27T10:00:00', round: 15 },
  { home: 'Club Atletico', away: 'Hudson River SC', venue: 'Highland Park', kickoffAt: '2027-03-27T11:20:00', round: 15 },
  { home: 'Labubu SC', away: 'Norwood United', venue: 'St Michael\'s Field', kickoffAt: '2027-03-27T12:00:00', round: 15 },
  { home: 'Catalonia FC', away: 'Elmhurst FC', venue: 'St Michael\'s Field', kickoffAt: '2027-03-27T14:00:00', round: 15 },
  { home: 'Inter SC', away: 'Jerome Park FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-03-27T16:00:00', round: 15 },
  { home: 'LIC Brexits', away: 'P Ballers', venue: 'Astoria Park', kickoffAt: '2027-03-27T16:30:00', round: 15 },
  { home: 'Rosedale FC', away: '49 Antics', venue: 'Randalls Island', kickoffAt: '2027-03-27T17:00:00', round: 15 },
  { home: 'Sunnyside FC', away: 'Club Atletico', venue: 'St Michael\'s Field', kickoffAt: '2027-04-03T12:00:00', round: 16 },
  { home: 'Hudson River SC', away: 'Rosedale FC', venue: 'St Michael\'s Field', kickoffAt: '2027-04-03T14:00:00', round: 16 },
  { home: 'Elmhurst FC', away: 'Labubu SC', venue: 'Frank Principe Park', kickoffAt: '2027-04-03T14:00:00', round: 16 },
  { home: 'P Ballers', away: 'Inter SC', venue: 'Calvert Vaux Park', kickoffAt: '2027-04-03T14:30:00', round: 16 },
  { home: 'Jerome Park FC', away: '49 Antics', venue: 'Harlem River Park', kickoffAt: '2027-04-03T15:00:00', round: 16 },
  { home: 'Norwood United', away: 'Cloud FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-04-03T16:00:00', round: 16 },
  { home: 'LIC Brexits', away: 'Catalonia FC', venue: 'Astoria Park', kickoffAt: '2027-04-03T16:30:00', round: 16 },
  { home: 'Cloud FC', away: 'Elmhurst FC', venue: 'Randalls Island', kickoffAt: '2027-04-10T10:00:00', round: 17 },
  { home: 'Club Atletico', away: 'Norwood United', venue: 'Highland Park', kickoffAt: '2027-04-10T11:20:00', round: 17 },
  { home: 'Labubu SC', away: 'LIC Brexits', venue: 'St Michael\'s Field', kickoffAt: '2027-04-10T12:00:00', round: 17 },
  { home: 'Catalonia FC', away: 'Inter SC', venue: 'St Michael\'s Field', kickoffAt: '2027-04-10T14:00:00', round: 17 },
  { home: 'Rosedale FC', away: 'Jerome Park FC', venue: 'Randalls Island', kickoffAt: '2027-04-10T17:00:00', round: 17 },
  { home: 'Hudson River SC', away: 'Sunnyside FC', venue: 'St Michael\'s Field', kickoffAt: '2027-04-11T15:00:00', round: 17 },
  { home: '49 Antics', away: 'P Ballers', venue: 'Harlem River Park', kickoffAt: '2027-04-11T16:00:00', round: 17 },
  { home: 'Sunnyside FC', away: 'Rosedale FC', venue: 'St Michael\'s Field', kickoffAt: '2027-04-17T12:00:00', round: 18 },
  { home: 'Elmhurst FC', away: 'Club Atletico', venue: 'Frank Principe Park', kickoffAt: '2027-04-17T14:00:00', round: 18 },
  { home: 'P Ballers', away: 'Jerome Park FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-04-17T14:30:00', round: 18 },
  { home: 'Norwood United', away: 'Hudson River SC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-04-17T16:00:00', round: 18 },
  { home: 'LIC Brexits', away: 'Cloud FC', venue: 'Astoria Park', kickoffAt: '2027-04-17T16:30:00', round: 18 },
  { home: 'Inter SC', away: 'Labubu SC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-04-18T15:00:00', round: 18 },
  { home: '49 Antics', away: 'Catalonia FC', venue: 'Harlem River Park', kickoffAt: '2027-04-18T16:00:00', round: 18 },
  { home: 'Club Atletico', away: 'LIC Brexits', venue: 'Highland Park', kickoffAt: '2027-04-24T11:20:00', round: 19 },
  { home: 'Hudson River SC', away: 'Elmhurst FC', venue: 'St Michael\'s Field', kickoffAt: '2027-04-24T12:00:00', round: 19 },
  { home: 'Catalonia FC', away: 'Jerome Park FC', venue: 'St Michael\'s Field', kickoffAt: '2027-04-24T15:00:00', round: 19 },
  { home: 'Rosedale FC', away: 'P Ballers', venue: 'Randalls Island', kickoffAt: '2027-04-24T17:00:00', round: 19 },
  { home: 'Cloud FC', away: 'Inter SC', venue: 'Randalls Island', kickoffAt: '2027-04-25T10:00:00', round: 19 },
  { home: 'Sunnyside FC', away: 'Norwood United', venue: 'St Michael\'s Field', kickoffAt: '2027-04-25T12:00:00', round: 19 },
  { home: 'Labubu SC', away: '49 Antics', venue: 'St Michael\'s Field', kickoffAt: '2027-04-25T14:00:00', round: 19 },
  { home: 'Elmhurst FC', away: 'Sunnyside FC', venue: 'Frank Principe Park', kickoffAt: '2027-05-01T14:00:00', round: 20 },
  { home: 'P Ballers', away: 'Catalonia FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-01T14:30:00', round: 20 },
  { home: 'Jerome Park FC', away: 'Labubu SC', venue: 'Harlem River Park', kickoffAt: '2027-05-01T15:00:00', round: 20 },
  { home: 'Norwood United', away: 'Rosedale FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-05-01T16:00:00', round: 20 },
  { home: 'LIC Brexits', away: 'Hudson River SC', venue: 'Astoria Park', kickoffAt: '2027-05-01T16:30:00', round: 20 },
  { home: 'Inter SC', away: 'Club Atletico', venue: 'Roberto Clemente State Park', kickoffAt: '2027-05-02T15:00:00', round: 20 },
  { home: '49 Antics', away: 'Cloud FC', venue: 'Harlem River Park', kickoffAt: '2027-05-02T16:00:00', round: 20 },
  { home: 'Cloud FC', away: 'Jerome Park FC', venue: 'Randalls Island', kickoffAt: '2027-05-08T10:00:00', round: 21 },
  { home: 'Club Atletico', away: '49 Antics', venue: 'Highland Park', kickoffAt: '2027-05-08T11:20:00', round: 21 },
  { home: 'Sunnyside FC', away: 'LIC Brexits', venue: 'St Michael\'s Field', kickoffAt: '2027-05-08T12:00:00', round: 21 },
  { home: 'Labubu SC', away: 'P Ballers', venue: 'St Michael\'s Field', kickoffAt: '2027-05-08T15:00:00', round: 21 },
  { home: 'Norwood United', away: 'Elmhurst FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-05-08T16:00:00', round: 21 },
  { home: 'Rosedale FC', away: 'Catalonia FC', venue: 'Randalls Island', kickoffAt: '2027-05-08T17:00:00', round: 21 },
  { home: 'Catalonia FC', away: 'Labubu SC', venue: 'St Michael\'s Field', kickoffAt: '2027-05-15T12:00:00', round: 22 },
  { home: 'Elmhurst FC', away: 'Rosedale FC', venue: 'Frank Principe Park', kickoffAt: '2027-05-15T14:00:00', round: 22 },
  { home: 'P Ballers', away: 'Cloud FC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-15T14:30:00', round: 22 },
  { home: 'Jerome Park FC', away: 'Club Atletico', venue: 'Harlem River Park', kickoffAt: '2027-05-15T15:00:00', round: 22 },
  { home: 'Inter SC', away: 'Sunnyside FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-05-15T16:00:00', round: 22 },
  { home: 'LIC Brexits', away: 'Norwood United', venue: 'Astoria Park', kickoffAt: '2027-05-15T16:30:00', round: 22 },
  { home: 'Hudson River SC', away: 'Inter SC', venue: 'St Michael\'s Field', kickoffAt: '2027-05-16T13:30:00', round: 22 },
  { home: '49 Antics', away: 'Hudson River SC', venue: 'Harlem River Park', kickoffAt: '2027-05-16T16:00:00', round: 22 },
  { home: 'Cloud FC', away: 'Catalonia FC', venue: 'Randalls Island', kickoffAt: '2027-05-22T10:00:00', round: 23 },
  { home: 'Club Atletico', away: 'P Ballers', venue: 'Highland Park', kickoffAt: '2027-05-22T11:20:00', round: 23 },
  { home: 'Sunnyside FC', away: '49 Antics', venue: 'St Michael\'s Field', kickoffAt: '2027-05-22T12:00:00', round: 23 },
  { home: 'Hudson River SC', away: 'Jerome Park FC', venue: 'St Michael\'s Field', kickoffAt: '2027-05-22T14:00:00', round: 23 },
  { home: 'Elmhurst FC', away: 'LIC Brexits', venue: 'Frank Principe Park', kickoffAt: '2027-05-22T14:00:00', round: 23 },
  { home: 'Norwood United', away: 'Inter SC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-05-22T16:00:00', round: 23 },
  { home: 'Rosedale FC', away: 'Labubu SC', venue: 'Randalls Island', kickoffAt: '2027-05-22T17:00:00', round: 23 },
  { home: 'Catalonia FC', away: 'Club Atletico', venue: 'St Michael\'s Field', kickoffAt: '2027-05-29T12:00:00', round: 24 },
  { home: 'P Ballers', away: 'Hudson River SC', venue: 'Calvert Vaux Park', kickoffAt: '2027-05-29T14:30:00', round: 24 },
  { home: 'Jerome Park FC', away: 'Sunnyside FC', venue: 'Harlem River Park', kickoffAt: '2027-05-29T15:00:00', round: 24 },
  { home: 'Inter SC', away: 'Elmhurst FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-05-29T16:00:00', round: 24 },
  { home: 'LIC Brexits', away: 'Rosedale FC', venue: 'Astoria Park', kickoffAt: '2027-05-29T16:30:00', round: 24 },
  { home: 'Labubu SC', away: 'Cloud FC', venue: 'St Michael\'s Field', kickoffAt: '2027-05-30T12:00:00', round: 24 },
  { home: '49 Antics', away: 'Norwood United', venue: 'Harlem River Park', kickoffAt: '2027-05-30T16:00:00', round: 24 },
  { home: 'Rosedale FC', away: 'Cloud FC', venue: 'Randalls Island', kickoffAt: '2027-06-05T10:00:00', round: 25 },
  { home: 'Club Atletico', away: 'Labubu SC', venue: 'Highland Park', kickoffAt: '2027-06-05T11:20:00', round: 25 },
  { home: 'Sunnyside FC', away: 'P Ballers', venue: 'St Michael\'s Field', kickoffAt: '2027-06-05T12:00:00', round: 25 },
  { home: 'Hudson River SC', away: 'Catalonia FC', venue: 'St Michael\'s Field', kickoffAt: '2027-06-05T14:00:00', round: 25 },
  { home: 'Elmhurst FC', away: '49 Antics', venue: 'Frank Principe Park', kickoffAt: '2027-06-05T14:00:00', round: 25 },
  { home: 'Norwood United', away: 'Jerome Park FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-06-05T16:00:00', round: 25 },
  { home: 'LIC Brexits', away: 'Inter SC', venue: 'Astoria Park', kickoffAt: '2027-06-05T16:30:00', round: 25 },
  { home: 'P Ballers', away: 'Norwood United', venue: 'Calvert Vaux Park', kickoffAt: '2027-06-12T15:00:00', round: 26 },
  { home: 'Cloud FC', away: 'Club Atletico', venue: 'Randalls Island', kickoffAt: '2027-06-12T15:00:00', round: 26 },
  { home: '49 Antics', away: 'LIC Brexits', venue: 'Randalls Island', kickoffAt: '2027-06-12T15:00:00', round: 26 },
  { home: 'Inter SC', away: 'Rosedale FC', venue: 'Roberto Clemente State Park', kickoffAt: '2027-06-12T15:00:00', round: 26 },
  { home: 'Labubu SC', away: 'Hudson River SC', venue: 'St Michael\'s Field', kickoffAt: '2027-06-12T15:00:00', round: 26 },
  { home: 'Catalonia FC', away: 'Sunnyside FC', venue: 'Astoria Park', kickoffAt: '2027-06-12T15:00:00', round: 26 },
  { home: 'Jerome Park FC', away: 'Elmhurst FC', venue: 'Harlem River Park', kickoffAt: '2027-06-12T15:00:00', round: 26 },
];

function toMatchRow(m, division, competition) {
  return {
    home: m.home,
    away: m.away,
    homeScore: 0,
    awayScore: 0,
    status: 'upcoming',
    division,
    competition,
    venue: m.venue,
    kickoffAt: m.kickoffAt,
  };
}

const matches = [
  ...brooklynMatches.map((m) => toMatchRow(m, 'brooklyn', 'Brooklyn Division')),
  ...bronxMatches.map((m) => toMatchRow(m, 'bronx', 'Bronx Division')),
  ...queensMatches.map((m) => toMatchRow(m, 'queens', 'Queens Division')),
  ...firstDivisionMatches.map((m) => toMatchRow(m, 'first', 'First Division')),
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
    insertUser.run(email, hashPassword('password123'), teamIdByName[team.name], 'coach_manager');
  }

  console.log('Seeded users table.');
} else {
  console.log('Users table already has data, skipping.');
}

const { count: directorCount } = db
  .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'league_director'")
  .get();

if (directorCount === 0) {
  db.prepare('INSERT INTO users (email, password_hash, team_id, role) VALUES (?, ?, ?, ?)').run(
    'director@blsleague.com',
    hashPassword('password123'),
    null,
    'league_director'
  );
  console.log('Seeded league_director account.');
} else {
  console.log('league_director account already exists, skipping.');
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

function refereeSlug(name) {
  return name.replace(/[^a-zA-Z]/g, '').toLowerCase();
}

const { count: refereeUserCount } = db
  .prepare("SELECT COUNT(*) AS count FROM users WHERE role = 'referee'")
  .get();

if (refereeUserCount === 0) {
  const insertRefUser = db.prepare(
    'INSERT INTO users (email, password_hash, team_id, role, referee_id) VALUES (?, ?, ?, ?, ?)'
  );
  const refereeRows = db.prepare('SELECT id, name FROM referees').all();
  for (const referee of refereeRows) {
    const email = `${refereeSlug(referee.name)}@blsreferees.com`;
    insertRefUser.run(email, hashPassword('password123'), null, 'referee', referee.id);
  }
  console.log('Seeded referee login accounts.');
} else {
  console.log('Referee login accounts already exist, skipping.');
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
