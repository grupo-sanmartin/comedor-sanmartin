import { useRef, useState } from 'react';
import { ADMIN_SESSION_KEY, CATEGORIES, DAYS } from '../lib/constants.js';
import { verifyPassword } from '../lib/auth.js';
import { normalizeMenu, validateMenu } from '../lib/menuSchema.js';
import { downloadJson, safeGet, safeSet } from '../lib/storage.js';
import Dialog from './admin/Dialog.jsx';
import Field from './admin/Field.jsx';
import ItemEditor from './admin/ItemEditor.jsx';
import { CloseIcon, DownloadIcon, LockIcon, ResetIcon, UploadIcon } from './Icons.jsx';

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
  const fileRef = useRef(null);

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
        ? { tone: 'ok', text: 'Guardado en este navegador. Exportá el menu.json para publicarlo para todos.' }
        : { tone: 'error', text: 'No se pudo guardar en este navegador (almacenamiento bloqueado o lleno).' },
    );
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
          <button type="button" className={primaryBtn} disabled={!dirty} onClick={handleSave}>
            Guardar vista previa
          </button>
        </div>
      </div>
    </>
  );
}
