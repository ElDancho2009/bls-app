const db = require('./database.js');

function recalculateTeamPoints(teamId) {
  const row = db
    .prepare(
      `SELECT
         SUM(
           CASE
             WHEN (home_team_id = ? AND home_score > away_score)
               OR (away_team_id = ? AND away_score > home_score) THEN 3
             WHEN home_score = away_score THEN 1
             ELSE 0
           END
         ) AS points
       FROM matches
       WHERE status = 'ft' AND (home_team_id = ? OR away_team_id = ?)`
    )
    .get(teamId, teamId, teamId, teamId);

  const points = row.points ?? 0;
  db.prepare('UPDATE teams SET points = ? WHERE id = ?').run(points, teamId);
}

module.exports = { recalculateTeamPoints };
