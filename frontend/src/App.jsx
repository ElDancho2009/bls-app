import { useState } from 'react';
import MatchesScreen from './screens/MatchesScreen.jsx';
import MatchCenterScreen from './screens/MatchCenterScreen.jsx';
import NewsScreen from './screens/NewsScreen.jsx';
import LeaguesScreen from './screens/LeaguesScreen.jsx';
import CardsScreen from './screens/CardsScreen.jsx';
import TeamPageScreen from './screens/TeamPageScreen.jsx';
import RefSheetScreen from './screens/RefSheetScreen.jsx';
import TeamHubScreen from './screens/hub/TeamHubScreen.jsx';
import Toast from './Toast.jsx';

function MatchesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path
        d="M12 8L15.8 10.8L14.3 15.2H9.7L8.2 10.8Z M12 8L12 5.5 M15.8 10.8L18.2 10.1 M14.3 15.2L15.8 17.2 M9.7 15.2L8.2 17.2 M8.2 10.8L5.8 10.1"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

function NewsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 10L14 5V19L3 14V10Z" strokeLinejoin="round" />
      <path d="M7 14v4a1 1 0 0 0 1 1h1a1 1 0 0 0 1-1v-3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M17 9a5 5 0 0 1 0 6" strokeLinecap="round" />
    </svg>
  );
}

function LeaguesIcon() {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" strokeLinejoin="round" />
      <path d="M7 5H4v2a3 3 0 0 0 3 3M17 5h3v2a3 3 0 0 1-3 3" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 9v4M10 13h4l1 3H9l1-3zM8 19h8" strokeLinecap="round" strokeLinejoin="round" />
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
  { key: 'news', label: 'News', Icon: NewsIcon },
  { key: 'leagues', label: 'Leagues', Icon: LeaguesIcon },
  { key: 'stats', label: 'Players', Icon: PlayersIcon },
  { key: 'hub', label: 'Team Hub', Icon: HubIcon },
];

export default function App() {
  const [activeTab, setActiveTab] = useState('matches');
  const [overlayStack, setOverlayStack] = useState([]);

  const pushMatch = (id) => setOverlayStack((stack) => [...stack, { type: 'match', id }]);
  const pushTeam = (id) => setOverlayStack((stack) => [...stack, { type: 'team', id }]);
  const pushRefSheet = (id) => setOverlayStack((stack) => [...stack, { type: 'refsheet', id }]);
  const popOverlay = () => setOverlayStack((stack) => stack.slice(0, -1));

  const hasOverlay = overlayStack.length > 0;

  return (
    <div className="app-shell">
      <div className="app-content">
        {!hasOverlay && activeTab === 'matches' && <MatchesScreen onSelectMatch={pushMatch} />}
        {!hasOverlay && activeTab === 'news' && <NewsScreen onSelectMatch={pushMatch} />}
        {!hasOverlay && activeTab === 'leagues' && <LeaguesScreen onSelectTeam={pushTeam} />}
        {!hasOverlay && activeTab === 'stats' && <CardsScreen onSelectTeam={pushTeam} />}
        {!hasOverlay && activeTab === 'hub' && <TeamHubScreen />}

        {overlayStack.map((entry, i) => (
          <div key={i} style={{ display: i === overlayStack.length - 1 ? 'block' : 'none' }}>
            {entry.type === 'match' && (
              <MatchCenterScreen
                matchId={entry.id}
                onClose={popOverlay}
                onSelectTeam={pushTeam}
                onSelectRefSheet={pushRefSheet}
              />
            )}
            {entry.type === 'team' && (
              <TeamPageScreen teamId={entry.id} onClose={popOverlay} onSelectMatch={pushMatch} />
            )}
            {entry.type === 'refsheet' && (
              <RefSheetScreen matchId={entry.id} onClose={popOverlay} />
            )}
          </div>
        ))}
      </div>

      {!hasOverlay && (
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

      <Toast />
    </div>
  );
}
