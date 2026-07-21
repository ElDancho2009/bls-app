function tierClass(rating) {
  if (rating >= 88) return 'tier-gold';
  if (rating >= 83) return 'tier-silver';
  return 'tier-bronze';
}

function statRows(player) {
  if (player.position === 'GK') {
    return [
      { label: 'Clean Sheets', val: player.clean_sheets },
      { label: 'Appearances', val: player.apps },
      { label: 'Yellow Cards', val: player.yellow_cards },
      { label: 'Red Cards', val: player.red_cards },
    ];
  }
  return [
    { label: 'Goals', val: player.goals },
    { label: 'Assists', val: player.assists },
    { label: 'Appearances', val: player.apps },
    { label: 'Yellow Cards', val: player.yellow_cards },
    { label: 'Red Cards', val: player.red_cards },
  ];
}

export default function PlayerDetailModal({ player, team, onClose }) {
  if (!player) return null;

  return (
    <div className="player-modal-overlay" onClick={onClose}>
      <div
        className={`player-modal ${tierClass(player.rating)}`}
        onClick={(e) => e.stopPropagation()}
      >
        <button className="close-button player-modal-close" onClick={onClose}>
          ← Back
        </button>

        <div className="player-modal-top">
          <div className="player-modal-rating">{player.rating}</div>
          <div>
            <div className="player-modal-name">{player.name}</div>
            <div className="player-modal-meta">
              {team?.name} · {player.position} · #{player.number}
            </div>
          </div>
        </div>

        <div className="player-modal-stats-grid">
          {statRows(player).map((stat) => (
            <div key={stat.label} className="player-modal-stat">
              <div className="player-modal-stat-val">{stat.val}</div>
              <div className="player-modal-stat-label">{stat.label}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
