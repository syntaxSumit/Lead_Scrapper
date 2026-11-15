import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import AnalyzerPanel from '../components/analyzer/AnalyzerPanel.jsx';
import OutreachModal from '../components/outreach/OutreachModal.jsx';
import Card from '../components/ui/Card.jsx';
import Button from '../components/ui/Button.jsx';
import Select from '../components/ui/Select.jsx';
import Spinner from '../components/ui/Spinner.jsx';
import { getLead, updateLead } from '../api/leads.js';
import { analyzeLead } from '../api/analyze.js';
import toast from 'react-hot-toast';

const PIPELINE_OPTIONS = [
  { value: 'NEW', label: 'New Lead' },
  { value: 'CONTACTED', label: 'Contacted' },
  { value: 'REPLIED', label: 'Replied' },
  { value: 'MEETING', label: 'Meeting Scheduled' },
  { value: 'WON', label: 'Deal Won' },
  { value: 'LOST', label: 'Lost / Closed' },
];

export default function LeadDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [showOutreach, setShowOutreach] = useState(false);
  const [notes, setNotes] = useState('');

  useEffect(() => {
    async function load() {
      try {
        const { data } = await getLead(id);
        setLead(data);
        setNotes(data.notes || '');
      } catch {
        toast.error('Failed to load lead details');
      } finally {
        setLoading(false);
      }
    }
    load();
  }, [id]);

  async function handleAnalyze() {
    setAnalyzing(true);
    try {
      const { data } = await analyzeLead(id);
      setLead(data);
      toast.success(data.pitchPlaybook ? 'Audit and pitch playbook ready' : 'Analysis refreshed successfully');
    } catch {
      toast.error('Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  }

  async function handleSaveNotes() {
    try {
      const { data } = await updateLead(id, { notes });
      setLead(data);
      toast.success('Notes saved');
    } catch {
      toast.error('Could not save notes');
    }
  }

  async function handlePipelineChange(status) {
    try {
      const { data } = await updateLead(id, { pipelineStatus: status });
      setLead(data);
      toast.success(`Pipeline moved to ${status}`);
    } catch {
      toast.error('Failed to update status');
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-base">
        <Spinner size={8} />
      </div>
    );
  }

  if (!lead) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-base text-slate-300">
        <p className="mb-4">Lead not found</p>
        <Button onClick={() => navigate('/')}>Return to Dashboard</Button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* Navigation & back button */}
        <div className="flex items-center justify-between">
          <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
            ← Back to Leads
          </Button>
          <Button size="sm" variant="primary" onClick={() => setShowOutreach(true)}>
            📤 Launch Outreach Pitch
          </Button>
        </div>

        {/* Lead CRM Pipeline & Notes Bar */}
        <Card className="p-4 grid grid-cols-1 md:grid-cols-3 gap-4 bg-surface border border-border">
          <div>
            <Select
              label="CRM Pipeline Stage"
              options={PIPELINE_OPTIONS}
              value={lead.pipelineStatus}
              onChange={e => handlePipelineChange(e.target.value)}
            />
          </div>

          <div className="md:col-span-2 flex flex-col sm:flex-row items-end gap-2">
            <div className="flex-1 w-full">
              <label className="text-xs font-medium text-slate-400 block mb-1">
                Internal Outreach Notes
              </label>
              <input
                className="input text-xs"
                placeholder="e.g. Spoke to owner Ramesh, follow up Tuesday..."
                value={notes}
                onChange={e => setNotes(e.target.value)}
              />
            </div>
            <Button size="sm" variant="secondary" onClick={handleSaveNotes}>
              Save Note
            </Button>
          </div>
        </Card>

        {/* Full Analyzer Report Component */}
        <AnalyzerPanel lead={lead} onAnalyze={handleAnalyze} analyzing={analyzing} onLeadUpdate={updated => setLead(updated)} />
      </div>

      <OutreachModal
        open={showOutreach}
        onClose={() => setShowOutreach(false)}
        lead={lead}
        onLeadUpdate={updated => setLead(updated)}
      />
    </div>
  );
}
