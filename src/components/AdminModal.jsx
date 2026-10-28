import { useRef, useState } from 'react';
import { ADMIN_SESSION_KEY, CATEGORIES, DAYS, GITHUB_TOKEN_KEY } from '../lib/constants.js';
import { verifyPassword } from '../lib/auth.js';
import { publishMenu } from '../lib/github.js';
import { normalizeMenu, validateMenu } from '../lib/menuSchema.js';
import { downloadJson, safeGet, safeRemove, safeSet } from '../lib/storage.js';
import Dialog from './admin/Dialog.jsx';
import Field from './admin/Field.jsx';
import ItemEditor from './admin/ItemEditor.jsx';
import { CloseIcon, DownloadIcon, GlobeIcon, LockIcon, ResetIcon, UploadIcon } from './Icons.jsx';

const secondaryBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-white px-3 py-2 text-sm font-medium text-slate-700 ring-1 ring-slate-200 hover:bg-slate-50 disabled:opacity-50';
const primaryBtn =
  'inline-flex items-center justify-center gap-1.5 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-40';

export default function AdminModal({ menu, publishedMenu, isLocalPreview, initialDayKey, onSaveLocal, onClearLocal, onClose }) {
  const [unlocked, setUnlocked] = useState(() => safeGet(sessionStorage, ADMIN_SESSION_KEY) === '1');
  const [dirty, setDirty] = useState(false);

  // Shared by the close button, Escape and the backdrop so unsaved edits are never lost silently.
  const requestClose = () => {
    if (!dirty || window.confirm('Hay cambios sin guardar. ¿Cerrar de todos modos?')) onClose();
  };

  return (
    <Dialog labelledBy="admin-title" onRequestClose={requestClose} size={unlocked ? 'max-w-3xl' : 'max-w-sm'}>
      {unlocked ? (
        <MenuEditor
          menu={menu}
          publishedMenu={publishedMenu}
          isLocalPreview={isLocalPreview}
          initialDayKey={initialDayKey}
          onSaveLocal={onSaveLocal}
          onClearLocal={onClearLocal}
          dirty={dirty}
          setDirty={setDirty}
          onRequestClose={requestClose}
        />
      ) : (
        <LoginForm
          onCancel={onClose}
          onSuccess={() => {
            safeSet(sessionStorage, ADMIN_SESSION_KEY, '1');
            setUnlocked(true);
          }}
        />
      )}
    </Dialog>
  );
}

function LoginForm({ onSuccess, onCancel }) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      if (await verifyPassword(password)) onSuccess();
      else setError('Contraseña incorrecta.');
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <form onSubmit={submit} className="p-6">
      <div className="mb-5 flex items-center gap-3">
        <span className="grid size-10 place-items-center rounded-full bg-slate-100 text-slate-600">
          <LockIcon className="size-5" />
        </span>
        <div>
          <h2 id="admin-title" className="text-base font-semibold text-slate-900">
            Administración
          </h2>
          <p className="text-sm text-slate-500">Ingresá la contraseña para editar el menú.</p>
        </div>
      </div>
      <Field
        id="admin-password"
        label="Contraseña"
        type="password"
        autoComplete="current-password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        data-autofocus
        aria-invalid={Boolean(error)}
        aria-describedby={error ? 'admin-password-error' : undefined}
      />
      {error && (
        <p id="admin-password-error" role="alert" className="mt-2 text-sm text-rose-600">
          {error}
        </p>
      )}
      <div className="mt-6 flex justify-end gap-2">
        <button type="button" onClick={onCancel} className={secondaryBtn}>
          Cancelar
        </button>
        <button type="submit" disabled={busy || !password} className={primaryBtn}>
          Ingresar
        </button>
      </div>
    </form>
  );
}

function MenuEditor({
  menu,
  publishedMenu,
  isLocalPreview,
  initialDayKey,
  onSaveLocal,
  onClearLocal,
  dirty,
  setDirty,
  onRequestClose,
}) {
  const [draft, setDraft] = useState(() => structuredClone(menu));
  const [dayKey, setDayKey] = useState(initialDayKey);
  const [notice, setNotice] = useState(null); // { tone: 'ok' | 'error', text }
  const [token, setToken] = useState(() => safeGet(localStorage, GITHUB_TOKEN_KEY) ?? '');
  const [publishing, setPublishing] = useState(false);
  // Evaluated once so the section doesn't collapse while the token is being typed.
  const [tokenSectionOpen] = useState(() => !token);
  const fileRef = useRef(null);
  const tokenSectionRef = useRef(null);

  const handleTokenChange = (e) => {
    const value = e.target.value.trim();
    setToken(value);
    if (value) safeSet(localStorage, GITHUB_TOKEN_KEY, value);
    else safeRemove(localStorage, GITHUB_TOKEN_KEY);
  };

  const edit = (updater) => {
    setDraft((d) => updater(structuredClone(d)));
    setDirty(true);
    setNotice(null);
  };

  const handleSave = () => {
    const ok = onSaveLocal(draft);
    setDirty(false);
    setNotice(
      ok
        ? { tone: 'ok', text: 'Guardado solo en este navegador. Tocá “Publicar para todos” para que lo vea el resto.' }
        : { tone: 'error', text: 'No se pudo guardar en este navegador (almacenamiento bloqueado o lleno).' },
    );
  };

  const handlePublish = async () => {
    if (!token) {
      tokenSectionRef.current.open = true;
      tokenSectionRef.current.querySelector('input')?.focus();
      setNotice({ tone: 'error', text: 'Para publicar, primero cargá el token de GitHub.' });
      return;
    }
    if (!window.confirm('El menú se publicará para todos. ¿Continuar?')) return;
    setPublishing(true);
    setNotice(null);
    try {
      // Keep it as the local preview until the deploy finishes; useMenu drops it once the site serves it.
      const menuToPublish = onSaveLocal(draft) || normalizeMenu({ ...draft, updatedAt: new Date().toISOString() });
      await publishMenu(token, menuToPublish);
      setDirty(false);
      setNotice({
        tone: 'ok',
        text: 'Publicado. En 1 o 2 minutos lo ven todos. Cuando esté online, el aviso de vista previa desaparece solo al recargar.',
      });
    } catch (err) {
      setNotice({ tone: 'error', text: `No se pudo publicar: ${err.message}` });
    } finally {
      setPublishing(false);
    }
  };

  const handleExport = () => {
    downloadJson(normalizeMenu({ ...draft, updatedAt: new Date().toISOString() }), 'menu.json');
    setNotice({ tone: 'ok', text: 'menu.json descargado. Reemplazá public/menu.json (o el archivo publicado) con este.' });
  };

  const handleImport = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      const data = JSON.parse(await file.text());
      const errors = validateMenu(data);
      if (errors.length) throw new Error(errors.join(' '));
      setDraft(normalizeMenu(data));
      setDirty(true);
      setNotice({ tone: 'ok', text: `“${file.name}” importado. Revisá y guardá para aplicar los cambios.` });
    } catch (err) {
      const msg = err instanceof SyntaxError ? 'El archivo no es un JSON válido.' : err.message;
      setNotice({ tone: 'error', text: `No se pudo importar: ${msg}` });
    }
  };

  const handleRestore = () => {
    if (!window.confirm('Se descartará la copia local y se volverá al menu.json publicado. ¿Continuar?')) return;
    onClearLocal();
    if (publishedMenu) setDraft(structuredClone(publishedMenu));
    setDirty(false);
    setNotice({ tone: 'ok', text: 'Se restauró el menú publicado.' });
  };

  const day = draft.days[dayKey];

  return (
    <>
      {/* Header */}
      <div className="flex items-start justify-between gap-4 border-b border-slate-200 px-5 py-4 sm:px-6">
        <div>
          <h2 id="admin-title" className="text-base font-semibold text-slate-900">
            Editar menú
          </h2>
          <p className="text-sm text-slate-500">
            {dirty ? 'Cambios sin guardar' : isLocalPreview ? 'Mostrando copia local' : 'Sin cambios'}
          </p>
        </div>
        <button
          type="button"
          onClick={onRequestClose}
          // Keeps focus inside the dialog after the login form unmounts.
          autoFocus
          aria-label="Cerrar"
          className="-m-1 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700"
        >
          <CloseIcon className="size-5" />
        </button>
      </div>

      {/* Day tabs */}
      <div className="border-b border-slate-200 px-5 sm:px-6">
        <div role="tablist" aria-label="Día a editar" className="-mb-px flex gap-1 overflow-x-auto">
          {DAYS.map((d) => (
            <button
              key={d.key}
              role="tab"
              type="button"
              aria-selected={d.key === dayKey}
              onClick={() => setDayKey(d.key)}
              className={`shrink-0 border-b-2 px-3 py-2.5 text-sm font-medium ${
                d.key === dayKey
                  ? 'border-slate-900 text-slate-900'
                  : 'border-transparent text-slate-500 hover:text-slate-800'
              }`}
            >
              {d.label}
            </button>
          ))}
        </div>
      </div>

      {/* Body */}
      <div className="flex-1 space-y-4 overflow-y-auto px-5 py-5 sm:px-6">
        <Field
          id="day-note"
          label={`Nota para el ${DAYS.find((d) => d.key === dayKey).label.toLowerCase()} (opcional)`}
          value={day.note}
          placeholder="Ej.: Feriado — comedor cerrado"
          onChange={(e) =>
            edit((d) => {
              d.days[dayKey].note = e.target.value;
              return d;
            })
          }
        />

        {CATEGORIES.map((cat) => (
          <ItemEditor
            key={`${dayKey}-${cat.key}`}
            idPrefix={`${dayKey}-${cat.key}`}
            category={cat}
            item={day.items[cat.key]}
            onChange={(patch) =>
              edit((d) => {
                Object.assign(d.days[dayKey].items[cat.key], patch);
                return d;
              })
            }
          />
        ))}

        <details className="group rounded-xl ring-1 ring-slate-200/70">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800 select-none sm:px-5">
            Datos generales del comedor
            <span className="ml-2 text-xs font-normal text-slate-400 group-open:hidden">(nombre, horario, aviso)</span>
          </summary>
          <div className="grid gap-3 border-t border-slate-100 p-4 sm:grid-cols-2 sm:p-5">
            {[
              ['name', 'Nombre del comedor', 'Comedor Corporativo'],
              ['hours', 'Horario', '12:30 a 13:00 y 13:30 a 14:00'],
              ['notice', 'Aviso general (se muestra arriba)', 'Ej.: Esta semana hay menú especial'],
            ].map(([key, label, placeholder]) => (
              <Field
                key={key}
                id={`caf-${key}`}
                label={label}
                placeholder={placeholder}
                value={draft.cafeteria[key]}
                onChange={(e) =>
                  edit((d) => {
                    d.cafeteria[key] = e.target.value;
                    return d;
                  })
                }
              />
            ))}
          </div>
        </details>

        <details ref={tokenSectionRef} open={tokenSectionOpen} className="group rounded-xl ring-1 ring-slate-200/70">
          <summary className="cursor-pointer list-none px-4 py-3 text-sm font-semibold text-slate-800 select-none sm:px-5">
            Publicación en GitHub
            <span className="ml-2 text-xs font-normal text-slate-400">{token ? '(token cargado)' : '(falta el token)'}</span>
          </summary>
          <div className="space-y-2 border-t border-slate-100 p-4 sm:p-5">
            <Field
              id="github-token"
              label="Token de GitHub"
              type="password"
              autoComplete="off"
              placeholder="github_pat_…"
              value={token}
              onChange={handleTokenChange}
            />
            <p className="text-xs text-slate-500">
              Se guarda solo en este navegador. Borrá el campo para olvidarlo.
            </p>
          </div>
        </details>
      </div>

      {/* Footer */}
      <div className="border-t border-slate-200 bg-slate-50/80 px-5 py-4 sm:px-6">
        {notice && (
          <p
            role="status"
            className={`mb-3 rounded-lg px-3 py-2 text-sm ${
              notice.tone === 'ok' ? 'bg-emerald-50 text-emerald-800' : 'bg-rose-50 text-rose-700'
            }`}
          >
            {notice.text}
          </p>
        )}
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <input ref={fileRef} type="file" accept="application/json,.json" className="hidden" onChange={handleImport} />
            <button type="button" className={secondaryBtn} onClick={() => fileRef.current?.click()}>
              <UploadIcon /> Importar
            </button>
            <button type="button" className={secondaryBtn} onClick={handleExport}>
              <DownloadIcon /> Exportar menu.json
            </button>
            {isLocalPreview && (
              <button type="button" className={`${secondaryBtn} col-span-2`} onClick={handleRestore}>
                <ResetIcon /> Restaurar publicado
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 gap-2 sm:flex">
            <button type="button" className={secondaryBtn} disabled={!dirty} onClick={handleSave}>
              Guardar vista previa
            </button>
            <button type="button" className={primaryBtn} disabled={publishing} onClick={handlePublish}>
              <GlobeIcon /> {publishing ? 'Publicando…' : 'Publicar para todos'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
