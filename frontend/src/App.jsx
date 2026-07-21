import { useState } from 'react';
import MatchesScreen from './screens/MatchesScreen.jsx';
import MatchCenterScreen from './screens/MatchCenterScreen.jsx';
import LeaguesScreen from './screens/LeaguesScreen.jsx';
import CardsScreen from './screens/CardsScreen.jsx';
import TeamHubScreen from './screens/hub/TeamHubScreen.jsx';

function MatchesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="8" />
    </svg>
  );
}

function LeaguesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="4" y1="6" x2="20" y2="6" />
      <line x1="4" y1="12" x2="20" y2="12" />
      <line x1="4" y1="18" x2="20" y2="18" />
    </svg>
  );
}

function PlayersIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="5" y1="20" x2="5" y2="12" />
      <line x1="12" y1="20" x2="12" y2="8" />
      <line x1="19" y1="20" x2="19" y2="4" />
    </svg>
  );
}

function HubIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
    </svg>
  );
}

const TABS = [
  { key: 'matches', label: 'Matches', Icon: MatchesIcon },
  { key: 'leagues', label: 'Leagues', Icon: LeaguesIcon },
  { key: 'stats', label: 'Players', Icon: PlayersIcon },
  { key: 'hub', label: 'Team Hub', Icon: HubIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [selectedMatchId, setSelectedMatchId] = useState(null);

  const showMatchCenter = activeTab === 'matches' && selectedMatchId != null;

  return (
    <div className="app-shell">
      <div className="app-content">
        {activeTab === 'matches' && !showMatchCenter && (
          <MatchesScreen onSelectMatch={setSelectedMatchId} />
        )}

        {showMatchCenter && (
          <MatchCenterScreen matchId={selectedMatchId} onClose={() => setSelectedMatchId(null)} />
        )}

        {activeTab === 'leagues' && <LeaguesScreen />}
        {activeTab === 'stats' && <CardsScreen />}

        {activeTab === 'hub' && <TeamHubScreen />}
      </div>

      {!showMatchCenter && (
        <nav className="tab-bar">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              className={`tab-button ${activeTab === tab.key ? 'active' : ''}`}
              onClick={() => setActiveTab(tab.key)}
            >
              <span className="tab-icon">
                <tab.Icon />
              </span>
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
