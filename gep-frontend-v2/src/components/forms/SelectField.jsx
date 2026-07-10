export default function SelectField({ label, error, options = [], placeholder = 'Sélectionner…', className = '', ...props }) {
  return (
    <div className={className} style={{ marginBottom: 14 }}>
      {label && <label style={{ display: 'block', fontSize: 13, fontWeight: 600, marginBottom: 6, color: 'var(--text-primary)' }}>{label}</label>}
      <select
        {...props}
        style={{
          width: '100%', padding: '10px 12px', borderRadius: 'var(--radius-sm)',
          border: `1px solid ${error ? 'var(--danger)' : 'var(--border)'}`, fontSize: 14,
          background: '#fff', color: 'var(--text-primary)',
        }}
      >
        <option value="">{placeholder}</option>
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {error && <div style={{ fontSize: 12, color: 'var(--danger)', marginTop: 4 }}>{error}</div>}
    </div>
  )
}
