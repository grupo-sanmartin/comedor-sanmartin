import { PlusIcon } from './Icons.jsx';

export default function MenuCard({ category, item }) {
  const hasDish = Boolean(item?.name);

  return (
    <article
      aria-labelledby={`dish-${category.key}`}
      className="flex h-full flex-col rounded-2xl bg-white p-5 shadow-[0_1px_2px_rgba(15,23,42,0.04)] ring-1 ring-slate-200/80 sm:p-6"
    >
      <header className="mb-3 flex items-center gap-2">
        <span className={`size-2 rounded-full ${category.accent}`} aria-hidden="true" />
        <h3 className="text-xs font-semibold uppercase tracking-[0.12em] text-slate-500">{category.label}</h3>
      </header>

      {hasDish ? (
        <>
          <p id={`dish-${category.key}`} className="text-lg font-semibold leading-snug text-slate-900 sm:text-xl">
            {item.name}
          </p>
          {item.description && <p className="mt-1.5 text-sm leading-relaxed text-slate-600">{item.description}</p>}

          <div className="flex-1" />
          <p className="mt-5 flex items-center gap-2 border-t border-slate-100 pt-4 text-sm text-slate-500">
            <PlusIcon className="size-4 shrink-0 text-slate-400" />
            Ensaladas y postres a elección
          </p>
        </>
      ) : (
        <p id={`dish-${category.key}`} className="my-auto py-6 text-sm text-slate-400">
          Sin opción cargada para hoy.
        </p>
      )}
    </article>
  );
}
