import { useEffect, useMemo, useState } from 'react';
import { api } from '../api.js';
import PlayerDetailModal from './PlayerDetailModal.jsx';
import Crest from '../Crest.jsx';

const DIVISION_LABELS = { queens: 'Queens Division', bronx: 'Bronx Division' };

const CATEGORIES = [
  {
    key: 'goals',
    title: 'Top Scorers',
    valueLabel: 'GOALS',
    filter: () => true,
    sort: (a, b) => b.goals - a.goals,
    value: (p) => p.goals,
  },
  {
    key: 'assists',
    title: 'Top Assists',
    valueLabel: 'AST',
    filter: () => true,
    sort: (a, b) => b.assists - a.assists,
    value: (p) => p.assists,
  },
  {
    key: 'cleanSheets',
    title: 'Top Clean Sheets',
    valueLabel: 'CS',
    filter: (p) => p.position === 'GK',
    sort: (a, b) => b.clean_sheets - a.clean_sheets,
    value: (p) => p.clean_sheets,
  },
];

function PlayerLeaderRow({ rank, player, team, value, valueLabel, onClick }) {
  return (
    <button className="leaderboard-row" onClick={onClick}>
      <div className="leaderboard-rank">{rank}</div>
      <div className="leaderboard-info">
        <div className="leaderboard-name">{player.name}</div>
        <div className="leaderboard-team">
          {team?.name} · {player.position}
        </div>
      </div>
      <div className="leaderboard-value">
        <div className="leaderboard-value-num">{value}</div>
        <div className="leaderboard-value-label">{valueLabel}</div>
      </div>
    </button>
  );
}

function TeamLeaderRow({ rank, team, value, valueLabel }) {
  return (
    <div className="leaderboard-row team-leaderboard-row">
      <div className="leaderboard-rank">{rank}</div>
      <Crest src={team.logo_url} />
      <div className="leaderboard-info">
        <div className="leaderboard-name">{team.name}</div>
        <div className="leaderboard-team">{DIVISION_LABELS[team.division] ?? team.division}</div>
      </div>
      <div className="leaderboard-value">
        <div className="leaderboard-value-num">{value}</div>
        <div className="leaderboard-value-label">{valueLabel}</div>
      </div>
    </div>
  );
}

export default function CardsScreen() {
  const [players, setPlayers] = useState([]);
  const [teams, setTeams] = useState([]);
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [query, setQuery] = useState('');
  const [selectedPlayer, setSelectedPlayer] = useState(null);

  useEffect(() => {
    Promise.all([api.getPlayers(), api.getTeams(), api.getStandings()])
      .then(([playersData, teamsData, standingsData]) => {
        setPlayers(playersData);
        setTeams(teamsData);
        setStandings(standingsData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  const teamsById = useMemo(() => Object.fromEntries(teams.map((t) => [t.id, t])), [teams]);

  const searchResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return [];
    return players
      .filter(
        (p) =>
          p.name.toLowerCase().includes(q) ||
          (teamsById[p.team_id]?.name.toLowerCase().includes(q) ?? false)
      )
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0));
  }, [query, players, teamsById]);

  const teamOffense = useMemo(
    () => [...standings].sort((a, b) => b.gf - a.gf).slice(0, 5),
    [standings]
  );
  const teamDefense = useMemo(
    () => [...standings].sort((a, b) => a.ga - b.ga).slice(0, 5),
    [standings]
  );

  if (loading) return <div className="state-message">Loading players…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  const showSearch = query.trim().length > 0;

  return (
    <div className="cards-screen">
      <header className="screen-header">
        <div className="brand-title">PLAYERS</div>
        <div className="screen-subtitle">Stat leaders across both divisions</div>
      </header>

      <div className="cards-search-row">
        <input
          type="text"
          className="cards-search-input"
          placeholder="Search players or teams…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {showSearch ? (
        <div className="leaderboard-list search-results-list">
          {searchResults.length === 0 && (
            <div className="state-message">No players match "{query}".</div>
          )}
          {searchResults.map((player, i) => (
            <PlayerLeaderRow
              key={player.id}
              rank={i + 1}
              player={player}
              team={teamsById[player.team_id]}
              value={player.rating}
              valueLabel="RTG"
              onClick={() => setSelectedPlayer(player)}
            />
          ))}
        </div>
      ) : (
        <div className="leaderboard-sections">
          {CATEGORIES.map((cat) => {
            const rows = players.filter(cat.filter).sort(cat.sort).slice(0, 5);
            return (
              <section key={cat.key} className="leaderboard-section">
                <div className="leaderboard-section-title">{cat.title.toUpperCase()}</div>
                <div className="leaderboard-list">
                  {rows.length === 0 && <div className="state-message">No data yet.</div>}
                  {rows.map((player, i) => (
                    <PlayerLeaderRow
                      key={player.id}
                      rank={i + 1}
                      player={player}
                      team={teamsById[player.team_id]}
                      value={cat.value(player)}
                      valueLabel={cat.valueLabel}
                      onClick={() => setSelectedPlayer(player)}
                    />
                  ))}
                </div>
              </section>
            );
          })}

          <section className="leaderboard-section">
            <div className="leaderboard-section-title">BEST ATTACK</div>
            <div className="leaderboard-list">
              {teamOffense.map((row, i) => (
                <TeamLeaderRow key={row.id} rank={i + 1} team={row} value={row.gf} valueLabel="GF" />
              ))}
            </div>
          </section>

          <section className="leaderboard-section">
            <div className="leaderboard-section-title">BEST DEFENSE</div>
            <div className="leaderboard-list">
              {teamDefense.map((row, i) => (
                <TeamLeaderRow key={row.id} rank={i + 1} team={row} value={row.ga} valueLabel="GA" />
              ))}
            </div>
          </section>
        </div>
      )}

      {selectedPlayer && (
        <PlayerDetailModal
          player={selectedPlayer}
          team={teamsById[selectedPlayer.team_id]}
          onClose={() => setSelectedPlayer(null)}
        />
      )}
    </div>
  );
}
