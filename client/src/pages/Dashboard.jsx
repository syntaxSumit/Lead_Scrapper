import { useEffect, useState } from 'react';
import StatsBar from '../components/dashboard/StatsBar.jsx';
import LeadTable from '../components/dashboard/LeadTable.jsx';
import LeadFilters from '../components/dashboard/LeadFilters.jsx';
import MapView from '../components/dashboard/MapView.jsx';
import SavedSearches from '../components/dashboard/SavedSearches.jsx';
import DiscoveryForm from '../components/discovery/DiscoveryForm.jsx';
import OutreachModal from '../components/outreach/OutreachModal.jsx';
import AutoOutreachModal from '../components/outreach/AutoOutreachModal.jsx';
import WhatsAppConnect from '../components/whatsapp/WhatsAppConnect.jsx';
import Button from '../components/ui/Button.jsx';
import { IconTarget, IconTable, IconMap } from '../components/ui/Icons.jsx';
import { useLeads } from '../hooks/useLeads.js';
import { useDiscovery } from '../hooks/useDiscovery.js';
import { useAuth } from '../hooks/useAuth.js';
import useStore from '../store/index.js';

export default function Dashboard() {
  const {
    leads,
    stats,
    loading,
    fetchLeads,
    fetchStats,
    patchLead,
    removeAllLeads,
    removeSelectedLeads,
  } = useLeads();
  const { handleLogout } = useAuth();
  const user = useStore(s => s.user);
  const view = useStore(s => s.view);
  const setView = useStore(s => s.setView);

  const [outreachLead, setOutreachLead] = useState(null);
  const [showAutoOutreach, setShowAutoOutreach] = useState(false);
  const [waConnected, setWaConnected] = useState(false);

  const { discover, loading: searchLoading } = useDiscovery(async () => {
    await fetchLeads();
    await fetchStats();
  });

  useEffect(() => {
    fetchLeads();
    fetchStats();
  }, [fetchLeads, fetchStats]);

  const handleLeadUpdate = updated => {
    patchLead(updated._id, updated);
    if (outreachLead && outreachLead._id === updated._id) {
      setOutreachLead(updated);
    }
    fetchStats();
  };

  return (
    <div className="min-h-screen bg-base flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-emerald-950/80 bg-[#07130e]/90 backdrop-blur-xl sticky top-0 z-30 px-4 sm:px-8 py-3.5 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 via-emerald-500 to-teal-500 flex items-center justify-center text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30">
            <IconTarget className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-base tracking-tight bg-gradient-to-r from-emerald-200 via-white to-slate-200 bg-clip-text text-transparent">
                LeadScout
              </span>
              <span className="inline-flex items-center gap-1.5 text-[10px] font-semibold tracking-wider uppercase px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-300 border border-emerald-500/30 shadow-sm">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                Vertex AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">Local Business Lead Discovery & Agency Suite</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center bg-[#122c22]/90 border border-emerald-500/20 rounded-xl p-1 text-xs shadow-inner backdrop-blur-sm">
            <button
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                view === 'table' ? 'bg-[#1a4335] text-emerald-300 font-medium shadow-sm shadow-emerald-950/40 border border-emerald-500/40' : 'text-slate-400 hover:text-emerald-200'
              }`}
              onClick={() => setView('table')}
            >
              <IconTable className="w-3.5 h-3.5" /> Table
            </button>
            <button
              className={`px-3.5 py-1.5 rounded-lg transition-all duration-150 flex items-center gap-1.5 ${
                view === 'map' ? 'bg-[#1a4335] text-emerald-300 font-medium shadow-sm shadow-emerald-950/40 border border-emerald-500/40' : 'text-slate-400 hover:text-emerald-200'
              }`}
              onClick={() => setView('map')}
            >
              <IconMap className="w-3.5 h-3.5" /> Map
            </button>
          </div>

          <WhatsAppConnect onStatusChange={setWaConnected} />

          <span className="text-xs text-slate-400 font-mono hidden md:inline px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/[0.05]">
            {user?.email}
          </span>
          <Button size="sm" variant="ghost" onClick={handleLogout}>
            Logout
          </Button>
        </div>
      </header>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl w-full mx-auto p-4 sm:p-6 space-y-6">
        {/* Discovery Box */}
        <DiscoveryForm onSearch={discover} loading={searchLoading} />

        {/* Saved searches tags */}
        <SavedSearches onRun={params => discover(params)} />

        {/* Stats Row */}
        <StatsBar stats={stats} />

        {/* Auto Outreach launcher */}
        {leads.length > 0 && (
          <div className="flex items-center justify-between bg-surface border border-border rounded-xl px-4 py-3">
            <div className="text-xs text-slate-400">
              <strong className="text-slate-200">{leads.filter(l => ['NO_WEBSITE', 'BROKEN'].includes(l.websiteStatus) && l.phone && l.pipelineStatus === 'NEW').length}</strong> leads ready for auto-outreach (no website or broken, with phone, NEW status)
            </div>
            <Button size="sm" onClick={() => setShowAutoOutreach(true)}>
              🚀 Auto WhatsApp Outreach
            </Button>
          </div>
        )}

        {/* Filters */}
        <LeadFilters onFilter={filters => fetchLeads(filters)} />

        {/* Content view switch (Table or Map) */}
        {view === 'map' ? (
          <MapView leads={leads} />
        ) : (
          <LeadTable
            leads={leads}
            loading={loading}
            onLeadUpdate={handleLeadUpdate}
            onOpenOutreach={lead => setOutreachLead(lead)}
            onDeleteAll={removeAllLeads}
            onDeleteSelected={removeSelectedLeads}
          />
        )}
      </main>

      {/* Outreach modal drawer */}
      <OutreachModal
        open={Boolean(outreachLead)}
        onClose={() => setOutreachLead(null)}
        lead={outreachLead}
        onLeadUpdate={handleLeadUpdate}
      />

      <AutoOutreachModal
        open={showAutoOutreach}
        onClose={() => { setShowAutoOutreach(false); fetchLeads(); fetchStats(); }}
        waConnected={waConnected}
        leadsCount={leads.length}
      />
    </div>
  );
}
