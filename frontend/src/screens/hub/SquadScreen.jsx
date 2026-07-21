import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

export default function SquadScreen() {
  const { team, token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!team) return;
    api
      .getPlayers(team.id)
      .then(setPlayers)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [team]);

  async function toggleStatus(player) {
    const nextStatus = player.status === 'injured' ? 'available' : 'injured';
    const updated = await api.patchPlayerStatus(player.id, nextStatus, token);
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  if (loading) return <div className="state-message">Loading squad…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  return (
    <div className="squad-screen">
      {players.map((player) => (
        <div key={player.id} className="squad-row">
          <div className="squad-num">{player.number}</div>
          <div className="squad-info">
            <div className="squad-name">{player.name}</div>
            <div className="squad-pos">{player.position}</div>
          </div>
          <button
            className={`squad-status-toggle ${
              player.status === 'injured' ? 'status-injured' : 'status-available'
            }`}
            onClick={() => toggleStatus(player)}
          >
            {player.status === 'injured' ? 'Injured' : 'Available'}
          </button>
        </div>
      ))}
    </div>
  );
}
