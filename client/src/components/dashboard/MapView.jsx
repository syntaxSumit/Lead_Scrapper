import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import { useNavigate } from 'react-router-dom';
import Badge from '../ui/Badge.jsx';
import { scoreBg } from '../../utils/format.js';

const SCORE_COLOR = { HOT: '#22c55e', WARM: '#f59e0b', COLD: '#64748b' };

export default function MapView({ leads }) {
  const navigate = useNavigate();
  const positioned = leads.filter(l => l.lat && l.lng);

  const center = positioned.length > 0
    ? [positioned[0].lat, positioned[0].lng]
    : [20.5937, 78.9629]; // India default

  return (
    <div className="rounded-xl overflow-hidden border border-border h-[500px]">
      <MapContainer center={center} zoom={13} className="w-full h-full" aria-label="Lead map">
        <TileLayer
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          attribution='© <a href="https://openstreetmap.org">OSM</a>'
        />
        {positioned.map(lead => (
          <CircleMarker
            key={lead._id}
            center={[lead.lat, lead.lng]}
            radius={8}
            pathOptions={{
              color: SCORE_COLOR[lead.scoreLabel] || '#64748b',
              fillColor: SCORE_COLOR[lead.scoreLabel] || '#64748b',
              fillOpacity: 0.8,
              weight: 2,
            }}
          >
            <Popup>
              <div className="text-sm min-w-[160px]">
                <div className="font-semibold mb-1">{lead.name}</div>
                <div className="text-xs text-slate-400 mb-2">{lead.category}</div>
                <Badge className={scoreBg(lead.scoreLabel)}>
                  Score {lead.leadScore} · {lead.scoreLabel}
                </Badge>
                <br />
                <button
                  className="mt-2 text-indigo-400 text-xs hover:underline"
                  onClick={() => navigate(`/leads/${lead._id}`)}
                >
                  View details →
                </button>
              </div>
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
