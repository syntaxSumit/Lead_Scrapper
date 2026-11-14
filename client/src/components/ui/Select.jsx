export default function Select({ label, options, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-slate-300 tracking-wide">{label}</label>}
      <div className="relative">
        <select
          className={`input-aesthetic appearance-none cursor-pointer w-full pr-8 ${className}`}
          {...props}
        >
          {options.map(o => (
            <option key={o.value} value={o.value} className="bg-slate-900 text-slate-100">{o.label}</option>
          ))}
        </select>
        <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2.5 text-slate-400">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </div>
    </div>
  );
}
