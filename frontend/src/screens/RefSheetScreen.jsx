import { useEffect, useState } from 'react';
import { useAuth } from '../AuthContext.jsx';
import { useToast } from '../ToastContext.jsx';
import { api } from '../api.js';
import Crest from '../Crest.jsx';

export default function RefSheetScreen({ matchId, onClose }) {
  const { user, token, loading: authLoading } = useAuth();
  const showToast = useToast();
  const [data, setData] = useState(null);
  const [error, setError] = useState(null);
  const [assignedReferees, setAssignedReferees] = useState(null);
  const [pin, setPin] = useState('');
  const [motmPick, setMotmPick] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.getMatch(matchId).then(setData).catch((err) => setError(err.message));
    api.getMatchReferees(matchId).then(setAssignedReferees).catch(() => setAssignedReferees([]));
  }, [matchId]);

  if (error) return <div className="state-message error">Failed to load: {error}</div>;
  if (!data || !assignedReferees || authLoading) {
    return <div className="state-message">Loading referee sheet…</div>;
  }

  const { match, homeTeam, awayTeam, events, lineups } = data;
  const submitted = !!match.ref_sheet_submitted_at;
  const goalscorers = events.filter((e) => e.type === 'goal');
  const cardEvents = events.filter((e) => e.type === 'yellow' || e.type === 'red');
  const motmOptions = [...lineups.home, ...lineups.away];

  const isDirector = user?.role === 'league_director';
  const isAssignedReferee =
    user?.role === 'referee' && assignedReferees.some((r) => r.id === user.referee_id);
  const canSignOff = isDirector || isAssignedReferee;

  async function handleSubmit() {
    if (!motmPick) return;
    setSubmitting(true);
    try {
      const updated = await api.submitSignoff(matchId, { pin, motmPlayerId: Number(motmPick) }, token);
      setData((prev) => ({ ...prev, match: updated }));
      showToast('Referee sign-off submitted');
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="ref-sheet">
      <button className="close-button" onClick={onClose}>
        ← Back
      </button>
      <div className="ref-sheet-title">Referee Sign-Off</div>

      {submitted ? (
        <div className="ref-sheet-submitted">
          <div className="ref-sheet-submitted-title">✓ SUBMITTED</div>
          <div className="ref-sheet-submitted-body">Match sheet submitted to the league office.</div>
        </div>
      ) : !canSignOff ? (
        <div className="ref-sheet-pin-screen">
          <div className="ref-sheet-pin-title">{user ? 'NOT AUTHORIZED' : 'SIGN IN REQUIRED'}</div>
          <div className="ref-sheet-pin-hint">
            {user
              ? "You're not the referee assigned to this match."
              : 'Sign in as the assigned referee or a league director (via Team Hub) to submit this match sheet.'}
          </div>
        </div>
      ) : (
        <>
          <div className="ref-sheet-score-row">
            <div className="ref-sheet-team">
              <Crest src={homeTeam.logo_url} size={22} />
              <span>{homeTeam.name}</span>
            </div>
            <div className="ref-sheet-score">
              {match.home_score}-{match.away_score}
            </div>
            <div className="ref-sheet-team">
              <span>{awayTeam.name}</span>
              <Crest src={awayTeam.logo_url} size={22} />
            </div>
          </div>

          <div className="leaderboard-section-title">GOALSCORERS</div>
          <div className="ref-sheet-list">
            {goalscorers.length === 0 && <div className="state-message">No goals recorded.</div>}
            {goalscorers.map((g) => (
              <div key={g.id} className="ref-sheet-row">
                <div className="ref-sheet-minute">{g.minute}'</div>
                <div className="ref-sheet-player">{g.player_name}</div>
              </div>
            ))}
          </div>

          <div className="leaderboard-section-title">CARD LOG</div>
          <div className="ref-sheet-list">
            {cardEvents.length === 0 && <div className="state-message">No cards recorded.</div>}
            {cardEvents.map((c) => (
              <div key={c.id} className="ref-sheet-row">
                <div
                  className={`ref-sheet-card-swatch ${c.type === 'red' ? 'card-red' : 'card-yellow'}`}
                />
                <div className="ref-sheet-player ref-sheet-player-flex">{c.player_name}</div>
                <div className="ref-sheet-minute">{c.minute}'</div>
              </div>
            ))}
          </div>

          <div className="leaderboard-section-title">MAN OF THE MATCH</div>
          <div className="ref-sheet-motm-select-wrap">
            <select
              className="ref-sheet-motm-select"
              value={motmPick}
              onChange={(e) => setMotmPick(e.target.value)}
            >
              <option value="">Select a player…</option>
              {motmOptions.map((p) => (
                <option key={p.player_id} value={p.player_id}>
                  {p.player_name}
                </option>
              ))}
            </select>
          </div>

          {isAssignedReferee && (
            <>
              <div className="leaderboard-section-title">REFEREE PIN</div>
              <div className="ref-sheet-pin-hint">
                Enter the 4-digit PIN for this match to confirm you're on the pitch.
              </div>
              <input
                type="password"
                maxLength={4}
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                className="ref-sheet-pin-input"
              />
            </>
          )}

          <button
            className="ref-sheet-submit-button"
            onClick={handleSubmit}
            disabled={!motmPick || submitting || (isAssignedReferee && pin.length !== 4)}
          >
            {submitting ? 'Submitting…' : 'Submit Match Sheet'}
          </button>
        </>
      )}
    </div>
  );
}
