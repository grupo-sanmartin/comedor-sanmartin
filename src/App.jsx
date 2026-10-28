import { useEffect, useState } from 'react';
import AdminModal from './components/AdminModal.jsx';
import Footer from './components/Footer.jsx';
import Header from './components/Header.jsx';
import MenuCard from './components/MenuCard.jsx';
import Notice from './components/Notice.jsx';
import { useMenu } from './hooks/useMenu.js';
import { CATEGORIES } from './lib/constants.js';
import { getDayKey, isSameDay } from './lib/date.js';

/** Current date that rolls over at midnight (useful for screens left open all day). */
function useToday() {
  const [today, setToday] = useState(() => new Date());
  useEffect(() => {
    const id = setInterval(() => {
      const now = new Date();
      setToday((prev) => (isSameDay(prev, now) ? prev : now));
    }, 60_000);
    return () => clearInterval(id);
  }, []);
  return today;
}

export default function App() {
  const today = useToday();
  const dayKey = getDayKey(today); // null on weekends
  const [adminOpen, setAdminOpen] = useState(false);
  const { menu, publishedMenu, isLocalPreview, status, error, reload, saveLocal, clearLocal } = useMenu();

  const day = dayKey ? menu?.days[dayKey] : null;

  return (
    <div className="flex min-h-dvh flex-col">
      <Header cafeteria={menu?.cafeteria} today={today} onSecretOpen={() => setAdminOpen(true)} />

      <main className="mx-auto w-full max-w-5xl flex-1 px-4 py-6 sm:px-6 sm:py-10">
        {menu?.cafeteria.notice && (
          <div className="mb-6">
            <Notice>{menu.cafeteria.notice}</Notice>
          </div>
        )}

        <section aria-labelledby="menu-title" aria-busy={status === 'loading'}>
          <h2 id="menu-title" className="mb-5 font-display text-2xl font-semibold text-slate-900 sm:text-3xl">
            Menú de hoy
          </h2>

          {status === 'loading' && <SkeletonGrid />}

          {status === 'error' && (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
              <p className="font-medium text-slate-800">No pudimos cargar el menú.</p>
              <p className="mt-1 text-sm text-slate-500">{error}</p>
              <button
                type="button"
                onClick={reload}
                className="mt-4 rounded-lg bg-slate-900 px-4 py-2 text-sm font-semibold text-white hover:bg-slate-800"
              >
                Reintentar
              </button>
            </div>
          )}

          {status === 'ready' && !dayKey && (
            <div className="rounded-2xl bg-white p-8 text-center ring-1 ring-slate-200">
              <p className="font-medium text-slate-800">El comedor no abre los fines de semana.</p>
              <p className="mt-1 text-sm text-slate-500">Volvé el lunes para ver el menú del día.</p>
            </div>
          )}

          {status === 'ready' && day && (
            <>
              {day.note && (
                <div className="mb-4">
                  <Notice tone="warning">{day.note}</Notice>
                </div>
              )}
              <div className="grid gap-4 sm:grid-cols-2 sm:gap-5">
                {CATEGORIES.map((cat) => (
                  <MenuCard key={cat.key} category={cat} item={day.items[cat.key]} />
                ))}
              </div>
            </>
          )}
        </section>
      </main>

      <Footer
        cafeteria={menu?.cafeteria}
        updatedAt={menu?.updatedAt}
        isLocalPreview={isLocalPreview}
        onAdminClick={() => setAdminOpen(true)}
      />

      {adminOpen && menu && (
        <AdminModal
          menu={menu}
          publishedMenu={publishedMenu}
          isLocalPreview={isLocalPreview}
          initialDayKey={dayKey ?? 'monday'}
          onSaveLocal={saveLocal}
          onClearLocal={clearLocal}
          onClose={() => setAdminOpen(false)}
        />
      )}
    </div>
  );
}

function SkeletonGrid() {
  return (
    <div className="grid gap-4 sm:grid-cols-2 sm:gap-5" aria-hidden="true">
      {CATEGORIES.map((c) => (
        <div key={c.key} className="h-44 animate-pulse rounded-2xl bg-white ring-1 ring-slate-200/80">
          <div className="space-y-3 p-6">
            <div className="h-3 w-28 rounded bg-slate-100" />
            <div className="h-5 w-3/4 rounded bg-slate-100" />
            <div className="h-4 w-1/2 rounded bg-slate-100" />
          </div>
        </div>
      ))}
    </div>
  );
}
