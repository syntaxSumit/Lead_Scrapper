import { useState } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Input from '../ui/Input.jsx';
import Select from '../ui/Select.jsx';
import Spinner from '../ui/Spinner.jsx';
import { IconSearch, IconMapPin, IconSparkles, IconSave, IconFlame } from '../ui/Icons.jsx';
import { saveSearch } from '../../api/places.js';

const INDIAN_STATES = [
  { value: '', label: 'Select State…' },
  { value: 'Delhi', label: 'Delhi / NCR' },
  { value: 'Maharashtra', label: 'Maharashtra' },
  { value: 'Karnataka', label: 'Karnataka' },
  { value: 'Haryana', label: 'Haryana' },
  { value: 'Uttar Pradesh', label: 'Uttar Pradesh' },
  { value: 'Gujarat', label: 'Gujarat' },
  { value: 'Punjab', label: 'Punjab' },
  { value: 'Rajasthan', label: 'Rajasthan' },
  { value: 'Tamil Nadu', label: 'Tamil Nadu' },
  { value: 'Telangana', label: 'Telangana' },
  { value: 'West Bengal', label: 'West Bengal' },
  { value: 'Kerala', label: 'Kerala' },
  { value: 'Madhya Pradesh', label: 'Madhya Pradesh' },
  { value: 'Bihar', label: 'Bihar' },
  { value: 'Andhra Pradesh', label: 'Andhra Pradesh' },
  { value: 'Goa', label: 'Goa' },
  { value: 'Himachal Pradesh', label: 'Himachal Pradesh' },
  { value: 'Uttarakhand', label: 'Uttarakhand' },
  { value: 'Jharkhand', label: 'Jharkhand' },
  { value: 'Chhattisgarh', label: 'Chhattisgarh' },
  { value: 'Odisha', label: 'Odisha' },
  { value: 'Assam', label: 'Assam' },
  { value: 'Chandigarh', label: 'Chandigarh' },
  { value: 'Jammu and Kashmir', label: 'Jammu & Kashmir' },
  { value: 'Puducherry', label: 'Puducherry' },
  { value: 'Tripura', label: 'Tripura' },
  { value: 'Meghalaya', label: 'Meghalaya' },
  { value: 'Manipur', label: 'Manipur' },
  { value: 'Nagaland', label: 'Nagaland' },
  { value: 'Arunachal Pradesh', label: 'Arunachal Pradesh' },
  { value: 'Mizoram', label: 'Mizoram' },
  { value: 'Sikkim', label: 'Sikkim' },
  { value: 'Ladakh', label: 'Ladakh' },
];

const CATEGORIES = [
  'salon', 'clinic', 'hospital', 'dentist', 'restaurant', 'cafe', 'gym', 'spa',
  'hotel', 'school', 'coaching', 'pharmacy', 'bakery', 'electronics', 'lawyer',
  'interior designer', 'caterer', 'travel agency', 'jewellery shop', 'other',
].map(c => ({ value: c, label: c.charAt(0).toUpperCase() + c.slice(1) }));

CATEGORIES.unshift({ value: '', label: 'Select category…' });

const LEAD_COUNT_OPTIONS = [
  { value: '10', label: '10 leads (Fastest)' },
  { value: '20', label: '20 leads (Standard)' },
  { value: '30', label: '30 leads' },
  { value: '40', label: '40 leads' },
  { value: '50', label: '50 leads' },
  { value: '60', label: '60 leads (Max)' },
];

export default function DiscoveryForm({ onResults, loading, onSearch }) {
  const [form, setForm] = useState({
    state: '',
    location: '',
    category: '',
    customCategory: '',
    onlyNeedWebsite: true,
    lat: null,
    lng: null,
    useLocation: false,
    limit: '20',
  });
  const [geoLoading, setGeoLoading] = useState(false);
  const [saveName, setSaveName]     = useState('');
  const [showSave, setShowSave]     = useState(false);

  const set = k => e => setForm(p => ({ ...p, [k]: e.target.value }));

  function useMyLocation() {
    if (!navigator.geolocation) return toast.error('Geolocation is not supported by your browser');
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      pos => {
        setForm(p => ({
          ...p,
          lat: pos.coords.latitude,
          lng: pos.coords.longitude,
          useLocation: true,
          location: '',
          state: '',
        }));
        setGeoLoading(false);
        toast.success('Location captured via GPS');
      },
      err => {
        setGeoLoading(false);
        if (err.code === 1) {
          toast.error('Location permission denied. Please allow location in your browser.');
        } else if (err.code === 2) {
          toast.error('Location unavailable. Please select your state or city.');
        } else if (err.code === 3) {
          toast.error('Location timed out. Please enter city or select state.');
        } else {
          toast.error('Could not get location. Enter city manually.');
        }
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 300000 }
    );
  }

  async function handleSubmit(e) {
    e.preventDefault();
    const cat = form.category === 'other' ? form.customCategory : form.category;
    if (!cat) return toast.error('Please select a business category');
    if (!form.state && !form.location && !form.lat) {
      return toast.error('Please select a state, enter a city/area, or use GPS');
    }

    onSearch({
      category: cat,
      state:    form.state || undefined,
      location: form.location || undefined,
      lat:      form.lat || undefined,
      lng:      form.lng || undefined,
      onlyNeedWebsite: form.onlyNeedWebsite,
      limit:    parseInt(form.limit, 10) || 20,
    });
  }

  async function handleSave() {
    if (!saveName.trim()) return toast.error('Enter a name for this search');
    const cat = form.category === 'other' ? form.customCategory : form.category;
    try {
      await saveSearch({
        name: saveName,
        category: cat,
        state: form.state,
        location: form.location,
        onlyNeedWebsite: form.onlyNeedWebsite,
        limit: parseInt(form.limit, 10) || 20,
      });
      toast.success('Search saved!');
      setSaveName(''); setShowSave(false);
    } catch {
      toast.error('Could not save search');
    }
  }

  return (
    <div className="card-aesthetic rounded-2xl p-6 border border-white/[0.08] shadow-lg relative overflow-hidden">
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-7 h-7 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
            <IconSearch className="w-3.5 h-3.5" />
          </div>
          <div>
            <h2 className="text-sm font-semibold text-slate-100 tracking-tight">Discover Hot Leads Needing Websites</h2>
            <p className="text-[11px] text-slate-400">Target established businesses with missing, broken, or social-only websites</p>
          </div>
        </div>
        <span className="text-xs text-slate-400 font-mono hidden sm:inline">Google Places API</span>
      </div>

      <form onSubmit={handleSubmit}>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3.5">
          {/* State Selection */}
          <div>
            <Select
              label="State (India)"
              options={INDIAN_STATES}
              value={form.state}
              onChange={set('state')}
              disabled={form.useLocation}
            />
          </div>

          {/* City / Area Location */}
          <div>
            <Input
              label={form.state ? 'City / Area (Optional)' : 'City / Area'}
              placeholder={form.state ? `e.g. all of ${form.state} or city` : 'e.g. Lajpat Nagar, Delhi'}
              value={form.location}
              onChange={set('location')}
              disabled={form.useLocation}
            />
            <button
              type="button"
              onClick={useMyLocation}
              className="text-xs text-indigo-400 hover:text-indigo-300 mt-1.5 flex items-center gap-1.5 transition-colors font-medium"
            >
              {geoLoading ? <Spinner size={3} /> : <IconMapPin className="w-3 h-3" />} Use my GPS location
            </button>
            {form.useLocation && (
              <p className="text-xs text-emerald-400 mt-1 inline-flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded border border-emerald-500/20">
                GPS: {form.lat?.toFixed(4)}, {form.lng?.toFixed(4)}
                <button
                  type="button"
                  className="ml-1 text-slate-400 hover:text-rose-400 text-sm leading-none"
                  onClick={() => setForm(p => ({ ...p, lat: null, lng: null, useLocation: false }))}
                >
                  ×
                </button>
              </p>
            )}
          </div>

          {/* Category */}
          <div>
            <Select
              label="Category"
              options={CATEGORIES}
              value={form.category}
              onChange={set('category')}
            />
            {form.category === 'other' && (
              <Input
                className="mt-2"
                placeholder="Custom category…"
                value={form.customCategory}
                onChange={set('customCategory')}
              />
            )}
          </div>

          {/* Number of Leads + Hot Leads Filter Toggle */}
          <div className="flex flex-col justify-between">
            <Select
              label="How Many Leads?"
              options={LEAD_COUNT_OPTIONS}
              value={form.limit}
              onChange={set('limit')}
            />
            <label className="flex items-center gap-2 mt-2.5 cursor-pointer select-none text-xs text-emerald-300 font-medium bg-emerald-500/10 border border-emerald-500/25 px-2.5 py-1.5 rounded-lg transition-colors hover:bg-emerald-500/15">
              <input
                type="checkbox"
                checked={form.onlyNeedWebsite}
                onChange={e => setForm(p => ({ ...p, onlyNeedWebsite: e.target.checked }))}
                className="accent-emerald-500 rounded cursor-pointer w-3.5 h-3.5"
              />
              <span className="flex items-center gap-1">
                <IconFlame className="w-3 h-3 text-emerald-400" />
                Hot Leads Only (Need Website)
              </span>
            </label>
          </div>

          {/* Submit */}
          <div className="flex flex-col justify-end gap-2">
            <Button type="submit" disabled={loading} className="w-full h-[42px] shadow-md shadow-indigo-600/20 gap-2">
              {loading ? (
                <><Spinner size={4} /> Finding Hot Leads…</>
              ) : (
                <><IconSparkles className="w-4 h-4" /> Find Leads</>
              )}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={() => setShowSave(s => !s)} className="gap-1.5">
              <IconSave className="w-3.5 h-3.5 text-slate-400" /> Save Search
            </Button>
          </div>
        </div>

        {showSave && (
          <div className="flex gap-2 mt-4 pt-4 border-t border-white/[0.06] items-center animate-fade-in">
            <Input
              placeholder="Name this search (e.g. Haryana Salons)…"
              value={saveName}
              onChange={e => setSaveName(e.target.value)}
              className="max-w-xs"
            />
            <Button type="button" size="sm" onClick={handleSave}>Save</Button>
          </div>
        )}
      </form>
    </div>
  );
}
