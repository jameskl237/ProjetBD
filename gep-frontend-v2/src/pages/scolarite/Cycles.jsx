import SimpleCrudPage from '../../components/crud/SimpleCrudPage'
import { cyclesApi } from '../../api/scolarite.api'

export default function Cycles() {
  return (
    <SimpleCrudPage
      title="Cycles"
      subtitle="Cycles d'enseignement de l'établissement"
      service={cyclesApi}
      idField="idCycle"
      columns={[
        { key: 'libelle', label: 'Libellé' },
        { key: 'description', label: 'Description' },
      ]}
      fields={[
        { name: 'libelle', label: 'Libellé', required: true },
        { name: 'description', label: 'Description' },
      ]}
    />
  )
}
