import api from './axios';

export const getWAStatus    = ()     => api.get('/whatsapp/status');
export const connectWA      = ()     => api.post('/whatsapp/connect');
export const disconnectWA   = ()     => api.post('/whatsapp/disconnect');
export const startCampaign  = (data) => api.post('/whatsapp/campaign/start', data);
export const getCampaignStatus = ()  => api.get('/whatsapp/campaign/status');
export const stopCampaign   = ()     => api.post('/whatsapp/campaign/stop');
