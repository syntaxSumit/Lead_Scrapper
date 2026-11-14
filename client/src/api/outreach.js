import api from './axios';

export const generateOutreach = (id, language) =>
  api.post(`/outreach/${id}/generate`, { language });
