import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

export default function DashboardScreen({ onNavigate }) {
  const { team, token } = useAuth();
  const [matches, setMatches] = useState([]);
  const [teams, setTeams] = useState([]);
  const [players, setPlayers] = useState([]);
  const [refereeCount, setRefereeCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

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

  let opponentLine = null;
  let scheduleLine = null;
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
    opponentLine = `${isHome ? 'vs' : '@'} ${opponent?.name}`;
    scheduleLine = `${dateText} · ${timeText} · ${nextMatch.venue}`;
  }

  return (
    <div className="dashboard-screen">
      <div className="dashboard-card">
        <div className="dashboard-card-label">NEXT MATCHDAY</div>
        {nextMatch ? (
          <>
            <div className="dashboard-next-match">{opponentLine}</div>
            <div className="dashboard-next-match-sub">{scheduleLine}</div>
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
      </div>
    </div>
  );
}
