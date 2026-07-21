import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ALL_TABS = ['timeline', 'lineups', 'form', 'media'];
const EVENT_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'goal', label: 'Goals' },
  { key: 'card', label: 'Cards' },
];

export default function MatchCenterScreen({ matchId, onClose, onSelectTeam, onSelectRefSheet }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('timeline');
  const [scrubMinute, setScrubMinute] = useState(90);
  const [eventFilter, setEventFilter] = useState('all');

  useEffect(() => {
    setData(null);
    setError(null);
    setTab('timeline');
    setScrubMinute(90);
    setEventFilter('all');
    api.getMatch(matchId).then(setData).catch((err) => setError(err.message));
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

      {tab === 'timeline' && (
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
      )}

      {tab === 'lineups' && (
        <div className="lineups-columns">
          <div className="lineup-column">
            <div className="lineup-formation">{match.home_formation || 'TBD'}</div>
            {lineups.home.map((p) => (
              <div key={p.id} className="lineup-player">
                <span className="lineup-num">{p.num}</span>
                <span>{p.player_name}</span>
                <span className="lineup-pos">{p.pos}</span>
              </div>
            ))}
          </div>
          <div className="lineup-column">
            <div className="lineup-formation">{match.away_formation || 'TBD'}</div>
            {lineups.away.map((p) => (
              <div key={p.id} className="lineup-player">
                <span className="lineup-num">{p.num}</span>
                <span>{p.player_name}</span>
                <span className="lineup-pos">{p.pos}</span>
              </div>
            ))}
          </div>
        </div>
      )}

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
