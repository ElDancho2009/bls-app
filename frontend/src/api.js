const BASE = '/api';

async function request(path, options = {}) {
  const res = await fetch(`${BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
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
  getMatches: () => request('/matches'),
  getMatch: (id) => request(`/matches/${id}`),
  voteMotm: (matchId, candidateId) =>
    request(`/matches/${matchId}/motm/${candidateId}/vote`, { method: 'POST' }),
};
