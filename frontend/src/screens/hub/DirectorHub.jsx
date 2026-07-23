import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';
import EmptyState from '../../EmptyState.jsx';
import ListRow from '../../ListRow.jsx';
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
  const [refereeCount, setRefereeCount] = useState(null);

  useEffect(() => {
    api
      .getPlayers()
      .then((players) => setPendingCount(players.filter((p) => !p.verified).length))
      .catch(() => setPendingCount(null));
    api
      .getReferees()
      .then((refs) => setRefereeCount(refs.length))
      .catch(() => setRefereeCount(null));
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

        {pendingCount > 0 && (
          <div className="action-banner">
            <div className="action-banner-title">
              {pendingCount} Player{pendingCount === 1 ? '' : 's'} Await Verification
            </div>
            <button className="action-banner-cta" onClick={() => setActiveView('verify')}>
              Review Now
            </button>
          </div>
        )}

        <div className="dashboard-card-label">MATCHDAY & OFFICIATING</div>
        <div className="inset-list">
          <ListRow
            icon={<MatchOpsIcon />}
            title="Match Operations"
            badge="Soon"
            badgeTone="neutral"
            onClick={() => setActiveView('matchops')}
          />
          <ListRow
            icon={<RefereeIcon />}
            title="Referee Assignments"
            badge={refereeCount !== null ? `${refereeCount} Referees` : '—'}
            badgeTone="info"
            onClick={() => setActiveView('referees')}
          />
        </div>

        <div className="dashboard-card-label discipline-section-spacing">LEAGUE ADMINISTRATION</div>
        <div className="inset-list">
          <ListRow
            icon={<VerifyIcon />}
            title="Player Verification"
            badge={pendingCount !== null ? `${pendingCount} Pending` : '—'}
            badgeTone={pendingCount > 0 ? 'warn' : 'success'}
            onClick={() => setActiveView('verify')}
          />
          <ListRow
            icon={<RosterIcon />}
            title="Roster & Team Management"
            badge="Soon"
            badgeTone="neutral"
            onClick={() => setActiveView('roster')}
          />
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
