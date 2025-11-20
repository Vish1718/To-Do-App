import axios from 'axios';

const API_BASE = import.meta.env.VITE_APP_API_URL || 'http://localhost:5000';

const client = axios.create({
  baseURL: `${API_BASE}/api`,
  headers: {
    'Content-Type': 'application/json'
  },
  timeout: 10000
});

export async function fetchTasks({ start, end, q } = {}) {
  const params = {};
  if (start) params.start = start;
  if (end) params.end = end;
  if (q) params.q = q;
  const res = await client.get('/tasks', { params });
  return res.data;
}

export async function createTask(payload) {
  const res = await client.post('/tasks', payload);
  return res.data;
}

export async function updateTask(id, payload) {
  const res = await client.put(`/tasks/${id}`, payload);
  return res.data;
}

export async function patchTask(id, payload) {
  const res = await client.patch(`/tasks/${id}`, payload);
  return res.data;
}

export async function deleteTask(id) {
  const res = await client.delete(`/tasks/${id}`);
  return res.data;
}
