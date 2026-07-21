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

function dropColumnIfExists(table, column) {
  const columns = db.prepare(`PRAGMA table_info(${table})`).all();
  const exists = columns.some((col) => col.name === column);
  if (exists) {
    db.exec(`ALTER TABLE ${table} DROP COLUMN ${column}`);
  }
}

addColumnIfMissing('teams', 'division', 'TEXT');
addColumnIfMissing('teams', 'logo_url', 'TEXT');

addColumnIfMissing('matches', 'division', 'TEXT');
addColumnIfMissing('matches', 'competition', 'TEXT');
addColumnIfMissing('matches', 'venue', 'TEXT');
addColumnIfMissing('matches', 'kickoff_at', 'TEXT');
addColumnIfMissing('matches', 'is_motw', 'INTEGER NOT NULL DEFAULT 0');

addColumnIfMissing('players', 'position', 'TEXT');
addColumnIfMissing('players', 'number', 'INTEGER');
addColumnIfMissing('players', 'apps', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'yellow_cards', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'red_cards', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'clean_sheets', "INTEGER NOT NULL DEFAULT 0");
addColumnIfMissing('players', 'rating', 'INTEGER');
addColumnIfMissing('players', 'status', "TEXT NOT NULL DEFAULT 'available'");

// A match has one formation per side, not one shared value — replaces the
// single `formation` column Phase 2 started with.
dropColumnIfExists('matches', 'formation');
addColumnIfMissing('matches', 'home_formation', 'TEXT');
addColumnIfMissing('matches', 'away_formation', 'TEXT');

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

addColumnIfMissing('match_clips', 'is_gotw_candidate', 'INTEGER NOT NULL DEFAULT 0');
addColumnIfMissing('match_clips', 'gotw_votes', 'INTEGER NOT NULL DEFAULT 0');

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

db.exec(`
  CREATE TABLE IF NOT EXISTS potw_candidates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    votes INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (player_id) REFERENCES players (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS totw_picks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    player_id INTEGER NOT NULL,
    FOREIGN KEY (player_id) REFERENCES players (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    email TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    team_id INTEGER NOT NULL,
    role TEXT NOT NULL,
    FOREIGN KEY (team_id) REFERENCES teams (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    token TEXT PRIMARY KEY,
    user_id INTEGER NOT NULL,
    expires_at TEXT NOT NULL,
    FOREIGN KEY (user_id) REFERENCES users (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS referees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    level TEXT NOT NULL,
    available INTEGER NOT NULL DEFAULT 1
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS match_referees (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    match_id INTEGER NOT NULL,
    referee_id INTEGER NOT NULL,
    FOREIGN KEY (match_id) REFERENCES matches (id),
    FOREIGN KEY (referee_id) REFERENCES referees (id),
    UNIQUE (match_id, referee_id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS venues (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    borough TEXT NOT NULL,
    photo TEXT,
    fields_json TEXT NOT NULL,
    parking TEXT,
    cleats TEXT
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS friendly_requests (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    date TEXT NOT NULL,
    time TEXT NOT NULL,
    venue_id INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (team_id) REFERENCES teams (id),
    FOREIGN KEY (venue_id) REFERENCES venues (id)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS bulletins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS friendly_invites (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    request_id INTEGER NOT NULL,
    inviting_team_id INTEGER NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (request_id) REFERENCES friendly_requests (id),
    FOREIGN KEY (inviting_team_id) REFERENCES teams (id),
    UNIQUE (request_id, inviting_team_id)
  )
`);

module.exports = db;
