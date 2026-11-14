import api from './axios';

export const searchPlaces     = (data)     => api.post('/places/search', data);
export const getSavedSearches = ()         => api.get('/places/saved');
export const saveSearch       = (data)     => api.post('/places/saved', data);
export const deleteSavedSearch= (id)       => api.delete(`/places/saved/${id}`);
