import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

export default function VerifyPlayersScreen() {
  const { token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([api.getPlayers(), api.getTeams()])
      .then(([playersData, teamsData]) => {
        setPlayers(playersData);
        setTeamsById(Object.fromEntries(teamsData.map((t) => [t.id, t])));
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function toggleVerified(player) {
    const updated = await api.verifyPlayer(player.id, !player.verified, token);
    setPlayers((prev) => prev.map((p) => (p.id === updated.id ? updated : p)));
  }

  if (loading) return <div className="state-message">Loading players…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  return (
    <div className="squad-screen">
      {players.map((player) => (
        <div key={player.id} className="squad-row">
          <div className="squad-num">{player.number}</div>
          <div className="squad-info">
            <div className="squad-name">{player.name}</div>
            <div className="squad-pos">
              {teamsById[player.team_id]?.name} · {player.position}
            </div>
          </div>
          <button
            className={`squad-status-toggle ${
              player.verified ? 'status-available' : 'status-injured'
            }`}
            onClick={() => toggleVerified(player)}
          >
            {player.verified ? 'Verified' : 'Unverified'}
          </button>
        </div>
      ))}
    </div>
  );
}
