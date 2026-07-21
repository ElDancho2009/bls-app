import { useEffect, useState } from 'react';
import { api } from '../api.js';

function statColumns(player) {
  if (player.position === 'GK') {
    return [
      { label: 'CS', val: player.clean_sheets },
      { label: 'APP', val: player.apps },
      { label: 'YC', val: player.yellow_cards },
      { label: 'RC', val: player.red_cards },
    ];
  }
  return [
    { label: 'G', val: player.goals },
    { label: 'A', val: player.assists },
    { label: 'APP', val: player.apps },
    { label: 'YC', val: player.yellow_cards },
  ];
}

function tierClass(rating) {
  if (rating >= 88) return 'tier-gold';
  if (rating >= 83) return 'tier-silver';
  return 'tier-bronze';
}

export default function CardsScreen() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getPlayers(), api.getTeams()])
      .then(([playersData, teamsData]) => {
        setPlayers(playersData);
        setTeams(teamsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-message">Loading player cards…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const sorted = [...players].sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));

  return (
    <div className="cards-screen">
      <header className="screen-header">
        <div className="brand-title">PLAYER CARDS</div>
        <div className="screen-subtitle">All registered players, by rating</div>
      </header>

      <div className="card-list">
        {sorted.map((player) => {
          const team = teamsById[player.team_id];
          return (
            <div key={player.id} className={`player-card ${tierClass(player.rating)}`}>
              <div className="player-card-top">
                <div className="player-rating-badge">{player.rating}</div>
                <div className="player-card-info">
                  <div className="player-card-name">{player.name}</div>
                  <div className="player-card-meta">
                    {team?.name} · {player.position}
                  </div>
                </div>
                <div className="player-card-number">#{player.number}</div>
              </div>
              <div className="player-card-stats">
                {statColumns(player).map((stat) => (
                  <div key={stat.label} className="player-stat">
                    <div className="player-stat-val">{stat.val}</div>
                    <div className="player-stat-label">{stat.label}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
