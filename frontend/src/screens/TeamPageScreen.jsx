import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Crest from '../Crest.jsx';

const DIVISION_LABELS = { queens: 'Queens Division', bronx: 'Bronx Division' };

export default function TeamPageScreen({ teamId, onClose, onSelectMatch }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setData(null);
    setError(null);
    api.getTeam(teamId).then(setData).catch((err) => setError(err.message));
  }, [teamId]);

  if (error) return <div className="state-message error">Failed to load: {error}</div>;
  if (!data) return <div className="state-message">Loading team…</div>;

  const { team, rank, pts, gp, gd, results } = data;
  const gdText = gd > 0 ? `+${gd}` : `${gd}`;

  return (
    <div className="team-page">
      <button className="close-button" onClick={onClose}>
        ← Back
      </button>

      <div className="team-page-header">
        <Crest src={team.logo_url} size={64} />
        <div className="team-page-name">{team.name}</div>
        <div className="team-page-meta">
          {DIVISION_LABELS[team.division] ?? team.division} · Rank {rank}
        </div>
      </div>

      <div className="team-page-stats-row">
        <div className="dashboard-stat">
          <div className="dashboard-stat-val">{pts}</div>
          <div className="dashboard-stat-label">PTS</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-val">{gp}</div>
          <div className="dashboard-stat-label">PLAYED</div>
        </div>
        <div className="dashboard-stat">
          <div className={`dashboard-stat-val ${gd < 0 ? 'stat-danger' : ''}`}>{gdText}</div>
          <div className="dashboard-stat-label">GD</div>
        </div>
      </div>

      <div className="leaderboard-section-title">PAST RESULTS</div>
      <div className="team-page-results">
        {results.length === 0 && <div className="state-message">No results yet.</div>}
        {results.map((r) => (
          <button
            key={r.matchId}
            className="team-page-result-row"
            onClick={() => onSelectMatch(r.matchId)}
          >
            <div className={`team-page-result-letter result-${r.resultLetter}`}>
              {r.resultLetter}
            </div>
            <Crest src={r.opponent.logoUrl} size={22} />
            <div className="team-page-result-info">
              <div className="team-page-result-opponent">
                {r.vsLabel} {r.opponent.name}
              </div>
              <div className="team-page-result-competition">{r.competition}</div>
            </div>
            <div className="team-page-result-score">{r.scoreText}</div>
          </button>
        ))}
      </div>
    </div>
  );
}
