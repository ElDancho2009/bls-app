import { useEffect, useState } from 'react';
import { api } from '../../api.js';
import ListRow from '../../ListRow.jsx';
import Skeleton from '../../Skeleton.jsx';

function CardIcon({ tone }) {
  return <span className={`card-swatch card-swatch-${tone}`} />;
}

function fairPlayScore(players) {
  const penalty = players.reduce((sum, p) => sum + p.yellow_cards * 5 + p.red_cards * 15, 0);
  return Math.max(0, 100 - penalty);
}

function fairPlayTier(score) {
  if (score >= 90) return { label: 'Excellent', tone: 'success' };
  if (score >= 70) return { label: 'Good', tone: 'info' };
  if (score >= 50) return { label: 'Fair', tone: 'warn' };
  return { label: 'Poor', tone: 'danger' };
}

function lastIncidentLine(player, fallback) {
  const last = player.incidents?.[player.incidents.length - 1];
  if (!last) return fallback;
  return `${last.type === 'red' ? 'Red card' : 'Yellow card'} vs ${last.opponent_name} · ${last.minute}'`;
}

export default function SquadDiscipline({ team, players }) {
  const [suspended, setSuspended] = useState([]);
  const [dangerZone, setDangerZone] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!team) return;
    api
      .getDiscipline(team.id)
      .then(({ suspended, dangerZone }) => {
        setSuspended(suspended);
        setDangerZone(dangerZone);
      })
      .finally(() => setLoading(false));
  }, [team]);

  if (loading) {
    return (
      <div className="squad-discipline">
        <Skeleton style={{ height: 48, borderRadius: 12 }} />
      </div>
    );
  }

  const score = fairPlayScore(players);
  const tier = fairPlayTier(score);

  return (
    <div className="squad-discipline">
      <div className="dashboard-card-label">ACTIVE SUSPENSIONS</div>
      {suspended.length === 0 ? (
        <div className="discipline-clean-pill">0 Active Suspensions</div>
      ) : (
        <div className="inset-list">
          {suspended.map((p) => (
            <ListRow
              key={p.id}
              icon={<CardIcon tone="red" />}
              title={p.name}
              subtitle={lastIncidentLine(p, 'Red card suspension')}
              badge="1 match ban"
              badgeTone="danger"
              chevron={false}
            />
          ))}
        </div>
      )}

      <div className="dashboard-card-label discipline-section-spacing">YELLOW CARD ACCUMULATION</div>
      {dangerZone.length === 0 ? (
        <div className="discipline-clean-pill discipline-clean-pill-neutral">No accumulation warnings</div>
      ) : (
        <div className="inset-list">
          {dangerZone.map((p) => (
            <ListRow
              key={p.id}
              icon={<CardIcon tone="yellow" />}
              title={p.name}
              subtitle={lastIncidentLine(p, `${p.yellow_cards} yellow cards accumulated`)}
              badge={`${p.yellow_cards} YC`}
              badgeTone="warn"
              chevron={false}
            />
          ))}
        </div>
      )}

      <div className="dashboard-card-label discipline-section-spacing">FAIR PLAY RATING</div>
      <div className="fair-play-card">
        <div className="fair-play-row">
          <span className={`fair-play-tier fair-play-tier-${tier.tone}`}>{tier.label}</span>
          <span className="fair-play-score">{score}/100</span>
        </div>
        <div className="progress-bar">
          <div className={`progress-bar-fill progress-bar-fill-${tier.tone}`} style={{ width: `${score}%` }} />
        </div>
      </div>
    </div>
  );
}
