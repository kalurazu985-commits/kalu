import { io } from 'socket.io-client';

const API_BASE = (import.meta.env.VITE_API_BASE_URL || '').replace(/\/$/, '');
export const socket = io(API_BASE || undefined, { autoConnect: false, transports: ['websocket', 'polling'] });
export const connect = (token) => { socket.auth = { token }; socket.connect(); };

export async function api(path, token, body) {
  const res = await fetch(`${API_BASE}/api${path}`, {
    method: body !== undefined ? 'POST' : 'GET',
    headers: { 'Content-Type': 'application/json', ...(token ? { Authorization: `Bearer ${token}` } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error || `Request failed (${res.status})`);
  return data;
}
