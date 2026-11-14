export default function Badge({ children, className = '' }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-0.5 rounded-full border backdrop-blur-sm transition-all ${className}`}>
      {children}
    </span>
  );
}
