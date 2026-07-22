import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { useToast } from '../../ToastContext.jsx';
import { api } from '../../api.js';

const FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'checked-in', label: 'Checked In' },
  { key: 'flagged', label: 'Flagged' },
];

function initials(name) {
  return name
    .split(' ')
    .map((w) => w[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();
}

export default function CheckinScreen() {
  const { team, token } = useAuth();
  const showToast = useToast();
  const [nextMatch, setNextMatch] = useState(null);
  const [players, setPlayers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    if (!team) return;
    let cancelled = false;

    async function load() {
      try {
        const matches = await api.getMatches();
        const next = matches
          .filter(
            (m) =>
              (m.status === 'upcoming' || m.status === 'live') &&
              (m.home_team_id === team.id || m.away_team_id === team.id)
          )
          .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))[0];

        if (!next) {
          if (!cancelled) setLoading(false);
          return;
        }

        const checkins = await api.getCheckins(next.id, token);
        if (!cancelled) {
          setNextMatch(next);
          setPlayers(checkins);
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
  }, [team, token]);

  async function toggle(playerId) {
    const updated = await api.toggleCheckin(nextMatch.id, playerId, token);
    setPlayers((prev) =>
      prev.map((p) => (p.id === updated.playerId ? { ...p, checkedIn: updated.checkedIn } : p))
    );
    showToast('Match check-in updated');
  }

  const visiblePlayers = useMemo(() => {
    const q = query.trim().toLowerCase();
    return players.filter((p) => {
      if (q && !p.name.toLowerCase().includes(q) && !String(p.number).includes(q)) return false;
      if (filter === 'checked-in' && !p.checkedIn) return false;
      if (filter === 'flagged' && !p.flagged) return false;
      return true;
    });
  }, [players, query, filter]);

  if (loading) return <div className="state-message">Loading check-in…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;
  if (!nextMatch) {
    return <div className="state-message">No upcoming match to check in for.</div>;
  }

  return (
    <div className="checkin-screen">
      <div className="checkin-search-row">
        <input
          type="text"
          className="checkin-search-input"
          placeholder="Search name or #"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      <div className="chip-row checkin-filter-row">
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

      <div className="checkin-list">
        {visiblePlayers.length === 0 && <div className="state-message">No players match.</div>}
        {visiblePlayers.map((p) => (
          <div key={p.id} className="checkin-card">
            <div className="checkin-row">
              <div className="checkin-initials">{initials(p.name)}</div>
              <div className="checkin-num">{p.number}</div>
              <div className="checkin-info">
                <div className="checkin-name">{p.name}</div>
                <div className="checkin-pos">{p.position}</div>
              </div>
              <div
                className="checkin-badge"
                style={p.badgeBg ? { background: p.badgeBg, color: p.badgeColor } : undefined}
              >
                {p.badgeLabel}
              </div>
              {p.canCheckIn && (
                <button
                  className={`checkin-toggle ${p.checkedIn ? 'checkin-toggle-active' : ''}`}
                  onClick={() => toggle(p.id)}
                  aria-label={p.checkedIn ? 'Checked in' : 'Not checked in'}
                />
              )}
            </div>
            {p.flagged && p.bannerText && (
              <div
                className="checkin-banner"
                style={{ borderColor: p.badgeColor, color: p.badgeColor }}
              >
                {p.bannerText}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
