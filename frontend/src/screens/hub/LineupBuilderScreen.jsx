import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

export const FORMATION_SLOTS = [
  { key: 'GK', group: 'GK', num: 1, x: 50, y: 90 },
  { key: 'LB', group: 'DF', num: 2, x: 16, y: 72 },
  { key: 'CB1', group: 'DF', num: 3, x: 38, y: 76 },
  { key: 'CB2', group: 'DF', num: 4, x: 62, y: 76 },
  { key: 'RB', group: 'DF', num: 5, x: 84, y: 72 },
  { key: 'LM', group: 'MF', num: 6, x: 22, y: 50 },
  { key: 'CM', group: 'MF', num: 7, x: 50, y: 54 },
  { key: 'RM', group: 'MF', num: 8, x: 78, y: 50 },
  { key: 'LW', group: 'FW', num: 9, x: 20, y: 24 },
  { key: 'ST', group: 'FW', num: 10, x: 50, y: 16 },
  { key: 'RW', group: 'FW', num: 11, x: 80, y: 24 },
];

export default function LineupBuilderScreen() {
  const { team, token } = useAuth();
  const [nextMatch, setNextMatch] = useState(null);
  const [roster, setRoster] = useState([]);
  const [lineup, setLineup] = useState({ slots: {}, bench: [] });
  const [draggingId, setDraggingId] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [saveState, setSaveState] = useState('idle');

  useEffect(() => {
    if (!team) return;
    let cancelled = false;

    async function load() {
      try {
        const [matches, players] = await Promise.all([api.getMatches(), api.getPlayers(team.id)]);
        const next = matches
          .filter(
            (m) =>
              (m.status === 'upcoming' || m.status === 'live') &&
              (m.home_team_id === team.id || m.away_team_id === team.id)
          )
          .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))[0];

        if (!next) {
          if (!cancelled) {
            setRoster(players);
            setLineup({ slots: {}, bench: players.map((p) => p.id) });
            setLoading(false);
          }
          return;
        }

        const detail = await api.getMatch(next.id);
        const isHome = next.home_team_id === team.id;
        const existingRows = isHome ? detail.lineups.home : detail.lineups.away;

        const byGroup = { GK: [], DF: [], MF: [], FW: [] };
        for (const row of existingRows) {
          byGroup[row.pos]?.push(row.player_id);
        }
        Object.values(byGroup).forEach((arr) => arr.sort((a, b) => a - b));

        const initialSlots = {};
        const usedIds = new Set();
        for (const slot of FORMATION_SLOTS) {
          const playerId = byGroup[slot.group]?.shift();
          if (playerId) {
            initialSlots[slot.key] = playerId;
            usedIds.add(playerId);
          }
        }

        if (!cancelled) {
          setNextMatch(next);
          setRoster(players);
          setLineup({
            slots: initialSlots,
            bench: players.filter((p) => !usedIds.has(p.id)).map((p) => p.id),
          });
          setLoading(false);
        }
      } catch (err) {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [team]);

  const playersById = useMemo(() => Object.fromEntries(roster.map((p) => [p.id, p])), [roster]);

  function dropOnSlot(slotKey) {
    if (!draggingId) return;
    setLineup((prev) => {
      const slots = { ...prev.slots };
      for (const key of Object.keys(slots)) {
        if (slots[key] === draggingId) delete slots[key];
      }
      const displaced = slots[slotKey];
      slots[slotKey] = draggingId;
      let bench = prev.bench.filter((id) => id !== draggingId);
      if (displaced) bench = [...bench, displaced];
      return { slots, bench };
    });
    setDraggingId(null);
  }

  function dropOnBench() {
    if (!draggingId) return;
    setLineup((prev) => {
      const slots = { ...prev.slots };
      let moved = false;
      for (const key of Object.keys(slots)) {
        if (slots[key] === draggingId) {
          delete slots[key];
          moved = true;
        }
      }
      if (!moved) return prev;
      return { slots, bench: [...prev.bench, draggingId] };
    });
    setDraggingId(null);
  }

  async function handleSave() {
    if (!nextMatch) return;
    const players = FORMATION_SLOTS.filter((slot) => lineup.slots[slot.key]).map((slot) => ({
      playerId: lineup.slots[slot.key],
      num: slot.num,
      pos: slot.group,
    }));
    setSaveState('saving');
    try {
      await api.putMatchLineup(nextMatch.id, { formation: '4-3-3', players }, token);
      setSaveState('saved');
      setTimeout(() => setSaveState('idle'), 1500);
    } catch (err) {
      setError(err.message);
      setSaveState('idle');
    }
  }

  if (loading) return <div className="state-message">Loading lineup builder…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;
  if (!nextMatch) {
    return <div className="state-message">No upcoming match to build a lineup for.</div>;
  }

  const filledCount = Object.keys(lineup.slots).length;

  return (
    <div className="lineup-builder">
      <div className="lineup-builder-hint">
        Drag players onto the pitch. Drag back to bench to remove.
      </div>

      <div className="pitch">
        {FORMATION_SLOTS.map((slot) => {
          const playerId = lineup.slots[slot.key];
          const player = playerId ? playersById[playerId] : null;
          return (
            <div
              key={slot.key}
              className={`pitch-slot ${player ? 'pitch-slot-filled' : ''}`}
              style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              draggable={!!player}
              onDragStart={() => player && setDraggingId(player.id)}
              onDragOver={(e) => e.preventDefault()}
              onDrop={() => dropOnSlot(slot.key)}
            >
              {player ? player.number : ''}
            </div>
          );
        })}
      </div>

      <div className="bench-panel" onDragOver={(e) => e.preventDefault()} onDrop={dropOnBench}>
        <div className="dashboard-card-label">BENCH</div>
        <div className="bench-players">
          {lineup.bench.map((id) => {
            const player = playersById[id];
            if (!player) return null;
            return (
              <div key={id} className="bench-player" draggable onDragStart={() => setDraggingId(id)}>
                <span className="bench-player-num">{player.number}</span>
                <span>{player.name}</span>
              </div>
            );
          })}
        </div>
      </div>

      <button className="save-lineup-button" onClick={handleSave} disabled={saveState === 'saving'}>
        {saveState === 'saved'
          ? 'Saved ✓'
          : saveState === 'saving'
            ? 'Saving…'
            : `Save Lineup (${filledCount}/11)`}
      </button>
    </div>
  );
}
