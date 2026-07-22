import { useState } from 'react';
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

const ADMIN_CARDS = [
  {
    key: 'verify',
    title: 'Player Verification',
    description: 'Review pending eligibility and verify rostered players.',
    Icon: VerifyIcon,
  },
  {
    key: 'referees',
    title: 'Referee Management',
    description: 'Add, remove, and assign match officials.',
    Icon: RefereeIcon,
  },
  {
    key: 'roster',
    title: 'Roster & Team Management',
    description: 'Monitor team compliance and roster limits.',
    Icon: RosterIcon,
  },
  {
    key: 'matchops',
    title: 'Match Operations',
    description: 'Override official pitch sheets and match-day logistics.',
    Icon: MatchOpsIcon,
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
  const [activeView, setActiveView] = useState('dashboard');

  if (activeView === 'dashboard') {
    return (
      <div className="admin-grid">
        {ADMIN_CARDS.map(({ key, title, description, Icon }) => (
          <button key={key} className="admin-card" onClick={() => setActiveView(key)}>
            <div className="admin-card-icon">
              <Icon />
            </div>
            <div className="admin-card-title">{title}</div>
            <div className="admin-card-desc">{description}</div>
          </button>
        ))}
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
