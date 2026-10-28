import { createEmptyItem } from '../../lib/menuSchema.js';
import Field from './Field.jsx';

export default function ItemEditor({ idPrefix, category, item, onChange }) {
  return (
    <section className="rounded-xl bg-slate-50 p-4 ring-1 ring-slate-200/70 sm:p-5">
      <div className="mb-4 flex items-center justify-between gap-3">
        <h3 className="flex items-center gap-2 text-sm font-semibold text-slate-800">
          <span className={`size-2 rounded-full ${category.accent}`} aria-hidden="true" />
          {category.label}
        </h3>
        <button
          type="button"
          onClick={() => onChange(createEmptyItem())}
          className="text-xs font-medium text-slate-400 hover:text-rose-600"
        >
          Vaciar
        </button>
      </div>

      <div className="grid gap-3">
        <Field
          id={`${idPrefix}-name`}
          label="Plato"
          value={item.name}
          placeholder="Ej.: Milanesa de ternera al horno"
          onChange={(e) => onChange({ name: e.target.value })}
        />
        <Field
          id={`${idPrefix}-desc`}
          label="Descripción / guarnición"
          value={item.description}
          placeholder="Ej.: Con puré de papas y calabaza"
          onChange={(e) => onChange({ description: e.target.value })}
        />
      </div>
    </section>
  );
}
