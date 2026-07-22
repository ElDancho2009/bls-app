import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';
import EmptyState from '../../EmptyState.jsx';
import VerifyPlayersScreen from './VerifyPlayersScreen.jsx';

function VerifyIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="9" />
      <path d="M8 12.5l2.5 2.5L16 9.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function RefereeIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="4" width="14" height="9" rx="2" />
      <path d="M9 13v3a3 3 0 0 0 6 0v-3" strokeLinecap="round" />
      <circle cx="12" cy="19.5" r="1.5" />
    </svg>
  );
}

function RosterIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="3" width="16" height="18" rx="2" />
      <path d="M8 8h8M8 12h8M8 16h5" strokeLinecap="round" />
    </svg>
  );
}

function MatchOpsIcon() {
  return (
    <svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="5" y="5" width="14" height="15" rx="2" />
      <path d="M9 3h6v3H9z" />
      <path d="M8 12h3M8 16h8" strokeLinecap="round" />
    </svg>
  );
}

const VERIFY_CARD = {
  key: 'verify',
  title: 'Player Verification',
  description: 'Review pending eligibility and verify rostered players.',
  Icon: VerifyIcon,
};

const SECONDARY_CARDS = [
  {
    key: 'referees',
    title: 'Referee Management',
    description: 'Add, remove, and assign match officials.',
    Icon: RefereeIcon,
    badge: { text: '12 Active', tone: 'info' },
  },
  {
    key: 'roster',
    title: 'Roster & Team Management',
    description: 'Monitor team compliance and roster limits.',
    Icon: RosterIcon,
    badge: { text: '100% Locked', tone: 'success' },
  },
  {
    key: 'matchops',
    title: 'Match Operations',
    description: 'Override official pitch sheets and match-day logistics.',
    Icon: MatchOpsIcon,
    badge: { text: 'Next: Sat', tone: 'neutral' },
  },
];

const PLACEHOLDER_COPY = {
  referees: {
    Icon: RefereeIcon,
    title: 'Referee management is coming soon.',
    subtitle: 'Adding, removing, and assigning officials will live here.',
  },
  roster: {
    Icon: RosterIcon,
    title: 'Roster & team management is coming soon.',
    subtitle: 'Team compliance and roster-limit tools will live here.',
  },
  matchops: {
    Icon: MatchOpsIcon,
    title: 'Match operations is coming soon.',
    subtitle: 'Global pitch sheet overrides will live here.',
  },
};

export default function DirectorHub() {
  const { user, logout } = useAuth();
  const [activeView, setActiveView] = useState('dashboard');
  const [pendingCount, setPendingCount] = useState(null);

  useEffect(() => {
    api
      .getPlayers()
      .then((players) => setPendingCount(players.filter((p) => !p.verified).length))
      .catch(() => setPendingCount(null));
  }, []);

  if (activeView === 'dashboard') {
    return (
      <div>
        <header className="screen-header">
          <div className="brand-title">Director HQ</div>
        </header>

        <div className="director-header-row">
          <div className="director-account-badge">
            <span className="director-account-email">{user?.email}</span>
            <span className="director-role-tag">DIRECTOR</span>
          </div>
          <button className="director-signout" onClick={logout}>
            Sign Out
          </button>
        </div>

        <div className="admin-grid">
          <button className="admin-hero-card" onClick={() => setActiveView(VERIFY_CARD.key)}>
            {pendingCount !== null && (
              <span className="status-badge gold">{pendingCount} Pending</span>
            )}
            <div className="admin-card-icon">
              <VERIFY_CARD.Icon />
            </div>
            <div className="admin-hero-title-row">
              <div className="admin-card-title">{VERIFY_CARD.title}</div>
              <span className="admin-hero-arrow">→</span>
            </div>
            <div className="admin-card-desc">{VERIFY_CARD.description}</div>
          </button>

          <div className="admin-subgrid">
            {SECONDARY_CARDS.map(({ key, title, description, Icon, badge }) => (
              <button key={key} className="admin-card" onClick={() => setActiveView(key)}>
                <span className={`status-badge ${badge.tone}`}>{badge.text}</span>
                <div className="admin-card-icon">
                  <Icon />
                </div>
                <div className="admin-card-title">{title}</div>
                <div className="admin-card-desc">{description}</div>
              </button>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const placeholder = PLACEHOLDER_COPY[activeView];

  return (
    <div>
      <button className="close-button" onClick={() => setActiveView('dashboard')}>
        ← Back to Dashboard
      </button>

      {activeView === 'verify' && <VerifyPlayersScreen />}
      {placeholder && (
        <EmptyState
          icon={<placeholder.Icon />}
          title={placeholder.title}
          subtitle={placeholder.subtitle}
        />
      )}
    </div>
  );
}
