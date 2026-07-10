// Table.jsx
export default function Table({ columns = [], data = [], onRowClick }) {
  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200 text-sm">
        <thead className="bg-gray-50">
          <tr>{columns.map(col => (
            <th key={col.key} className="px-4 py-2 text-left font-medium text-gray-600">{col.label}</th>
          ))}</tr>
        </thead>
        <tbody className="divide-y divide-gray-100">
          {data.map((row, i) => (
            <tr key={i} onClick={() => onRowClick?.(row)} className={onRowClick ? 'cursor-pointer hover:bg-gray-50' : ''}>
              {columns.map(col => <td key={col.key} className="px-4 py-2 text-gray-700">{row[col.key]}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
