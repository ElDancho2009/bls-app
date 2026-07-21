import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Crest from '../Crest.jsx';

const DIVISIONS = [
  { key: 'first', label: 'First Division' },
  { key: 'brooklyn', label: 'Brooklyn' },
  { key: 'queens', label: 'Queens' },
  { key: 'bronx', label: 'Bronx' },
];

export default function LeaguesScreen({ onSelectTeam }) {
  const [division, setDivision] = useState('brooklyn');
  const [standings, setStandings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .getStandings(division)
      .then(setStandings)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [division]);

  return (
    <div className="leagues-screen">
      <header className="screen-header">
        <div className="brand-title">LEAGUES</div>
      </header>

      <div className="chip-row">
        {DIVISIONS.map((d) => (
          <button
            key={d.key}
            className={`chip chip-wide ${division === d.key ? 'chip-active' : ''}`}
            onClick={() => setDivision(d.key)}
          >
            {d.label}
          </button>
        ))}
      </div>

      {loading && <div className="state-message">Loading standings…</div>}
      {error && <div className="state-message error">Failed to load: {error}</div>}

      {!loading && !error && (
        <div className="standings-table">
          <div className="standings-header-row">
            <div>#</div>
            <div>TEAM</div>
            <div>GP</div>
            <div>W</div>
            <div>D</div>
            <div>L</div>
            <div>GD</div>
            <div>PTS</div>
          </div>
          {standings.map((row, i) => (
            <button
              key={row.id}
              className={`standings-row ${i === 0 ? 'standings-row-lead' : i < 3 ? 'standings-row-promo' : ''}`}
              onClick={() => onSelectTeam(row.id)}
            >
              <div className="standings-rank">{i + 1}</div>
              <div className="standings-name">
                <Crest src={row.logo_url} size={22} />
                <span>{row.name}</span>
              </div>
              <div className="standings-cell">{row.gp}</div>
              <div className="standings-cell">{row.w}</div>
              <div className="standings-cell">{row.d}</div>
              <div className="standings-cell">{row.l}</div>
              <div className={`standings-cell ${row.gd > 0 ? 'gd-pos' : row.gd < 0 ? 'gd-neg' : ''}`}>
                {row.gd > 0 ? `+${row.gd}` : row.gd}
              </div>
              <div className="standings-pts">{row.pts}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
