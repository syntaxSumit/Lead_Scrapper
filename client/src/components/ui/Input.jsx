export default function Input({ label, error, className = '', ...props }) {
  return (
    <div className="flex flex-col gap-1.5">
      {label && <label className="text-xs font-medium text-slate-300 tracking-wide">{label}</label>}
      <input
        className={`input-aesthetic w-full ${error ? '!border-rose-500/80 !shadow-rose-950/40' : ''} ${className}`}
        {...props}
      />
      {error && <p className="text-xs text-rose-400 mt-0.5">{error}</p>}
    </div>
  );
}
