// Alert.jsx
export default function Alert({ message, type = 'info', onClose }) {
  const styles = {
    info: 'bg-blue-50 border-blue-300 text-blue-800',
    success: 'bg-green-50 border-green-300 text-green-800',
    warning: 'bg-yellow-50 border-yellow-300 text-yellow-800',
    error: 'bg-red-50 border-red-300 text-red-800',
  };
  return (
    <div className={`border px-4 py-3 rounded text-sm flex justify-between items-center ${styles[type]}`}>
      <span>{message}</span>
      {onClose && <button onClick={onClose} className="ml-4 font-bold">×</button>}
    </div>
  );
}
