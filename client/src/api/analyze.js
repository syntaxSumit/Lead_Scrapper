import api from './axios';

export const analyzeLead = (id) => api.post(`/analyze/${id}`);
