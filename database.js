const { DatabaseSync } = require('node:sqlite');

const db = new DatabaseSync('bls.db');

db.exec('PRAGMA foreign_keys = ON');

db.exec(`
  CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    borough TEXT NOT NULL,
    points INTEGER NOT NULL DEFAULT 0
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS players (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    goals INTEGER NOT NULL DEFAULT 0,
    assists INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS matches (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    home_team_id INTEGER NOT NULL,
    away_team_id INTEGER NOT NULL,
    home_score INTEGER NOT NULL DEFAULT 0,
    away_score INTEGER NOT NULL DEFAULT 0,
    status TEXT NOT NULL DEFAULT 'upcoming',
    FOREIGN KEY (home_team_id) REFERENCES teams (id),
    FOREIGN KEY (away_team_id) REFERENCES teams (id)
  )
`);

function addColumnIfMissing(table, column, definition) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some((col) => col.name === column);
  if (!exists) {
    db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
  }
}

addColumnIfMissing('teams', 'division', 'TEXT');

addColumnIfMissing('matches', 'division', 'TEXT');
addColumnIfMissing('matches', 'competition', 'TEXT');
addColumnIfMissing('matches', 'venue', 'TEXT');
addColumnIfMissing('matches', 'kickoff_at', 'TEXT');

addColumnIfMissing('players', 'position', 'TEXT');
addColumnIfMissing('players', 'number', 'INTEGER');
addColumnIfMissing('players', 'apps', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'yellow_cards', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'red_cards', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'clean_sheets', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'rating', 'INTEGER');

addColumnIfMissing('matches', 'formation', 'TEXT');

db.exec("UPDATE matches SET status = 'upcoming' WHERE status = 'scheduled'");
db.exec("UPDATE matches SET status = 'ft' WHERE status = 'final'");

db.exec(`
  CREATE TABLE IF NOT EXISTS match_events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    type TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    player_name TEXT NOT NULL,
    detail TEXT,
    FOREIGN KEY (match_id) REFERENCES matches (id),
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_lineups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    team_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    num INTEGER NOT NULL,
    pos TEXT NOT NULL,
    is_starting INTEGER NOT NULL DEFAULT 1,
    FOREIGN KEY (match_id) REFERENCES matches (id),
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (player_id) REFERENCES players (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_clips (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    minute INTEGER NOT NULL,
    title TEXT NOT NULL,
    views_count INTEGER NOT NULL DEFAULT 0,
    tag TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches (id),
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS motm_candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    player_id INTEGER NOT NULL,
    blurb TEXT,
    votes INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (match_id) REFERENCES matches (id),
    FOREIGN KEY (player_id) REFERENCES players (id)
  )
`);

module.exports = db;
