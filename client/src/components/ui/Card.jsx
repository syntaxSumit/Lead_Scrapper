export default function Card({ children, hover = false, className = '' }) {
  return (
    <div className={`card-aesthetic rounded-2xl ${hover ? 'card-hover' : ''} ${className}`}>
      {children}
    </div>
  );
}
