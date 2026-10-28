import { useLongPress } from '../hooks/useLongPress.js';
import { formatLongDate } from '../lib/date.js';
import Logo from './Logo.jsx';

export default function Header({ cafeteria, today, onSecretOpen }) {
  // Holding the logo is a second, invisible way into admin mode (handy on touch screens).
  const longPress = useLongPress(onSecretOpen, 1500);

  return (
    <header className="border-b border-slate-200/80 bg-white">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6 sm:py-6">
        <div className="flex items-center gap-3 sm:gap-4">
          <Logo {...longPress} />
          <div className="min-w-0">
            <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Menú del día</p>
            <h1 className="truncate font-display text-xl font-semibold text-slate-900 sm:text-2xl">
              {cafeteria?.name ?? 'Comedor'}
            </h1>
          </div>
        </div>

        <div className="sm:text-right">
          <p className="text-[11px] font-semibold uppercase tracking-[0.16em] text-slate-400">Hoy</p>
          <p className="text-sm font-medium text-slate-700 sm:text-base">
            <time dateTime={today.toISOString().slice(0, 10)}>{formatLongDate(today)}</time>
          </p>
        </div>
      </div>
    </header>
  );
}
