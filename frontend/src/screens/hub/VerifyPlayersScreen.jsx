import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { useToast } from '../../ToastContext.jsx';
import { api } from '../../api.js';
import EmptyState from '../../EmptyState.jsx';

const FILTERS = [
  { key: 'pending', label: 'Pending' },
  { key: 'all', label: 'All' },
];

function VerifiedIcon() {
  return (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function VerifyPlayersScreen() {
  const { token } = useAuth();
  const showToast = useToast();
  const [players, setPlayers] = useState([]);
  const [teamsById, setTeamsById] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('pending');

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
    if (updated.verified) showToast('Player eligibility verified');
  }

  const visiblePlayers = useMemo(
    () => (filter === 'pending' ? players.filter((p) => !p.verified) : players),
    [players, filter]
  );

  if (loading) return <div className="state-message">Loading players…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  return (
    <div className="squad-screen">
      <div className="chip-row">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            className={`chip ${filter === f.key ? 'chip-active' : ''}`}
            onClick={() => setFilter(f.key)}
          >
            {f.label}
          </button>
        ))}
      </div>

      {visiblePlayers.length === 0 && (
        <EmptyState
          icon={<VerifiedIcon />}
          title={
            filter === 'pending'
              ? 'All rostered players are verified!'
              : 'No players have been added yet.'
          }
        />
      )}

      {visiblePlayers.map((player) => (
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
