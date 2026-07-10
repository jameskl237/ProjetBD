// FormError.jsx
export default function FormError({ message }) {
  if (!message) return null;
  return (
    <div className="bg-red-50 border border-red-300 text-red-700 px-4 py-2 rounded text-sm mb-4">
      {message}
    </div>
  );
}
