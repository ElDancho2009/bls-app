import { useEffect, useState } from 'react';
import { api } from '../api.js';

const ALL_TABS = ['timeline', 'lineups', 'form', 'media', 'motm'];

export default function MatchCenterScreen({ matchId, onClose }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [tab, setTab] = useState('timeline');

  useEffect(() => {
    setData(null);
    setError(null);
    setTab('timeline');
    api.getMatch(matchId).then(setData).catch((err) => setError(err.message));
  }, [matchId]);

  if (error) return <div className="state-message error">Failed to load: {error}</div>;
  if (!data) return <div className="state-message">Loading match…</div>;

  const { match, homeTeam, awayTeam, events, lineups, media, motm, form } = data;
  const tabs = ALL_TABS.filter((t) => t !== 'motm' || motm.length > 0);

  async function handleVote(candidateId) {
    const updated = await api.voteMotm(match.id, candidateId);
    setData((prev) => ({
      ...prev,
      motm: prev.motm.map((c) => (c.id === updated.id ? updated : c)),
    }));
  }

  return (
    <div className="match-center">
      <button className="close-button" onClick={onClose}>
        ← Back
      </button>

      <div className="mc-header">
        <div className="mc-team">
          <div className="mc-team-name">{homeTeam.name}</div>
        </div>
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
        <div className="mc-team">
          <div className="mc-team-name">{awayTeam.name}</div>
        </div>
      </div>
      <div className="mc-venue">{match.venue}</div>

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
        <div className="timeline-list">
          {events.length === 0 && <div className="state-message">No events yet.</div>}
          {events.map((ev) => (
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

      {tab === 'motm' && (
        <div className="motm-list">
          {motm.map((c) => (
            <button key={c.id} className="motm-candidate" onClick={() => handleVote(c.id)}>
              <div className="motm-name">{c.player_name}</div>
              <div className="motm-blurb">{c.blurb}</div>
              <div className="motm-votes">{c.votes} votes</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
