import { useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import Crest from '../../Crest.jsx';
import SignInScreen from './SignInScreen.jsx';
import DashboardScreen from './DashboardScreen.jsx';
import LineupBuilderScreen from './LineupBuilderScreen.jsx';
import SquadScreen from './SquadScreen.jsx';
import MatchmakerScreen from './MatchmakerScreen.jsx';
import RefereesScreen from './RefereesScreen.jsx';
import CheckinScreen from './CheckinScreen.jsx';
import DirectorHub from './DirectorHub.jsx';

const COACH_TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'lineup', label: 'Lineup' },
  { key: 'squad', label: 'Squad' },
  { key: 'matchmaker', label: 'Matchmaker' },
  { key: 'referees', label: 'Referees' },
  { key: 'checkin', label: 'Check-in' },
];

export default function TeamHubScreen() {
  const { user, team, loading, logout } = useAuth();
  const [hubScreen, setHubScreen] = useState(null);

  if (loading) return <div className="state-message">Loading…</div>;
  if (!user) return <SignInScreen />;

  const isCoach = user.role === 'coach_manager';
  const isDirector = user.role === 'league_director';
  const tabs = isCoach ? COACH_TABS : [];
  const activeScreen = hubScreen ?? tabs[0]?.key ?? null;

  return (
    <div className="hub-screen">
      {!isDirector && (
        <div className="hub-topbar">
          <div className="hub-topbar-identity">
            {isCoach && <Crest src={team?.logo_url} size={32} />}
            <div className="hub-team-name">
              {isCoach ? `${team?.name} · Hub` : user.email}
            </div>
          </div>
          <button className="hub-signout" onClick={logout}>
            Sign Out
          </button>
        </div>
      )}

      {tabs.length > 0 && (
        <div className="chip-row hub-tab-row">
          {tabs.map((t) => (
            <button
              key={t.key}
              className={`chip ${activeScreen === t.key ? 'chip-active' : ''}`}
              onClick={() => setHubScreen(t.key)}
            >
              {t.label}
            </button>
          ))}
        </div>
      )}

      {isCoach && activeScreen === 'dashboard' && <DashboardScreen onNavigate={setHubScreen} />}
      {isCoach && activeScreen === 'lineup' && <LineupBuilderScreen />}
      {isCoach && activeScreen === 'squad' && <SquadScreen />}
      {isCoach && activeScreen === 'matchmaker' && <MatchmakerScreen />}
      {isCoach && activeScreen === 'referees' && <RefereesScreen />}
      {isCoach && activeScreen === 'checkin' && <CheckinScreen />}

      {isDirector && <DirectorHub />}

      {user.role === 'referee' && (
        <div className="state-message">
          Signed in as referee. Go to Matches, open a match you're assigned to, and use Referee
          Sign-Off to submit the match sheet.
        </div>
      )}
    </div>
  );
}
