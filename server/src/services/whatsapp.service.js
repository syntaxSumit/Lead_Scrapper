const { default: makeWASocket, useMultiFileAuthState, DisconnectReason, fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
const QRCode = require('qrcode');
const path = require('path');

const AUTH_DIR = path.join(__dirname, '..', '..', 'whatsapp-auth');

// In-memory state
let sock = null;
let currentQR = null;     // base64 data-url
let connected = false;
let phoneNumber = null;
let connecting = false;

async function startSession() {
  if (connected || connecting) return;
  connecting = true;

  try {
    const { state, saveCreds } = await useMultiFileAuthState(AUTH_DIR);
    const { version } = await fetchLatestBaileysVersion();

    sock = makeWASocket({
      version,
      auth: state,
      printQRInTerminal: false,
      // shortcut: no message history sync needed; we only send outbound
      syncFullHistory: false,
    });

    sock.ev.on('creds.update', saveCreds);

    sock.ev.on('connection.update', (update) => {
      const { connection, lastDisconnect, qr } = update;

      if (qr) {
        // Convert QR matrix to data URL for the frontend
        QRCode.toDataURL(qr, { margin: 2, width: 280 }).then(url => {
          currentQR = url;
        }).catch(() => {});
      }

      if (connection === 'open') {
        connected = true;
        connecting = false;
        currentQR = null;
        phoneNumber = sock.user?.id?.split(':')[0] || sock.user?.id?.split('@')[0] || null;
        console.log('[whatsapp] Connected as', phoneNumber);
      }

      if (connection === 'close') {
        connected = false;
        connecting = false;
        currentQR = null;
        phoneNumber = null;

        const statusCode = lastDisconnect?.error?.output?.statusCode;
        const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

        if (shouldReconnect) {
          console.log('[whatsapp] Reconnecting...');
          setTimeout(() => startSession(), 3000);
        } else {
          console.log('[whatsapp] Logged out, session cleared');
          sock = null;
        }
      }
    });
  } catch (err) {
    connecting = false;
    console.error('[whatsapp] Session start error:', err.message);
  }
}

function getStatus() {
  return { connected, qr: currentQR, phoneNumber, connecting };
}

/**
 * Normalize Indian phone number to WhatsApp JID format
 * "098765 43210" or "+91 9876543210" -> "919876543210@s.whatsapp.net"
 */
function normalizePhone(raw) {
  if (!raw) return null;
  let digits = raw.replace(/\D/g, '');
  // Remove leading 0
  if (digits.startsWith('0')) digits = digits.slice(1);
  // Add India country code if missing
  if (digits.length === 10) digits = '91' + digits;
  // If starts with 91 and total is 12, good
  if (digits.length < 10) return null;
  return digits + '@s.whatsapp.net';
}

async function sendMessage(phone, text) {
  if (!sock || !connected) throw new Error('WhatsApp not connected');
  const jid = normalizePhone(phone);
  if (!jid) throw new Error(`Invalid phone number: ${phone}`);
  await sock.sendMessage(jid, { text });
  return { jid, sent: true };
}

async function disconnect() {
  if (sock) {
    await sock.logout().catch(() => {});
    sock = null;
  }
  connected = false;
  connecting = false;
  currentQR = null;
  phoneNumber = null;

  // Clean auth folder
  const fs = require('fs');
  fs.rmSync(AUTH_DIR, { recursive: true, force: true });
}

module.exports = { startSession, getStatus, sendMessage, disconnect, normalizePhone };
