import { FORMATION_SLOTS } from './hub/LineupBuilderScreen.jsx';

export function assignToPitch(players) {
  const byGroup = { GK: [], DF: [], MF: [], FW: [] };
  for (const p of players) byGroup[p.position]?.push(p);
  return FORMATION_SLOTS.map((slot) => ({ slot, player: byGroup[slot.group]?.shift() ?? null })).filter(
    (row) => row.player
  );
}

export default function IgExportModal({ totwSlots, onClose }) {
  return (
    <div className="ig-export-overlay" onClick={onClose}>
      <div className="ig-export-modal" onClick={(e) => e.stopPropagation()}>
        <div className="ig-story-preview">
          <div className="ig-story-header">
            <div className="brand-mark ig-story-logo" aria-hidden="true">
              BLS
            </div>
            <div className="ig-story-brand">Borough League</div>
          </div>
          <div className="ig-story-title">Team of the Week</div>
          <div className="ig-story-pitch">
            {totwSlots.map(({ slot, player }) => (
              <div
                key={player.id}
                className="ig-story-player"
                style={{ left: `${slot.x}%`, top: `${slot.y}%` }}
              >
                {player.number}
              </div>
            ))}
          </div>
          <div className="ig-story-watermark">BOROUGHLEAGUESOCCER.COM</div>
        </div>
        <div className="ig-export-actions">
          <button className="ig-export-cancel" onClick={onClose}>
            Cancel
          </button>
          <button className="ig-export-share" onClick={onClose}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
