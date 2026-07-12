import { useEffect, useState } from 'react'
import SimpleCrudPage from '../../components/crud/SimpleCrudPage'
import Spinner from '../../components/ui/Spinner'
import { coursApi } from '../../api/cours.api'
import { classesApi } from '../../api/classes.api'

export default function Cours() {
  const [classes, setClasses] = useState(null)

  useEffect(() => { classesApi.list().then(setClasses).catch(() => setClasses([])) }, [])

  if (!classes) return <Spinner label="Chargement…" />

  return (
    <SimpleCrudPage
      title="Cours & Matières"
      subtitle="Matières enseignées, rattachées à une classe"
      service={coursApi}
      idField="idCours"
      columns={[
        { key: 'libelle', label: 'Libellé' },
        { key: 'classe', label: 'Classe', render: (r) => classes.find((c) => c.idClasse === r.idClasse)?.libelle || `#${r.idClasse}` },
        { key: 'coefficient', label: 'Coefficient' },
        { key: 'heures', label: 'Heures' },
      ]}
      fields={[
        { name: 'libelle', label: 'Libellé', required: true },
        { name: 'idClasse', label: 'Classe', type: 'select', required: true, options: classes.map((c) => ({ value: c.idClasse, label: c.libelle })) },
        { name: 'coefficient', label: 'Coefficient', type: 'number', default: 1 },
        { name: 'heures', label: 'Heures', type: 'number' },
        { name: 'description', label: 'Description' },
      ]}
    />
  )
}
