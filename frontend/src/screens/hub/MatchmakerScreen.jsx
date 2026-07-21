import { useEffect, useState } from 'react';
import { useAuth } from '../../AuthContext.jsx';
import { api } from '../../api.js';

export default function MatchmakerScreen() {
  const { token } = useAuth();
  const [requests, setRequests] = useState([]);
  const [venues, setVenues] = useState([]);
  const [selectedVenue, setSelectedVenue] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [posting, setPosting] = useState(false);
  const [postedMessage, setPostedMessage] = useState(false);
  const [form, setForm] = useState({ date: '', time: '', venueId: '' });

  useEffect(() => {
    Promise.all([api.getFriendlyRequests(token), api.getVenues()])
      .then(([requestsData, venuesData]) => {
        setRequests(requestsData);
        setVenues(venuesData);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token]);

  async function handleInvite(requestId) {
    await api.inviteFriendlyRequest(requestId, token);
    setRequests((prev) => prev.map((r) => (r.id === requestId ? { ...r, invited: true } : r)));
  }

  async function handlePostOpenDate(e) {
    e.preventDefault();
    if (!form.date || !form.time) return;
    setPosting(true);
    try {
      await api.postFriendlyRequest(
        { date: form.date, time: form.time, venueId: form.venueId ? Number(form.venueId) : null },
        token
      );
      setPostedMessage(true);
      setForm({ date: '', time: '', venueId: '' });
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  }

  if (loading) return <div className="state-message">Loading matchmaker…</div>;
  if (error) return <div className="state-message error">Failed to load: {error}</div>;

  return (
    <div className="matchmaker-screen">
      <form className="post-open-date-form" onSubmit={handlePostOpenDate}>
        <div className="dashboard-card-label">POST AN OPEN DATE</div>
        <div className="post-open-date-fields">
          <input
            type="date"
            value={form.date}
            onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
            required
          />
          <input
            type="text"
            placeholder="Time (e.g. 10:00 AM)"
            value={form.time}
            onChange={(e) => setForm((f) => ({ ...f, time: e.target.value }))}
            required
          />
        </div>
        <select
          value={form.venueId}
          onChange={(e) => setForm((f) => ({ ...f, venueId: e.target.value }))}
        >
          <option value="">No venue selected</option>
          {venues.map((v) => (
            <option key={v.id} value={v.id}>
              {v.name}
            </option>
          ))}
        </select>
        <button type="submit" disabled={posting}>
          {posting ? 'Posting…' : '+ Post an Open Date'}
        </button>
        {postedMessage && (
          <div className="state-message post-success">
            Open date posted — other teams can now request a friendly.
          </div>
        )}
      </form>

      <div className="dashboard-card-label matchmaker-section-label">
        OPEN REQUESTS FROM OTHER TEAMS
      </div>
      <div className="matchmaker-requests">
        {requests.length === 0 && (
          <div className="state-message">No open requests right now.</div>
        )}
        {requests.map((r) => (
          <div key={r.id} className="matchmaker-row">
            <div className="matchmaker-info">
              <div className="matchmaker-team">{r.team_name}</div>
              <div className="matchmaker-details">
                {r.date} · {r.time} {r.venue ? `· ${r.venue.name}` : ''}
              </div>
            </div>
            {r.invited ? (
              <div className="matchmaker-invited">Invited ✓</div>
            ) : (
              <button className="matchmaker-invite-button" onClick={() => handleInvite(r.id)}>
                Invite
              </button>
            )}
          </div>
        ))}
      </div>

      <div className="dashboard-card-label matchmaker-section-label">NEUTRAL GROUNDS</div>
      <div className="venue-cards">
        {venues.map((v) => (
          <button key={v.id} className="venue-card" onClick={() => setSelectedVenue(v)}>
            <div className="venue-card-photo" />
            <div className="venue-card-info">
              <div className="venue-card-name">{v.name}</div>
              <div className="venue-card-borough">{v.borough}</div>
            </div>
          </button>
        ))}
      </div>

      {selectedVenue && (
        <div className="venue-guide-overlay" onClick={() => setSelectedVenue(null)}>
          <div className="venue-guide" onClick={(e) => e.stopPropagation()}>
            <button className="close-button" onClick={() => setSelectedVenue(null)}>
              ← Back
            </button>
            <div className="venue-guide-name">{selectedVenue.name}</div>
            <div className="venue-guide-borough">{selectedVenue.borough}</div>
            {selectedVenue.fields.map((field) => (
              <div key={field.name} className="venue-field-row">
                <div className="venue-field-name">
                  {field.name} <span className="venue-field-surface">{field.surface}</span>
                </div>
                <div className="venue-field-note">{field.note}</div>
              </div>
            ))}
            <div className="venue-guide-detail">
              <strong>Parking:</strong> {selectedVenue.parking}
            </div>
            <div className="venue-guide-detail">
              <strong>Cleats:</strong> {selectedVenue.cleats}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
