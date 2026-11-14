export default function Button({ children, variant = 'primary', size = 'md', className = '', ...props }) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/50 active:scale-[0.98] select-none';
  const variants = {
    primary:   'bg-gradient-to-r from-indigo-500 via-indigo-600 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 text-white shadow-md shadow-indigo-600/25 border border-indigo-400/30 hover:border-indigo-400/60',
    secondary: 'bg-white/[0.05] hover:bg-white/[0.09] text-slate-200 border border-white/[0.09] hover:border-white/[0.18] shadow-sm backdrop-blur-sm',
    ghost:     'hover:bg-white/[0.06] text-slate-300 hover:text-white',
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
