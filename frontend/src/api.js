const BASE = '/api';

async function request(path, options = {}, token) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...(options.headers || {}),
    },
  });

  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `Request failed: ${res.status}`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export const api = {
  getTeams: () => request('/teams'),
  getTeam: (id) => request(`/teams/${id}`),
  getMatches: () => request('/matches'),
  getMatch: (id) => request(`/matches/${id}`),
  voteMotm: (matchId, candidateId) =>
    request(`/matches/${matchId}/motm/${candidateId}/vote`, { method: 'POST' }),
  getStandings: (division) => request(`/standings${division ? `?division=${division}` : ''}`),
  getPlayers: (teamId) => request(`/players${teamId ? `?team_id=${teamId}` : ''}`),
  createPlayer: ({ name, number, position, teamId }, token) =>
    request('/players', { method: 'POST', body: JSON.stringify({ name, number, position, teamId }) }, token),

  login: (email, password) =>
    request('/auth/login', { method: 'POST', body: JSON.stringify({ email, password }) }),
  logout: (token) => request('/auth/logout', { method: 'POST' }, token),
  getMe: (token) => request('/auth/me', {}, token),

  patchPlayerStatus: (playerId, status, token) =>
    request(`/players/${playerId}/status`, { method: 'PATCH', body: JSON.stringify({ status }) }, token),
  verifyPlayer: (playerId, verified, token) =>
    request(`/players/${playerId}/verify`, { method: 'PUT', body: JSON.stringify({ verified }) }, token),

  putMatchLineup: (matchId, body, token) =>
    request(`/matches/${matchId}/lineup`, { method: 'PUT', body: JSON.stringify(body) }, token),

  getCheckins: (matchId, token) => request(`/matches/${matchId}/checkins`, {}, token),
  toggleCheckin: (matchId, playerId, token) =>
    request(`/matches/${matchId}/checkins/${playerId}`, { method: 'POST' }, token),
  getPitchSheet: (matchId, token) => request(`/matches/${matchId}/pitch-sheet`, {}, token),

  submitSignoff: (matchId, { pin, motmPlayerId }, token) =>
    request(
      `/matches/${matchId}/signoff`,
      { method: 'POST', body: JSON.stringify({ pin, motmPlayerId }) },
      token
    ),

  getReferees: () => request('/referees'),
  getMatchReferees: (matchId) => request(`/matches/${matchId}/referees`),
  confirmReferee: (matchId, refId, token) =>
    request(`/matches/${matchId}/referees/${refId}`, { method: 'POST' }, token),
  unconfirmReferee: (matchId, refId, token) =>
    request(`/matches/${matchId}/referees/${refId}`, { method: 'DELETE' }, token),

  getVenues: () => request('/venues'),

  getBulletins: () => request('/bulletins'),
  postNews: ({ title, body }, token) =>
    request('/news', { method: 'POST', body: JSON.stringify({ title, body }) }, token),
  getMatchOfWeek: () => request('/matches/motw'),
  getDiscipline: () => request('/discipline'),

  getGotw: () => request('/gotw'),
  voteGotw: (clipId) => request(`/gotw/${clipId}/vote`, { method: 'POST' }),
  getPotw: () => request('/potw'),
  votePotw: (candidateId) => request(`/potw/${candidateId}/vote`, { method: 'POST' }),
  getTotw: () => request('/totw'),

  getFriendlyRequests: (token) => request('/friendly-requests', {}, token),
  postFriendlyRequest: (body, token) =>
    request('/friendly-requests', { method: 'POST', body: JSON.stringify(body) }, token),
  inviteFriendlyRequest: (id, token) =>
    request(`/friendly-requests/${id}/invite`, { method: 'POST' }, token),
};
