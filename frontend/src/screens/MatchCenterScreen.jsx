import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ALL_TABS = ['timeline', 'lineups', 'form', 'media'];
const EVENT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'goal', label: 'Goals' },
  { key: 'card', label: 'Cards' },
];
const POSITION_ROWS = ['GK', 'DF', 'MF', 'FW'];

function groupStartersByPosition(players) {
  return POSITION_ROWS.map((pos) => players.filter((p) => p.is_starting && p.pos === pos)).filter(
    (row) => row.length > 0
  );
}

function PlayerNode({ player, side }) {
  return (
    <div className="pitch-player">
      <div className={`pitch-player-badge pitch-player-badge-${side}`}>{player.num}</div>
      <div className="pitch-player-name">{player.player_name}</div>
    </div>
  );
}

export default function MatchCenterScreen({ matchId, onClose, onSelectTeam, onSelectRefSheet }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('timeline');
  const [scrubMinute, setScrubMinute] = useState(90);
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    setData(null);
    setError(null);
    setScrubMinute(90);
    setEventFilter('all');
    api
      .getMatch(matchId)
      .then((result) => {
        setData(result);
        setTab(result.match.status === 'upcoming' ? 'lineups' : 'timeline');
      })
      .catch((err) => setError(err.message));
  }, [matchId]);

  if (error) return <div className="state-message error">Failed to load: {error}</div>;
  if (!data) return <div className="state-message">Loading match…</div>;

  const { match, homeTeam, awayTeam, events, lineups, media, motm, form } = data;
  const tabs = ALL_TABS;

  async function handleVote(candidateId) {
    const updated = await api.voteMotm(match.id, candidateId);
    setData((prev) => ({
      ...prev,
      motm: prev.motm.map((c) => (c.id === updated.id ? updated : c)),
    }));
  }

  const visibleEvents = events.filter((ev) => {
    if (ev.minute > scrubMinute) return false;
    if (eventFilter === 'goal') return ev.type === 'goal';
    if (eventFilter === 'card') return ev.type === 'yellow' || ev.type === 'red';
    return true;
  });

  return (
    <div className="match-center">
      <button className="close-button" onClick={onClose}>
        ← Back
      </button>

      <div className="mc-header">
        <button className="mc-team" onClick={() => onSelectTeam(homeTeam.id)}>
          <div className="mc-team-name">{homeTeam.name}</div>
        </button>
        <div className="mc-center">
          <div className="mc-score">
            {match.status === 'upcoming'
              ? new Date(match.kickoff_at).toLocaleTimeString('en-US', {
                  hour: 'numeric',
                  minute: '2-digit',
                })
              : `${match.home_score} - ${match.away_score}`}
          </div>
          <div className="mc-status">{match.status.toUpperCase()}</div>
        </div>
        <button className="mc-team" onClick={() => onSelectTeam(awayTeam.id)}>
          <div className="mc-team-name">{awayTeam.name}</div>
        </button>
      </div>
      <div className="mc-venue">{match.venue}</div>

      {(match.status === 'live' || match.status === 'ft') && (
        <div className="mc-ref-link-row">
          <button className="mc-ref-link" onClick={() => onSelectRefSheet(match.id)}>
            ⚑ Referee Sign-Off
          </button>
        </div>
      )}

      {motm.length > 0 && (
        <div className="motm-cta-card">
          <div className="motm-cta-title">⭐ VOTE MAN OF THE MATCH</div>
          <div className="motm-list">
            {motm.map((c) => (
              <button key={c.id} className="motm-candidate" onClick={() => handleVote(c.id)}>
                <div className="motm-name">{c.player_name}</div>
                <div className="motm-blurb">{c.blurb}</div>
                <div className="motm-votes">{c.votes} votes</div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="chip-row">
        {tabs.map((t) => (
          <button
            key={t}
            className={`chip ${tab === t ? 'chip-active' : ''}`}
            onClick={() => setTab(t)}
          >
            {t[0].toUpperCase() + t.slice(1)}
          </button>
        ))}
      </div>

      {tab === 'timeline' &&
        (match.status === 'upcoming' ? (
          <div className="mc-upcoming-empty">
            <div className="mc-upcoming-empty-title">Match has not started yet.</div>
            <div className="mc-upcoming-empty-desc">
              Live events and timeline controls will unlock at kickoff.
            </div>
          </div>
        ) : (
          <>
            <div className="mc-scrubber">
              <input
                type="range"
                min="0"
                max="90"
                value={scrubMinute}
                onChange={(e) => setScrubMinute(Number(e.target.value))}
                className="mc-scrubber-input"
              />
              <div className="mc-scrubber-label">Showing through minute {scrubMinute}'</div>
            </div>

            <div className="chip-row mc-event-filter-row">
              {EVENT_FILTERS.map((f) => (
                <button
                  key={f.key}
                  className={`chip ${eventFilter === f.key ? 'chip-active' : ''}`}
                  onClick={() => setEventFilter(f.key)}
                >
                  {f.label}
                </button>
              ))}
            </div>

            <div className="timeline-list">
              {visibleEvents.length === 0 && <div className="state-message">No events yet.</div>}
              {visibleEvents.map((ev) => (
                <div
                  key={ev.id}
                  className={`timeline-event ${
                    ev.team_id === match.home_team_id ? 'event-home' : 'event-away'
                  }`}
                >
                  <span className="event-minute">{ev.minute}'</span>
                  <span className="event-player">{ev.player_name}</span>
                  {ev.detail && <span className="event-detail">{ev.detail}</span>}
                </div>
              ))}
            </div>
          </>
        ))}

      {tab === 'lineups' &&
        (() => {
          const homeRows = groupStartersByPosition(lineups.home);
          const awayRows = groupStartersByPosition(lineups.away);
          const homeSubs = lineups.home.filter((p) => !p.is_starting);
          const awaySubs = lineups.away.filter((p) => !p.is_starting);
          return (
            <>
              <div className="pitch-card">
                <svg className="pitch-markings" viewBox="0 0 100 150" preserveAspectRatio="none">
                  <rect x="2" y="2" width="96" height="146" className="pitch-line" />
                  <line x1="2" y1="75" x2="98" y2="75" className="pitch-line" />
                  <circle cx="50" cy="75" r="12" className="pitch-line" />
                  <circle cx="50" cy="75" r="0.8" className="pitch-dot" />
                  <rect x="25" y="2" width="50" height="18" className="pitch-line" />
                  <rect x="25" y="130" width="50" height="18" className="pitch-line" />
                </svg>

                <div className="pitch-half pitch-half-away">
                  {awayRows.length > 0 && (
                    <div className="pitch-formation-label">{match.away_formation || 'TBD'}</div>
                  )}
                  {awayRows.map((row, i) => (
                    <div className="pitch-row" key={`away-${i}`}>
                      {row.map((p) => (
                        <PlayerNode key={p.id} player={p} side="away" />
                      ))}
                    </div>
                  ))}
                  {awayRows.length === 0 && (
                    <div className="pitch-tbd-overlay">Lineup TBD</div>
                  )}
                </div>

                <div className="pitch-half pitch-half-home">
                  {[...homeRows].reverse().map((row, i) => (
                    <div className="pitch-row" key={`home-${i}`}>
                      {row.map((p) => (
                        <PlayerNode key={p.id} player={p} side="home" />
                      ))}
                    </div>
                  ))}
                  {homeRows.length === 0 && (
                    <div className="pitch-tbd-overlay">Lineup TBD</div>
                  )}
                  {homeRows.length > 0 && (
                    <div className="pitch-formation-label">{match.home_formation || 'TBD'}</div>
                  )}
                </div>
              </div>

              <div className="lineups-columns">
                <div className="lineup-column">
                  <div className="lineup-formation">Substitutes</div>
                  {homeSubs.length === 0 && <div className="state-message">No subs listed.</div>}
                  {homeSubs.map((p) => (
                    <div key={p.id} className="lineup-player">
                      <span className="lineup-num">{p.num}</span>
                      <span>{p.player_name}</span>
                      <span className="lineup-pos">{p.pos}</span>
                    </div>
                  ))}
                </div>
                <div className="lineup-column">
                  <div className="lineup-formation">Substitutes</div>
                  {awaySubs.length === 0 && <div className="state-message">No subs listed.</div>}
                  {awaySubs.map((p) => (
                    <div key={p.id} className="lineup-player">
                      <span className="lineup-num">{p.num}</span>
                      <span>{p.player_name}</span>
                      <span className="lineup-pos">{p.pos}</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          );
        })()}

      {tab === 'form' && (
        <div className="form-columns">
          <div>
            <div className="form-team-name">{homeTeam.name}</div>
            <div className="form-chips">
              {form.home.length === 0 && (
                <span className="state-message">No prior results</span>
              )}
              {form.home.map((r, i) => (
                <span key={i} className={`form-chip form-${r}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>
          <div>
            <div className="form-team-name">{awayTeam.name}</div>
            <div className="form-chips">
              {form.away.length === 0 && (
                <span className="state-message">No prior results</span>
              )}
              {form.away.map((r, i) => (
                <span key={i} className={`form-chip form-${r}`}>
                  {r}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      {tab === 'media' && (
        <div className="clip-list">
          {media.length === 0 && <div className="state-message">No clips yet.</div>}
          {media.map((clip) => (
            <div key={clip.id} className="clip-row">
              <span className="clip-tag">{clip.tag}</span>
              <span className="clip-title">{clip.title}</span>
              <span className="clip-meta">
                {clip.minute}' · {clip.views_count.toLocaleString()} views
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
