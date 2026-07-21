import { useEffect, useState } from 'react';
import { api } from '../api.js';
import Crest from '../Crest.jsx';
import IgExportModal, { assignToPitch } from './IgExportModal.jsx';

const GOTW_VOTE_KEY = 'bls-gotw-voted-clip';
const POTW_VOTE_KEY = 'bls-potw-voted-candidate';

function votePercentages(items) {
  const total = items.reduce((sum, i) => sum + i.votes, 0) || 1;
  return Object.fromEntries(items.map((i) => [i.id, Math.round((i.votes / total) * 100)]));
}

export default function NewsScreen({ onSelectMatch }) {
  const [bulletins, setBulletins] = useState([]);
  const [motw, setMotw] = useState(null);
  const [discipline, setDiscipline] = useState({ suspended: [], dangerZone: [] });
  const [gotw, setGotw] = useState([]);
  const [potw, setPotw] = useState([]);
  const [totw, setTotw] = useState([]);
  const [gotwVotedId, setGotwVotedId] = useState(
    () => Number(localStorage.getItem(GOTW_VOTE_KEY)) || null
  );
  const [potwVotedId, setPotwVotedId] = useState(
    () => Number(localStorage.getItem(POTW_VOTE_KEY)) || null
  );
  const [igOpen, setIgOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    Promise.all([
      api.getBulletins(),
      api.getMatchOfWeek().catch(() => null),
      api.getDiscipline(),
      api.getGotw(),
      api.getPotw(),
      api.getTotw(),
    ])
      .then(([bulletinsData, motwData, disciplineData, gotwData, potwData, totwData]) => {
        setBulletins(bulletinsData);
        setMotw(motwData);
        setDiscipline(disciplineData);
        setGotw(gotwData);
        setPotw(potwData);
        setTotw(totwData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, []);

  async function handleGotwVote(clipId) {
    if (gotwVotedId != null) return;
    const updated = await api.voteGotw(clipId);
    setGotw((prev) => prev.map((c) => (c.id === updated.id ? { ...c, votes: updated.votes } : c)));
    setGotwVotedId(clipId);
    localStorage.setItem(GOTW_VOTE_KEY, String(clipId));
  }

  async function handlePotwVote(candidateId) {
    if (potwVotedId != null) return;
    const updated = await api.votePotw(candidateId);
    setPotw((prev) => prev.map((c) => (c.id === updated.id ? { ...c, votes: updated.votes } : c)));
    setPotwVotedId(candidateId);
    localStorage.setItem(POTW_VOTE_KEY, String(candidateId));
    api.getTotw().then(setTotw);
  }

  if (loading) return <div className="state-message">Loading news…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  const gotwPct = votePercentages(gotw);
  const potwPct = votePercentages(potw);
  const totwSlots = assignToPitch(totw);

  return (
    <div className="news-screen">
      <header className="screen-header">
        <div className="brand-title">NEWS</div>
        <div className="screen-subtitle">Highlights, votes &amp; the team of the week</div>
      </header>

      {bulletins.length > 0 && (
        <div className="bulletin-list">
          {bulletins.map((b) => (
            <div key={b.id} className="bulletin-card">
              <span className="bulletin-badge">BLS COMMISH</span>
              <div className="bulletin-title">{b.title}</div>
              <div className="bulletin-body">{b.body}</div>
            </div>
          ))}
        </div>
      )}

      {motw && (
        <section className="news-section">
          <div className="leaderboard-section-title">MATCH OF THE WEEK</div>
          <button className="motw-card" onClick={() => onSelectMatch(motw.match.id)}>
            <div className="motw-teams">
              <div className="motw-team">
                <Crest src={motw.homeTeam.logo_url} size={40} />
                <div className="motw-team-name">{motw.homeTeam.name}</div>
                <div className="motw-form-chips">
                  {motw.form.home.map((r, i) => (
                    <span key={i} className={`form-chip motw-form-chip form-${r}`}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
              <div className="motw-vs">VS</div>
              <div className="motw-team">
                <Crest src={motw.awayTeam.logo_url} size={40} />
                <div className="motw-team-name">{motw.awayTeam.name}</div>
                <div className="motw-form-chips">
                  {motw.form.away.map((r, i) => (
                    <span key={i} className={`form-chip motw-form-chip form-${r}`}>
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            </div>
            <div className="motw-stats-row">
              <div className="motw-stat">
                <div className="motw-stat-label">TOP OFFENSE</div>
                <div className="motw-stat-value">{motw.offenseLeader}</div>
              </div>
              <div className="motw-stat">
                <div className="motw-stat-label">TOP DEFENSE</div>
                <div className="motw-stat-value">{motw.defenseLeader}</div>
              </div>
            </div>
            <div className="motw-stats-row">
              <div className="motw-stat">
                <div className="motw-stat-label">KEY MATCHUP</div>
                <div className="motw-stat-value">{motw.homePlayer}</div>
              </div>
              <div className="motw-stat">
                <div className="motw-stat-label">&nbsp;</div>
                <div className="motw-stat-value">{motw.awayPlayer}</div>
              </div>
            </div>
          </button>
        </section>
      )}

      {gotw.length > 0 && (
        <section className="news-section">
          <div className="leaderboard-section-title">GOAL OF THE WEEK — VOTE NOW</div>
          <div className="gotw-grid">
            {gotw.map((g) => {
              const voted = gotwVotedId === g.id;
              const showResults = gotwVotedId != null;
              return (
                <button
                  key={g.id}
                  className="gotw-card"
                  onClick={() => handleGotwVote(g.id)}
                  disabled={showResults}
                >
                  <div className="gotw-thumb">
                    <span className="gotw-minute-badge">{g.minute}'</span>
                    {voted && <span className="gotw-voted-badge">✓ YOUR VOTE</span>}
                  </div>
                  <div className="gotw-title">{g.title}</div>
                  <div className="gotw-context">{g.context}</div>
                  {showResults && (
                    <>
                      <div className="vote-result-bar">
                        <div className="vote-result-fill" style={{ width: `${gotwPct[g.id]}%` }} />
                      </div>
                      <div className="vote-result-pct">{gotwPct[g.id]}%</div>
                    </>
                  )}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {potw.length > 0 && (
        <section className="news-section">
          <div className="motm-cta-card">
            <div className="motm-cta-title">⭐ PLAYER OF THE WEEK — VOTE NOW</div>
            <div className="motm-list">
              {potw.map((c) => {
                const voted = potwVotedId === c.id;
                const showResults = potwVotedId != null;
                return (
                  <button
                    key={c.id}
                    className={`motm-candidate ${voted ? 'motm-candidate-voted' : ''}`}
                    onClick={() => handlePotwVote(c.id)}
                    disabled={showResults}
                  >
                    <div className="motm-name">{c.name}</div>
                    <div className="motm-blurb">
                      {c.teamName} · {c.goals}G {c.assists}A this week
                    </div>
                    {showResults ? (
                      <>
                        <div className="vote-result-bar">
                          <div
                            className="vote-result-fill"
                            style={{ width: `${potwPct[c.id]}%` }}
                          />
                        </div>
                        <div className="motm-votes">
                          {potwPct[c.id]}% {voted ? '· your vote' : ''}
                        </div>
                      </>
                    ) : (
                      <div className="motm-votes">{c.votes} votes</div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {totwSlots.length > 0 && (
        <section className="news-section">
          <div className="totw-header">
            <div className="leaderboard-section-title totw-title">TEAM OF THE WEEK</div>
            <div className="totw-formation-label">4-3-3</div>
          </div>
          <div className="totw-pitch">
            {totwSlots.map(({ slot, player }) => (
              <div
                key={player.id}
                className="totw-player"
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              >
                <div className="totw-player-badge">
                  <div className="totw-player-num">{player.number}</div>
                  <div className="totw-player-rating">{player.rating}</div>
                  {player.isPlayerOfWeek && <div className="totw-potw-flag">★ POTW</div>}
                </div>
                <div className="totw-player-name">{player.name}</div>
                <div className="totw-player-stat">{player.statLine}</div>
              </div>
            ))}
          </div>
          <button className="ig-export-button" onClick={() => setIgOpen(true)}>
            Export to IG Story (1080×1920)
          </button>
        </section>
      )}

      <section className="news-section">
        <div className="leaderboard-section-title">DISCIPLINE &amp; SUSPENSION WIRE</div>
        <div className="discipline-list">
          {discipline.suspended.length === 0 && (
            <div className="state-message">No suspensions right now.</div>
          )}
          {discipline.suspended.map((p) => (
            <div key={p.id} className="discipline-row">
              <div className="discipline-card-bar discipline-bar-red" />
              <Crest src={p.team_logo_url} size={24} />
              <div className="discipline-info">
                <div className="discipline-name">{p.name}</div>
                <div className="discipline-meta">{p.team_name} · Red Card</div>
              </div>
              <div className="discipline-flag discipline-flag-red">1 Match Ban</div>
            </div>
          ))}
        </div>
      </section>

      <section className="news-section">
        <div className="leaderboard-section-title">YELLOW CARD DANGER ZONE</div>
        <div className="discipline-list">
          {discipline.dangerZone.length === 0 && (
            <div className="state-message">No one is close to suspension.</div>
          )}
          {discipline.dangerZone.map((p) => (
            <div key={p.id} className="discipline-row">
              <div className="discipline-card-bar discipline-bar-yellow" />
              <Crest src={p.team_logo_url} size={24} />
              <div className="discipline-info">
                <div className="discipline-name">{p.name}</div>
                <div className="discipline-meta">{p.team_name}</div>
              </div>
              <div className="discipline-flag discipline-flag-yellow">{p.yellow_cards} Yellows</div>
            </div>
          ))}
        </div>
      </section>

      {igOpen && <IgExportModal totwSlots={totwSlots} onClose={() => setIgOpen(false)} />}
    </div>
  );
}
