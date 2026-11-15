import api from './axios';

export const analyzeLead = (id) => api.post(`/analyze/${id}`);
export const generatePitch = (id, language) => api.post(`/analyze/${id}/pitch`, { language });
