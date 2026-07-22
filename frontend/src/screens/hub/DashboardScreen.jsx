import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';
import PitchSheetModal from './PitchSheetModal.jsx';

function dangerZoneMeta(player) {
  return player.yellow_cards === 2
    ? '1 yellow away from suspension'
    : `${player.yellow_cards} yellow cards accumulated`;
}

export default function DashboardScreen({ onNavigate }) {
  const { team, token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [refereeCount, setRefereeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [pitchSheetOpen, setPitchSheetOpen] = useState(false);

  useEffect(() => {
    if (!team) return;
    Promise.all([api.getMatches(), api.getTeams(), api.getPlayers(team.id)])
      .then(([matchesData, teamsData, playersData]) => {
        setMatches(matchesData);
        setTeams(teamsData);
        setPlayers(playersData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [team]);

  const nextMatch = team
    ? matches
        .filter(
          (m) =>
            (m.status === 'upcoming' || m.status === 'live') &&
            (m.home_team_id === team.id || m.away_team_id === team.id)
        )
        .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))[0]
    : null;

  useEffect(() => {
    if (!nextMatch) return;
    api.getMatchReferees(nextMatch.id).then((refs) => setRefereeCount(refs.length));
  }, [nextMatch?.id]);

  if (loading) return <div className="state-message">Loading dashboard…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  const teamsById = Object.fromEntries(teams.map((t) => [t.id, t]));
  const injuredCount = players.filter((p) => p.status === 'injured').length;
  const suspendedPlayers = players.filter((p) => p.red_cards >= 1);
  const dangerZonePlayers = players.filter((p) => p.red_cards === 0 && p.yellow_cards >= 2);
  const hasDisciplineIssues = suspendedPlayers.length > 0 || dangerZonePlayers.length > 0;

  let opponentLine = null;
  let matchLocationTag = null;
  let dateTimeLine = null;
  let venueLine = null;
  if (nextMatch) {
    const isHome = nextMatch.home_team_id === team.id;
    const opponent = teamsById[isHome ? nextMatch.away_team_id : nextMatch.home_team_id];
    const kickoff = new Date(nextMatch.kickoff_at);
    const dateText = kickoff.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
    const timeText = kickoff.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
    opponentLine = opponent?.name;
    matchLocationTag = isHome ? 'HOME' : 'AWAY';
    dateTimeLine = `${dateText} · ${timeText}`;
    venueLine = nextMatch.venue;
  }

  return (
    <div className="dashboard-screen">
      <div className="dashboard-card">
        <div className="dashboard-card-label dashboard-matchday-label">
          <span className="dashboard-matchday-dot" />
          NEXT MATCHDAY
        </div>
        {nextMatch ? (
          <>
            <div className="dashboard-next-match">
              <span className="dashboard-matchday-location">{matchLocationTag}</span>
              {opponentLine}
            </div>
            <div className="dashboard-matchday-meta">
              <span className="dashboard-matchday-time">{dateTimeLine}</span>
              <span className="dashboard-matchday-venue">{venueLine}</span>
            </div>
          </>
        ) : (
          <div className="state-message">No upcoming matches scheduled.</div>
        )}
      </div>

      <div className="dashboard-stats-row">
        <div className="dashboard-stat">
          <div className="dashboard-stat-val">{players.length}</div>
          <div className="dashboard-stat-label">SQUAD</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-val stat-danger">{injuredCount}</div>
          <div className="dashboard-stat-label">INJURED</div>
        </div>
        <div className="dashboard-stat">
          <div className="dashboard-stat-val">{refereeCount}</div>
          <div className="dashboard-stat-label">REFS</div>
        </div>
      </div>

      <div>
        <div className="dashboard-card-label">SQUAD DISCIPLINE</div>
        <div className="squad-discipline-card">
          {hasDisciplineIssues ? (
            <div className="squad-discipline-rows">
              {suspendedPlayers.map((p) => (
                <div key={`susp-${p.id}`} className="squad-discipline-row">
                  <span className="squad-discipline-badge squad-discipline-badge-danger">
                    SUSPENDED
                  </span>
                  <div className="squad-discipline-info">
                    <div className="squad-discipline-name">{p.name}</div>
                    <div className="squad-discipline-meta">
                      {p.red_cards} red card{p.red_cards === 1 ? '' : 's'} · 1 match ban
                    </div>
                  </div>
                </div>
              ))}
              {dangerZonePlayers.map((p) => (
                <div key={`danger-${p.id}`} className="squad-discipline-row">
                  <span className="squad-discipline-badge squad-discipline-badge-warn">
                    AT RISK
                  </span>
                  <div className="squad-discipline-info">
                    <div className="squad-discipline-name">{p.name}</div>
                    <div className="squad-discipline-meta">{dangerZoneMeta(p)}</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="squad-discipline-clean">
              <span className="squad-discipline-pill">SQUAD ELIGIBLE</span>
              <span className="squad-discipline-clean-text">
                No suspensions or disciplinary flags
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="dashboard-links">
        <button className="dashboard-link" onClick={() => onNavigate('lineup')}>
          Lineup Builder <span className="dashboard-link-arrow">›</span>
        </button>
        <button className="dashboard-link" onClick={() => onNavigate('squad')}>
          Squad View <span className="dashboard-link-arrow">›</span>
        </button>
        <button className="dashboard-link" onClick={() => onNavigate('matchmaker')}>
          Friendly Matchmaker <span className="dashboard-link-arrow">›</span>
        </button>
        <button className="dashboard-link" onClick={() => onNavigate('referees')}>
          Referees <span className="dashboard-link-arrow">›</span>
        </button>
        <button className="dashboard-link" onClick={() => onNavigate('checkin')}>
          Check-in <span className="dashboard-link-arrow">›</span>
        </button>
      </div>

      {nextMatch && (
        <button className="pitch-sheet-trigger" onClick={() => setPitchSheetOpen(true)}>
          Generate Official Pitch Sheet
        </button>
      )}

      {pitchSheetOpen && (
        <PitchSheetModal matchId={nextMatch.id} onClose={() => setPitchSheetOpen(false)} />
      )}
    </div>
  );
}
