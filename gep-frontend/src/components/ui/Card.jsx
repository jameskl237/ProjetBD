// Card.jsx
export default function Card({ title, children, className = '' }) {
  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-3 text-gray-800">{title}</h3>}
      {children}
    </div>
  );
}
