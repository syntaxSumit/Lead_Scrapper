export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-500/50 active:scale-[0.98] select-none';
  const variants = {
    primary:   'bg-gradient-to-r from-emerald-600 via-emerald-500 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white shadow-md shadow-emerald-950/50 border border-emerald-400/30 hover:border-emerald-300/60',
    secondary: 'bg-[#122c22]/80 hover:bg-[#18382c] text-emerald-100 border border-emerald-500/20 hover:border-emerald-500/40 shadow-sm backdrop-blur-sm',
    ghost:     'hover:bg-emerald-500/10 text-slate-300 hover:text-white',
    danger:    'bg-rose-500/15 hover:bg-rose-500/25 text-rose-300 border border-rose-500/30 hover:border-rose-500/50 shadow-sm shadow-rose-950/20',
  };
  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2 text-sm',
    lg: 'px-5 py-2.5 text-base',
  };
  return (
    <button className={`${base} ${variants[variant]} ${sizes[size]} ${className}`} {...props}>
      {children}
    </button>
  );
}
