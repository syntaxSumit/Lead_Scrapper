import { useState } from 'react';
import Modal from '../ui/Modal.jsx';
import Button from '../ui/Button.jsx';
import Select from '../ui/Select.jsx';
import Spinner from '../ui/Spinner.jsx';
import { generateOutreach } from '../../api/outreach.js';
import { waLink } from '../../utils/format.js';
import toast from 'react-hot-toast';

const LANGUAGES = [
  { value: 'hinglish', label: 'Hinglish (Casual & Relatable)' },
  { value: 'hindi', label: 'Hindi (Formal Devanagari)' },
  { value: 'english', label: 'English (Professional & Clear)' },
];

export default function OutreachModal({ open, onClose, lead, onLeadUpdate }) {
  const [lang, setLang] = useState('hinglish');
  const [activeTab, setActiveTab] = useState('whatsapp');
  const [loading, setLoading] = useState(false);

  if (!lead) return null;

  const outreach = lead.outreach;

  async function handleGenerate() {
    setLoading(true);
    try {
      const { data } = await generateOutreach(lead._id, lang);
      onLeadUpdate?.({ ...lead, outreach: data.outreach });
      toast.success('Generated tailored outreach pitch');
    } catch {
      toast.error('Failed to generate outreach');
    } finally {
      setLoading(false);
    }
  }

  function copyText(text) {
    if (!text) return;
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard');
  }

  const phone = lead.phone || '';
  const waUrl = waLink(phone, outreach?.whatsapp || '');
  const mailtoUrl = outreach?.emailSubject
    ? `mailto:?subject=${encodeURIComponent(outreach.emailSubject)}&body=${encodeURIComponent(outreach.emailBody || '')}`
    : '#';

  return (
    <Modal open={open} onClose={onClose} title={`Outreach Assistant — ${lead.name}`} size="lg">
      <div className="space-y-4">
        {/* Language selector & trigger */}
        <div className="flex flex-col sm:flex-row items-end gap-3 bg-surface2 p-3 rounded-xl border border-border">
          <div className="flex-1 w-full">
            <Select
              label="Tone / Language"
              options={LANGUAGES}
              value={lang}
              onChange={e => setLang(e.target.value)}
            />
          </div>
          <Button onClick={handleGenerate} disabled={loading} className="w-full sm:w-auto">
            {loading ? <><Spinner size={4} /> Crafting AI Pitch…</> : '✨ Generate Scripts'}
          </Button>
        </div>

        {!outreach ? (
          <div className="text-center py-8 text-slate-400 text-sm">
            Click "Generate Scripts" above to generate tailored outreach for WhatsApp, Email, and Phone.
          </div>
        ) : (
          <div className="space-y-3">
            {/* Tab navigation */}
            <div className="flex border-b border-border text-xs font-medium">
              <button
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'whatsapp'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setActiveTab('whatsapp')}
              >
                💬 WhatsApp ({lead.phone ? 'Phone Available' : 'No Phone'})
              </button>
              <button
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'email'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setActiveTab('email')}
              >
                ✉️ Email Pitch
              </button>
              <button
                className={`px-4 py-2 border-b-2 transition-colors ${
                  activeTab === 'phone'
                    ? 'border-emerald-500 text-emerald-400'
                    : 'border-transparent text-slate-400 hover:text-slate-200'
                }`}
                onClick={() => setActiveTab('phone')}
              >
                📞 Cold Call Script
              </button>
            </div>

            {/* WhatsApp Tab */}
            {activeTab === 'whatsapp' && (
              <div className="space-y-3">
                <textarea
                  readOnly
                  rows={5}
                  value={outreach.whatsapp || ''}
                  className="input font-sans text-xs resize-none"
                />
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="secondary" onClick={() => copyText(outreach.whatsapp)}>
                    📋 Copy Text
                  </Button>
                  {phone ? (
                    <a
                      href={waUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="btn-primary text-xs flex items-center gap-1.5"
                    >
                      🚀 Open WhatsApp (wa.me)
                    </a>
                  ) : (
                    <span className="text-xs text-amber-400 self-center">
                      No phone number on record for direct chat
                    </span>
                  )}
                </div>
              </div>
            )}

            {/* Email Tab */}
            {activeTab === 'email' && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs text-slate-400 font-medium">Subject</label>
                  <input
                    readOnly
                    value={outreach.emailSubject || ''}
                    className="input text-xs font-medium"
                  />
                </div>
                <div>
                  <label className="text-xs text-slate-400 font-medium">Body</label>
                  <textarea
                    readOnly
                    rows={7}
                    value={outreach.emailBody || ''}
                    className="input text-xs font-sans resize-none"
                  />
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button
                    size="sm"
                    variant="secondary"
                    onClick={() => copyText(`${outreach.emailSubject}\n\n${outreach.emailBody}`)}
                  >
                    📋 Copy All
                  </Button>
                  <a href={mailtoUrl} className="btn-primary text-xs flex items-center gap-1.5">
                    ✉️ Open Email App
                  </a>
                </div>
              </div>
            )}

            {/* Cold Call Tab */}
            {activeTab === 'phone' && (
              <div className="space-y-3">
                <p className="text-xs text-slate-400">
                  30-second conversational opening script targeted to {lead.name}:
                </p>
                <div className="bg-surface2 p-3 rounded-lg border border-border text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-wrap">
                  {outreach.callScript}
                </div>
                <div className="flex flex-wrap gap-2 justify-end">
                  <Button size="sm" variant="secondary" onClick={() => copyText(outreach.callScript)}>
                    📋 Copy Script
                  </Button>
                  {phone && (
                    <a href={`tel:${phone}`} className="btn-primary text-xs flex items-center gap-1.5">
                      📞 Call {phone}
                    </a>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </Modal>
  );
}
