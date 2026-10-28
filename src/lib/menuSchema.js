import { CATEGORIES, DAYS } from './constants.js';

export function createEmptyItem() {
  return { name: '', description: '' };
}

function normalizeItem(raw) {
  const item = raw && typeof raw === 'object' ? raw : {};
  return {
    name: typeof item.name === 'string' ? item.name.trim() : '',
    description: typeof item.description === 'string' ? item.description.trim() : '',
  };
}

/** Returns a complete, well-shaped menu object, filling any missing day/category. */
export function normalizeMenu(raw) {
  const data = raw && typeof raw === 'object' ? raw : {};
  const cafeteria = data.cafeteria && typeof data.cafeteria === 'object' ? data.cafeteria : {};

  const days = {};
  for (const { key } of DAYS) {
    const day = data.days?.[key] ?? {};
    const items = {};
    for (const cat of CATEGORIES) items[cat.key] = normalizeItem(day.items?.[cat.key]);
    days[key] = { note: typeof day.note === 'string' ? day.note : '', items };
  }

  return {
    version: 1,
    updatedAt: typeof data.updatedAt === 'string' ? data.updatedAt : new Date().toISOString(),
    cafeteria: {
      name: cafeteria.name || 'Comedor',
      hours: cafeteria.hours || '',
      location: cafeteria.location || '',
      notice: cafeteria.notice || '',
    },
    days,
  };
}

/** Light structural validation used before accepting an imported file. */
export function validateMenu(raw) {
  const errors = [];
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) {
    return ['El archivo no contiene un objeto JSON válido.'];
  }
  if (!raw.days || typeof raw.days !== 'object') {
    errors.push('Falta la propiedad "days".');
    return errors;
  }
  const knownDays = DAYS.filter((d) => raw.days[d.key]);
  if (knownDays.length === 0) {
    errors.push('No se encontró ningún día (monday … friday) dentro de "days".');
  }
  for (const d of knownDays) {
    const items = raw.days[d.key].items;
    if (items && typeof items !== 'object') errors.push(`"${d.key}.items" debe ser un objeto.`);
  }
  return errors;
}
