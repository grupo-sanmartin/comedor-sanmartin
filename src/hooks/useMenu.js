import { useCallback, useEffect, useState } from 'react';
import { STORAGE_KEY } from '../lib/constants.js';
import { normalizeMenu } from '../lib/menuSchema.js';
import { safeGet, safeRemove, safeSet } from '../lib/storage.js';

const MENU_URL = `${import.meta.env.BASE_URL}menu.json`;

function readLocalMenu() {
  const raw = safeGet(localStorage, STORAGE_KEY);
  if (!raw) return null;
  try {
    return normalizeMenu(JSON.parse(raw));
  } catch {
    safeRemove(localStorage, STORAGE_KEY);
    return null;
  }
}

/**
 * Loads the published menu (public/menu.json). A copy saved in this browser by the
 * admin editor takes precedence, so the administrator can preview changes before
 * replacing the static file.
 */
export function useMenu() {
  const [publishedMenu, setPublishedMenu] = useState(null);
  const [localMenu, setLocalMenu] = useState(readLocalMenu);
  const [status, setStatus] = useState('loading'); // loading | ready | error
  const [error, setError] = useState(null);

  const load = useCallback(async () => {
    setStatus('loading');
    setError(null);
    try {
      const res = await fetch(MENU_URL, { cache: 'no-store' });
      if (!res.ok) throw new Error(`No se pudo cargar el menú (HTTP ${res.status}).`);
      const published = normalizeMenu(await res.json());
      setPublishedMenu(published);
      // Once the site serves a menu as new as the local copy (e.g. after "Publicar"), the preview is no longer needed.
      const local = readLocalMenu();
      if (local && published.updatedAt >= local.updatedAt) {
        safeRemove(localStorage, STORAGE_KEY);
        setLocalMenu(null);
      }
      setStatus('ready');
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setStatus('error');
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const saveLocal = useCallback((menu) => {
    const next = normalizeMenu({ ...menu, updatedAt: new Date().toISOString() });
    const ok = safeSet(localStorage, STORAGE_KEY, JSON.stringify(next));
    setLocalMenu(next);
    // The saved menu (with its updatedAt) so it can be published as-is, or null if storage failed.
    return ok ? next : null;
  }, []);

  const clearLocal = useCallback(() => {
    safeRemove(localStorage, STORAGE_KEY);
    setLocalMenu(null);
  }, []);

  const menu = localMenu ?? publishedMenu;

  return {
    menu,
    publishedMenu,
    isLocalPreview: Boolean(localMenu),
    // A local copy is enough to render even if the network fetch failed.
    status: menu ? 'ready' : status,
    error,
    reload: load,
    saveLocal,
    clearLocal,
  };
}
