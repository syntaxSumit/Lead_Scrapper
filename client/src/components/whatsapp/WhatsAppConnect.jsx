import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import Button from '../ui/Button.jsx';
import Modal from '../ui/Modal.jsx';
import Spinner from '../ui/Spinner.jsx';
import { getWAStatus, connectWA, disconnectWA } from '../../api/whatsapp.js';

export default function WhatsAppConnect({ onStatusChange }) {
  const [status, setStatus] = useState({ connected: false, qr: null, phoneNumber: null, connecting: false });
  const [showModal, setShowModal] = useState(false);
  const pollRef = useRef(null);

  // Poll status while modal is open or connecting
  useEffect(() => {
    fetchStatus();
    return () => clearInterval(pollRef.current);
  }, []);

  useEffect(() => {
    clearInterval(pollRef.current);
    if (showModal || status.connecting) {
      pollRef.current = setInterval(fetchStatus, 2000);
    }
    return () => clearInterval(pollRef.current);
  }, [showModal, status.connecting]);

  async function fetchStatus() {
    try {
      const { data } = await getWAStatus();
      setStatus(data);
      onStatusChange?.(data.connected);
      if (data.connected && showModal) {
        toast.success(`WhatsApp connected (${data.phoneNumber})`);
        setShowModal(false);
      }
    } catch { /* silent */ }
  }

  async function handleConnect() {
    setShowModal(true);
    try {
      await connectWA();
      // Polling will pick up the QR
    } catch (err) {
      toast.error(err.response?.data?.error || 'Failed to start WhatsApp session');
    }
  }

  async function handleDisconnect() {
    try {
      await disconnectWA();
      setStatus({ connected: false, qr: null, phoneNumber: null, connecting: false });
      onStatusChange?.(false);
      toast.success('WhatsApp disconnected');
    } catch {
      toast.error('Disconnect failed');
    }
  }

  return (
    <>
      {/* Compact status indicator in header area */}
      <div className="flex items-center gap-2">
        {status.connected ? (
          <>
            <span className="flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              WA: {status.phoneNumber || 'Connected'}
            </span>
            <button
              onClick={handleDisconnect}
              className="text-[10px] text-slate-500 hover:text-red-400 transition-colors"
              title="Disconnect WhatsApp"
            >
              ✕
            </button>
          </>
        ) : (
          <Button size="sm" variant="secondary" onClick={handleConnect}>
            📱 Connect WhatsApp
          </Button>
        )}
      </div>

      {/* QR Code Modal */}
      <Modal open={showModal} onClose={() => setShowModal(false)} title="Connect WhatsApp" size="sm">
        <div className="flex flex-col items-center gap-3 py-2 text-center">
          <p className="text-xs text-slate-300 leading-relaxed max-w-xs">
            Open <strong>WhatsApp</strong> on your phone → <strong>Linked Devices</strong> → <strong>Link a Device</strong> → Scan this QR code
          </p>

          {status.qr ? (
            <div className="bg-white p-2.5 rounded-xl shadow-lg border border-white/20 flex items-center justify-center my-1">
              <img
                src={status.qr}
                alt="WhatsApp QR Code"
                className="w-52 h-52 sm:w-56 sm:h-56 object-contain block"
              />
            </div>
          ) : status.connecting ? (
            <div className="flex flex-col items-center gap-2 py-8">
              <Spinner size={8} />
              <p className="text-xs text-slate-400">Generating QR code...</p>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-6">
              <Button onClick={handleConnect}>Generate QR Code</Button>
            </div>
          )}

          <p className="text-[11px] text-slate-500 max-w-xs leading-normal">
            Session will persist across server restarts. You won't need to re-scan unless you log out.
          </p>
        </div>
      </Modal>
    </>
  );
}
