import Module36Layout from './Module36Layout'

export default function Placeholder({ title, description = 'Cette page sera disponible prochainement.' }) {
  return (
    <Module36Layout>
      <div className="module36-placeholder">
        <h2>{title}</h2>
        <p>{description}</p>
      </div>
    </Module36Layout>
  )
}
