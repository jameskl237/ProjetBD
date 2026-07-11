import SimpleCrudPage from '../../components/crud/SimpleCrudPage'
import { sallesApi } from '../../api/classes.api'

export default function Salles() {
  return (
    <SimpleCrudPage
      title="Salles"
      subtitle="Salles physiques disponibles pour l'affectation des classes"
      service={sallesApi}
      idField="idSalle"
      columns={[
        { key: 'libelle', label: 'Libellé' },
        { key: 'position', label: 'Position' },
        { key: 'capacite', label: 'Capacité' },
        { key: 'idClasse', label: 'Classe affectée', render: (r) => r.idClasse ? `Classe #${r.idClasse}` : 'Libre' },
      ]}
      fields={[
        { name: 'libelle', label: 'Libellé', required: true },
        { name: 'position', label: 'Position' },
        { name: 'surface', label: 'Surface' },
        { name: 'capacite', label: 'Capacité', type: 'number' },
      ]}
    />
  )
}
