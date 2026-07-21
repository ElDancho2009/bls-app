import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

const POSITIONS = ['GK', 'DF', 'MF', 'FW'];

export default function SquadScreen() {
  const { team, token } = useAuth();
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [name, setName] = useState('');
  const [number, setNumber] = useState('');
  const [position, setPosition] = useState(POSITIONS[0]);
  const [adding, setAdding] = useState(false);
  const [addError, setAddError] = useState(null);

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

  async function handleAddPlayer() {
    if (!name.trim() || !number) return;
    setAdding(true);
    setAddError(null);
    try {
      const created = await api.createPlayer(
        { name: name.trim(), number: Number(number), position, teamId: team.id },
        token
      );
      setPlayers((prev) => [...prev, created]);
      setName('');
      setNumber('');
      setPosition(POSITIONS[0]);
    } catch (err) {
      setAddError(err.message);
    } finally {
      setAdding(false);
    }
  }

  if (loading) return <div className="state-message">Loading squad…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  return (
    <div className="squad-screen">
      <div className="squad-row">
        <input
          className="ref-sheet-pin-input"
          style={{ flex: 2, letterSpacing: 'normal', fontSize: '1rem' }}
          placeholder="Player name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="ref-sheet-pin-input"
          style={{ flex: 1, letterSpacing: 'normal', fontSize: '1rem' }}
          placeholder="#"
          type="number"
          min="1"
          max="99"
          value={number}
          onChange={(e) => setNumber(e.target.value)}
        />
        <select value={position} onChange={(e) => setPosition(e.target.value)}>
          {POSITIONS.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
        <button
          className="squad-status-toggle status-available"
          onClick={handleAddPlayer}
          disabled={adding || !name.trim() || !number}
        >
          {adding ? 'Adding…' : 'Add Player'}
        </button>
      </div>
      {addError && <div className="state-message error">{addError}</div>}

      {players.map((player) => (
        <div key={player.id} className="squad-row">
          <div className="squad-num">{player.number}</div>
          <div className="squad-info">
            <div className="squad-name">
              {player.name}
              {!player.verified && <span className="bulletin-badge">UNVERIFIED</span>}
            </div>
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
