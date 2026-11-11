// apps/frontend/src/lib/api.js
import axios from 'axios';

export const API_BASE =
  import.meta.env.VITE_API_URL || "http://0.0.0.0:3000";

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' },
});

export function setToken(token) {
  if (token) {
    api.defaults.headers.common.Authorization = `Bearer ${token}`;
  } else {
    delete api.defaults.headers.common.Authorization;
  }
}

export async function register(name, email, password) {
  const { data } = await api.post('/auth/register', { name, email, password });
  return data;
}

export async function login(email, password) {
  const { data } = await api.post('/auth/login', { email, password });
  return data;
}

export async function createJob(jobData) {
  const { data } = await api.post('/jobs', jobData);
  return data;
}

export async function getJobs(params = {}) {
  const { data } = await api.get('/jobs', { params });
  return data;
}

export async function getJob(id) {
  const { data } = await api.get(`/jobs/${id}`);
  return data;
}

export async function deleteJob(id) {
  await api.delete(`/jobs/${id}`);
}

export async function getJobStats() {
  const { data } = await api.get('/jobs/stats');
  return data;
}

export async function getWorkers() {
  const { data } = await api.get('/workers');
  return data;
}
