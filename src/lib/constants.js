export const STORAGE_KEY = 'menu-comedor:local-menu:v1';
export const ADMIN_SESSION_KEY = 'menu-comedor:admin-unlocked';
export const GITHUB_TOKEN_KEY = 'menu-comedor:github-token';

export const DAYS = [
  { key: 'monday', label: 'Lunes', short: 'Lun', weekday: 1 },
  { key: 'tuesday', label: 'Martes', short: 'Mar', weekday: 2 },
  { key: 'wednesday', label: 'Miércoles', short: 'Mié', weekday: 3 },
  { key: 'thursday', label: 'Jueves', short: 'Jue', weekday: 4 },
  { key: 'friday', label: 'Viernes', short: 'Vie', weekday: 5 },
];

export const CATEGORIES = [
  { key: 'principal', label: 'Menú Principal', hint: 'Plato del día', accent: 'bg-slate-900' },
  { key: 'dieta', label: 'Menú Dieta / Saludable', hint: 'Opción liviana', accent: 'bg-emerald-600' },
  { key: 'opcional1', label: 'Opcional 1', hint: 'Alternativa', accent: 'bg-slate-400' },
  { key: 'opcional2', label: 'Opcional 2', hint: 'Alternativa', accent: 'bg-slate-400' },
];
