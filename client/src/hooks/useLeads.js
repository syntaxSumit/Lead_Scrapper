import { useState, useCallback } from 'react';
import toast from 'react-hot-toast';
import {
  getLeads,
  getStats,
  updateLead,
  deleteLead,
  deleteAllLeads,
  deleteSelectedLeads,
} from '../api/leads';

export function useLeads() {
  const [leads,   setLeads]   = useState([]);
  const [stats,   setStats]   = useState(null);
  const [total,   setTotal]   = useState(0);
  const [pages,   setPages]   = useState(1);
  const [loading, setLoading] = useState(false);

  const fetchLeads = useCallback(async (params = {}) => {
    setLoading(true);
    try {
      const { data } = await getLeads(params);
      setLeads(data.leads);
      setTotal(data.total);
      setPages(data.pages);
    } catch {
      toast.error('Failed to load leads');
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchStats = useCallback(async () => {
    try {
      const { data } = await getStats();
      setStats(data);
    } catch { /* non-critical */ }
  }, []);

  const patchLead = useCallback(async (id, data) => {
    try {
      const res = await updateLead(id, data);
      setLeads(prev => prev.map(l => l._id === id ? res.data : l));
      toast.success('Lead updated');
    } catch {
      toast.error('Update failed');
    }
  }, []);

  const removeLead = useCallback(async (id) => {
    try {
      await deleteLead(id);
      setLeads(prev => prev.filter(l => l._id !== id));
      setTotal(prev => Math.max(0, prev - 1));
      toast.success('Lead removed');
      await fetchStats();
    } catch {
      toast.error('Delete failed');
    }
  }, [fetchStats]);

  const removeAllLeads = useCallback(async () => {
    try {
      await deleteAllLeads();
      setLeads([]);
      setTotal(0);
      setPages(1);
      toast.success('All leads deleted');
      await fetchStats();
      return true;
    } catch {
      toast.error('Failed to delete all leads');
      return false;
    }
  }, [fetchStats]);

  const removeSelectedLeads = useCallback(async (ids) => {
    if (!ids || ids.length === 0) return false;
    try {
      await deleteSelectedLeads(ids);
      const idSet = new Set(ids);
      setLeads(prev => prev.filter(l => !idSet.has(l._id)));
      setTotal(prev => Math.max(0, prev - ids.length));
      toast.success(`${ids.length} lead${ids.length > 1 ? 's' : ''} deleted`);
      await fetchStats();
      return true;
    } catch {
      toast.error('Failed to delete selected leads');
      return false;
    }
  }, [fetchStats]);

  return {
    leads,
    stats,
    total,
    pages,
    loading,
    fetchLeads,
    fetchStats,
    patchLead,
    removeLead,
    removeAllLeads,
    removeSelectedLeads,
  };
}
