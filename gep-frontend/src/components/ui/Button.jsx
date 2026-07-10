// Button.jsx
export default function Button({ children, onClick, type = 'button', variant = 'primary', disabled = false }) {
  const styles = {
    primary: 'bg-blue-600 hover:bg-blue-700 text-white',
    secondary: 'bg-gray-200 hover:bg-gray-300 text-gray-800',
    danger: 'bg-red-600 hover:bg-red-700 text-white',
  };
  return (
    <button type={type} onClick={onClick} disabled={disabled}
      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${styles[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}>
      {children}
    </button>
  );
}
