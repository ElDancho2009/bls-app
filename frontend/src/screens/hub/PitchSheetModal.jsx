import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

function PitchSheetRow({ p }) {
  return (
    <div className="pitch-sheet-row">
      <div className="pitch-sheet-num">{p.num}</div>
      <div className="pitch-sheet-name">{p.name}</div>
      <div className="pitch-sheet-pos">{p.pos}</div>
      {p.verified && <div className="pitch-sheet-verified">VERIFIED</div>}
    </div>
  );
}

export default function PitchSheetModal({ matchId, onClose }) {
  const { token } = useAuth();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    api.getPitchSheet(matchId, token).then(setData).catch((err) => setError(err.message));
  }, [matchId, token]);

  return (
    <div className="pitch-sheet-overlay" onClick={onClose}>
      <div className="pitch-sheet-modal" onClick={(e) => e.stopPropagation()}>
        <div className="pitch-sheet-header">
          <div className="brand-mark pitch-sheet-logo" aria-hidden="true">
            BLS
          </div>
          <div className="pitch-sheet-title">OFFICIAL PITCH SHEET</div>
        </div>

        {error && <div className="state-message error">Failed to load: {error}</div>}
        {!error && !data && <div className="state-message">Loading…</div>}

        {data && (
          <>
            <div className="pitch-sheet-section-label">STARTING XI</div>
            <div className="pitch-sheet-list">
              {data.starters.length === 0 && (
                <div className="state-message">No lineup submitted yet.</div>
              )}
              {data.starters.map((p) => (
                <PitchSheetRow key={p.playerId} p={p} />
              ))}
            </div>

            <div className="pitch-sheet-section-label">SUBSTITUTES</div>
            <div className="pitch-sheet-list">
              {data.substitutes.length === 0 && (
                <div className="state-message">No substitutes on the bench.</div>
              )}
              {data.substitutes.map((p) => (
                <PitchSheetRow key={p.playerId} p={p} />
              ))}
            </div>
          </>
        )}

        <div className="pitch-sheet-actions">
          <button className="pitch-sheet-close" onClick={onClose}>
            Close
          </button>
          <button className="pitch-sheet-share" onClick={onClose}>
            Share
          </button>
        </div>
      </div>
    </div>
  );
}
