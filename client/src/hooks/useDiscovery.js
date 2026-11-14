import { useState } from 'react';
import toast from 'react-hot-toast';
import { searchPlaces } from '../api/places';

export function useDiscovery(onSuccess) {
  const [loading, setLoading] = useState(false);

  async function discover(params) {
    setLoading(true);
    try {
      const { data } = await searchPlaces(params);
      toast.success(`Found ${data.count} businesses`);
      onSuccess?.(data.leads);
    } catch (err) {
      toast.error(err.response?.data?.error || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  return { discover, loading };
}
