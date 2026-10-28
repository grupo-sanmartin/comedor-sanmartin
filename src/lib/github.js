// Publishes menu.json by committing it to the repository through the GitHub API.
// The commit triggers the Pages workflow, so everyone sees the new menu after the deploy (1–2 min).
// The token is typed by the administrator and kept only in their browser; it is never part of the build.

const REPO = import.meta.env.VITE_GITHUB_REPO || 'grupo-sanmartin/comedor-sanmartin';
const BRANCH = 'main';
const FILE_PATH = 'public/menu.json';
const API_URL = `https://api.github.com/repos/${REPO}/contents/${FILE_PATH}`;

// btoa only accepts Latin-1, so encode the UTF-8 bytes first (accents, ñ…).
function toBase64(text) {
  let binary = '';
  for (const byte of new TextEncoder().encode(text)) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function describeError(status) {
  if (status === 401) return 'El token es inválido o venció.';
  if (status === 403 || status === 404) return `El token no tiene permiso de escritura sobre ${REPO}.`;
  if (status === 409 || status === 422) return 'El archivo cambió mientras publicabas. Volvé a intentarlo.';
  return `GitHub respondió HTTP ${status}.`;
}

export async function publishMenu(token, menu) {
  const headers = {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // The update needs the SHA of the current file.
  const current = await fetch(`${API_URL}?ref=${BRANCH}`, { headers, cache: 'no-store' });
  if (!current.ok) throw new Error(describeError(current.status));
  const { sha } = await current.json();

  const res = await fetch(API_URL, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: `Actualizar menú (${new Date().toLocaleDateString('es-AR')})`,
      content: toBase64(JSON.stringify(menu, null, 2) + '\n'),
      sha,
      branch: BRANCH,
    }),
  });
  if (!res.ok) throw new Error(describeError(res.status));
}
