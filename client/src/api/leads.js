import api from './axios';

export const getLeads            = (params) => api.get('/leads',        { params });
export const getLead             = (id)     => api.get(`/leads/${id}`);
export const updateLead          = (id, data) => api.patch(`/leads/${id}`, data);
export const deleteLead          = (id)     => api.delete(`/leads/${id}`);
export const deleteAllLeads      = ()       => api.delete('/leads/all');
export const deleteSelectedLeads = (ids)    => api.post('/leads/bulk-delete', { ids });
export const getStats            = ()       => api.get('/leads/stats');
