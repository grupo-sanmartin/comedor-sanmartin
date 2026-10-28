import { InfoIcon } from './Icons.jsx';

const TONES = {
  neutral: 'bg-white text-slate-700 ring-slate-200',
  warning: 'bg-amber-50 text-amber-900 ring-amber-600/20',
};

export default function Notice({ children, tone = 'neutral' }) {
  return (
    <div role="note" className={`flex items-start gap-2.5 rounded-xl px-4 py-3 text-sm ring-1 ${TONES[tone]}`}>
      <InfoIcon className="mt-0.5 size-4 shrink-0 opacity-60" />
      <p>{children}</p>
    </div>
  );
}
