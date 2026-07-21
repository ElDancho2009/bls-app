import { useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import Crest from '../../Crest.jsx';
import SignInScreen from './SignInScreen.jsx';
import DashboardScreen from './DashboardScreen.jsx';
import LineupBuilderScreen from './LineupBuilderScreen.jsx';
import SquadScreen from './SquadScreen.jsx';
import MatchmakerScreen from './MatchmakerScreen.jsx';
import RefereesScreen from './RefereesScreen.jsx';

const HUB_TABS = [
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'lineup', label: 'Lineup' },
  { key: 'squad', label: 'Squad' },
  { key: 'matchmaker', label: 'Matchmaker' },
  { key: 'referees', label: 'Referees' },
];

export default function TeamHubScreen() {
  const { user, team, loading, logout } = useAuth();
  const [hubScreen, setHubScreen] = useState('dashboard');

  if (loading) return <div className="state-message">Loading…</div>;
  if (!user) return <SignInScreen />;

  return (
    <div className="hub-screen">
      <div className="hub-topbar">
        <div className="hub-topbar-identity">
          <Crest src={team?.logo_url} size={32} />
          <div className="hub-team-name">{team?.name.toUpperCase()} · HUB</div>
        </div>
        <button className="hub-signout" onClick={logout}>
          Sign Out
        </button>
      </div>

      <div className="chip-row hub-tab-row">
        {HUB_TABS.map((t) => (
          <button
            key={t.key}
            className={`chip ${hubScreen === t.key ? 'chip-active' : ''}`}
            onClick={() => setHubScreen(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      {hubScreen === 'dashboard' && <DashboardScreen onNavigate={setHubScreen} />}
      {hubScreen === 'lineup' && <LineupBuilderScreen />}
      {hubScreen === 'squad' && <SquadScreen />}
      {hubScreen === 'matchmaker' && <MatchmakerScreen />}
      {hubScreen === 'referees' && <RefereesScreen />}
    </div>
  );
}
