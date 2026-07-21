import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

export default function RefereesScreen() {
  const { team, token } = useAuth();
  const [nextMatch, setNextMatch] = useState(null);
  const [referees, setReferees] = useState([]);
  const [confirmedIds, setConfirmedIds] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!team) return;
    let cancelled = false;

    async function load() {
      try {
        const [matches, refereesData] = await Promise.all([api.getMatches(), api.getReferees()]);
        const next = matches
          .filter(
            (m) =>
              (m.status === 'upcoming' || m.status === 'live') &&
              (m.home_team_id === team.id || m.away_team_id === team.id)
          )
          .sort((a, b) => new Date(a.kickoff_at) - new Date(b.kickoff_at))[0];

        if (!cancelled) {
          setReferees(refereesData);
          setNextMatch(next || null);
        }

        if (next) {
          const confirmed = await api.getMatchReferees(next.id);
          if (!cancelled) setConfirmedIds(confirmed.map((r) => r.id));
        }
      } catch (err) {
        if (!cancelled) setError(err.message);
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, [team]);

  async function toggle(refId) {
    if (!nextMatch) return;
    if (confirmedIds.includes(refId)) {
      await api.unconfirmReferee(nextMatch.id, refId, token);
      setConfirmedIds((prev) => prev.filter((id) => id !== refId));
    } else {
      await api.confirmReferee(nextMatch.id, refId, token);
      setConfirmedIds((prev) => [...prev, refId]);
    }
  }

  if (loading) return <div className="state-message">Loading referees…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;
  if (!nextMatch) {
    return <div className="state-message">No upcoming match to assign referees to.</div>;
  }

  return (
    <div className="referees-screen">
      <div className="state-message">
        {confirmedIds.length} of 2 referees confirmed for your next match
      </div>
      {referees.map((ref) => {
        const selected = confirmedIds.includes(ref.id);
        return (
          <button
            key={ref.id}
            className={`referee-row ${selected ? 'referee-selected' : ''} ${
              !ref.available ? 'referee-disabled' : ''
            }`}
            onClick={() => ref.available && toggle(ref.id)}
            disabled={!ref.available}
          >
            <div className="referee-name">{ref.name}</div>
            <div className="referee-level">{ref.level}</div>
            <div
              className={`referee-status ${ref.available ? 'status-available' : 'status-injured'}`}
            >
              {ref.available ? 'Available' : 'Unavailable'}
            </div>
          </button>
        );
      })}
    </div>
  );
}
