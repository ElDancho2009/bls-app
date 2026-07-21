import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Crest from '../Crest.jsx';

const DIVISIONS = [
  { key: 'all', label: 'All' },
  { key: 'first', label: 'First Division' },
  { key: 'brooklyn', label: 'Brooklyn' },
  { key: 'queens', label: 'Queens' },
  { key: 'bronx', label: 'Bronx' },
];

function dayLabel(date) {
  if (isSameDay(date.toISOString(), new Date())) return 'TODAY';
  return date.toLocaleDateString('en-US', { weekday: 'short' }).toUpperCase();
}

function isSameDay(isoString, date) {
  const a = new Date(isoString);
  return (
    a.getFullYear() === date.getFullYear() &&
    a.getMonth() === date.getMonth() &&
    a.getDate() === date.getDate()
  );
}

function statusLabel(match) {
  if (match.status === 'live') return 'LIVE';
  if (match.status === 'ft') return 'FT';
  return new Date(match.kickoff_at).toLocaleTimeString('en-US', {
    hour: 'numeric',
    minute: '2-digit',
  });
}

function fixtureDateLabel(isoString) {
  return new Date(isoString).toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  });
}

export default function MatchesScreen({ onSelectMatch }) {
  const [teams, setTeams] = useState([]);
  const [matches, setMatches] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [division, setDivision] = useState('all');
  const [selectedDate, setSelectedDate] = useState(() => new Date());
  const [query, setQuery] = useState('');

  useEffect(() => {
    Promise.all([api.getTeams(), api.getMatches()])
      .then(([teamsData, matchesData]) => {
        setTeams(teamsData);
        setMatches(matchesData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="state-message">Loading matches…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));

  const shiftSelectedDate = (deltaDays) => {
    setSelectedDate((prev) => {
      const next = new Date(prev);
      next.setDate(next.getDate() + deltaDays);
      return next;
    });
  };

  const days = [-2, -1, 0, 1, 2].map((offset) => {
    const d = new Date(selectedDate);
    d.setDate(d.getDate() + offset);
    return { offset, date: d };
  });

  const inDivision = (m) =>
    division === 'all' || m.division === division || m.division === 'cross';

  const trimmedQuery = query.trim().toLowerCase();
  const isSearching = trimmedQuery.length > 0;

  const searchResults = isSearching
    ? matches
        .filter((m) => {
          const home = teamsById[m.home_team_id];
          const away = teamsById[m.away_team_id];
          return (
            inDivision(m) &&
            ((home?.name.toLowerCase().includes(trimmedQuery) ?? false) ||
              (away?.name.toLowerCase().includes(trimmedQuery) ?? false))
          );
        })
        .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))
    : [];

  const visibleMatches = matches.filter(
    (m) => inDivision(m) && isSameDay(m.kickoff_at, selectedDate)
  );

  return (
    <div className="matches-screen">
      <header className="screen-header brand-header">
        <div className="brand-mark" aria-hidden="true">BLS</div>
        <div>
          <div className="brand-title">BOROUGH LEAGUE</div>
          <div className="brand-subtitle">SOCCER</div>
        </div>
      </header>

      <div className="chip-row">
        {DIVISIONS.map((d) => (
          <button
            key={d.key}
            className={`chip ${division === d.key ? 'chip-active' : ''}`}
            onClick={() => setDivision(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      <div className="cards-search-row">
        <input
          type="text"
          className="cards-search-input"
          placeholder="Search fixtures by team…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {!isSearching && (
        <div className="chip-row day-row">
          <button className="chip" onClick={() => shiftSelectedDate(-1)} aria-label="Previous day">
            ‹
          </button>
          {days.map(({ offset, date }) => (
            <button
              key={offset}
              className={`day-chip ${offset === 0 ? 'chip-active' : ''}`}
              onClick={() => shiftSelectedDate(offset)}
            >
              <span className="day-dow">{dayLabel(date)}</span>
              <span className="day-num">{date.getDate()}</span>
            </button>
          ))}
          <button className="chip" onClick={() => shiftSelectedDate(1)} aria-label="Next day">
            ›
          </button>
          <button className="chip" onClick={() => setSelectedDate(new Date())}>
            Today
          </button>
        </div>
      )}

      <div className="fixture-list">
        {isSearching && searchResults.length === 0 && (
          <div className="state-message">No fixtures match "{query}".</div>
        )}
        {!isSearching && visibleMatches.length === 0 && (
          <div className="state-message">No matches scheduled</div>
        )}
        {(isSearching ? searchResults : visibleMatches).map((match) => {
          const home = teamsById[match.home_team_id];
          const away = teamsById[match.away_team_id];
          const scoreText =
            match.status === 'upcoming' ? '–' : `${match.home_score} - ${match.away_score}`;

          const isLive = match.status === 'live';

          return (
            <button
              key={match.id}
              className={`fixture-row ${isLive ? 'fixture-live fixture-row-hero' : ''}`}
              onClick={() => onSelectMatch(match.id)}
            >
              {isLive && <span className="fixture-hero-badge">LIVE</span>}
              <div className="fixture-team">
                <Crest src={home?.logo_url} />
                <span>{home?.name}</span>
              </div>
              <div className="fixture-center">
                {isSearching && (
                  <div className="fixture-date">{fixtureDateLabel(match.kickoff_at)}</div>
                )}
                <div className="fixture-score">{scoreText}</div>
                <div className="fixture-status">{statusLabel(match)}</div>
              </div>
              <div className="fixture-team fixture-team-away">
                <span>{away?.name}</span>
                <Crest src={away?.logo_url} />
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
