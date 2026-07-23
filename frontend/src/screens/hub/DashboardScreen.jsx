import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';
import PitchSheetModal from './PitchSheetModal.jsx';
import SquadDiscipline from './SquadDiscipline.jsx';
import ListRow from '../../ListRow.jsx';

const QUICK_MENU = [
  { key: 'lineup', label: 'Lineup Builder' },
  { key: 'squad', label: 'Squad View' },
  { key: 'matchmaker', label: 'Friendly Matchmaker' },
  { key: 'referees', label: 'Referees' },
  { key: 'checkin', label: 'Check-in' },
];

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
      <div className="matchday-hero">
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
            <button className="pitch-sheet-trigger" onClick={() => setPitchSheetOpen(true)}>
              Generate Pitch Sheet
            </button>
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

      <SquadDiscipline team={team} players={players} />

      <div className="dashboard-card-label discipline-section-spacing">QUICK MENU</div>
      <div className="inset-list">
        {QUICK_MENU.map((item) => (
          <ListRow key={item.key} title={item.label} onClick={() => onNavigate(item.key)} />
        ))}
      </div>

      {pitchSheetOpen && (
        <PitchSheetModal matchId={nextMatch.id} onClose={() => setPitchSheetOpen(false)} />
      )}
    </div>
  );
}
