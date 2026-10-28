import { formatDateTime } from '../lib/date.js';
import { ClockIcon, PencilIcon, PinIcon } from './Icons.jsx';

export default function Footer({ cafeteria, updatedAt, isLocalPreview, onAdminClick }) {
  return (
    <footer className="mt-auto border-t border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-6 text-sm text-slate-500 sm:flex-row sm:items-center sm:justify-between sm:px-6">
        <div className="flex flex-col gap-1.5 sm:flex-row sm:gap-5">
          {cafeteria?.hours && (
            <span className="inline-flex items-center gap-1.5">
              <ClockIcon className="size-4 text-slate-400" />
              {cafeteria.hours}
            </span>
          )}
          {cafeteria?.location && (
            <span className="inline-flex items-center gap-1.5">
              <PinIcon className="size-4 text-slate-400" />
              {cafeteria.location}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3 sm:justify-end">
          <span className="text-xs text-slate-400">
            {isLocalPreview ? (
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-2 py-0.5 font-medium text-amber-700 ring-1 ring-amber-600/20">
                Vista previa local
              </span>
            ) : (
              updatedAt && <>Actualizado {formatDateTime(updatedAt)}</>
            )}
          </span>
          {/* Discreet admin entry: intentionally low contrast. */}
          <button
            type="button"
            onClick={onAdminClick}
            aria-label="Administrar menú"
            title="Administrar"
            className="-m-2 rounded-lg p-2 text-slate-300 opacity-40 transition hover:text-slate-500 hover:opacity-100 focus-visible:opacity-100"
          >
            <PencilIcon className="size-3.5" />
          </button>
        </div>
      </div>
    </footer>
  );
}
