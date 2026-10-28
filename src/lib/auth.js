// NOTE: this is a convenience gate, not real security. Anything shipped to the browser
// (including this hash) is public. The real "write" step is replacing menu.json on the server.

// SHA-256 of "comedor2026". Override with VITE_ADMIN_PASSWORD_HASH in .env.
const DEFAULT_HASH = 'e17e20f5292c3e50159d400573986084f892a521ef894865b95390c6ea6e99a0';

const EXPECTED_HASH = (import.meta.env.VITE_ADMIN_PASSWORD_HASH || DEFAULT_HASH).trim().toLowerCase();

async function sha256Hex(text) {
  if (!globalThis.crypto?.subtle) {
    throw new Error('El modo administrador requiere HTTPS (o localhost).');
  }
  const buffer = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(buffer), (b) => b.toString(16).padStart(2, '0')).join('');
}

export async function verifyPassword(password) {
  return (await sha256Hex(password)) === EXPECTED_HASH;
}
