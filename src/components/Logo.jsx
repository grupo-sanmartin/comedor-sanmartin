import { useState } from 'react';

const BASE = import.meta.env.BASE_URL;
const SOURCES = [`${BASE}logo.svg`, `${BASE}logo.png`];

/**
 * Company logo slot: tries /logo.svg, then /logo.png, then a neutral placeholder.
 * The logo artwork is white, so it sits on a dark tile.
 */
export default function Logo({ className = 'h-12 w-16 sm:h-14 sm:w-[4.75rem]', ...props }) {
  const [index, setIndex] = useState(0);
  const src = SOURCES[index];

  return (
    <div className={`shrink-0 select-none ${className}`} {...props}>
      {src ? (
        <img
          src={src}
          alt="Grupo Sanmartín"
          className="size-full rounded-xl bg-slate-900 object-contain p-2"
          draggable="false"
          onError={() => setIndex((i) => i + 1)}
        />
      ) : (
        <div className="grid size-full place-items-center rounded-xl border border-dashed border-slate-300 text-[10px] font-medium tracking-wide text-slate-400">
          LOGO
        </div>
      )}
    </div>
  );
}
