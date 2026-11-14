import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import { getSavedSearches, deleteSavedSearch } from '../../api/places.js';

export default function SavedSearches({ onRun }) {
  const [searches, setSearches] = useState([]);

  useEffect(() => {
    getSavedSearches().then(r => setSearches(r.data)).catch(() => {});
  }, []);

  async function remove(id) {
    try {
      await deleteSavedSearch(id);
      setSearches(s => s.filter(x => x._id !== id));
      toast.success('Saved search removed');
    } catch {
      toast.error('Delete failed');
    }
  }

  if (searches.length === 0) return null;

  return (
    <div>
      <p className="text-xs font-medium text-muted mb-2">Saved Searches</p>
      <div className="flex flex-wrap gap-2">
        {searches.map(s => (
          <div key={s._id} className="flex items-center gap-1 bg-surface2 border border-border rounded-lg px-2 py-1">
            <button
              className="text-xs text-slate-300 hover:text-indigo-400 transition-colors"
              onClick={() => onRun(s)}
            >
              {s.name}
            </button>
            <button
              className="text-slate-500 hover:text-red-400 transition-colors ml-1"
              onClick={() => remove(s._id)}
              aria-label={`Delete ${s.name}`}
            >
              ×
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
