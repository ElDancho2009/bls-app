import { useState } from 'react';
import MatchesScreen from './screens/MatchesScreen.jsx';
import MatchCenterScreen from './screens/MatchCenterScreen.jsx';
import LeaguesScreen from './screens/LeaguesScreen.jsx';
import CardsScreen from './screens/CardsScreen.jsx';
import TeamHubScreen from './screens/hub/TeamHubScreen.jsx';

const TABS = [
  { key: 'matches', label: 'Matches' },
  { key: 'leagues', label: 'Leagues' },
  { key: 'stats', label: 'Cards' },
  { key: 'hub', label: 'Team Hub' },
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
              {tab.label}
            </button>
          ))}
        </nav>
      )}
    </div>
  );
}
