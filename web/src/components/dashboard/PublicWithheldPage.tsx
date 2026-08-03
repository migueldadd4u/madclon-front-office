'use client'

// Component Imports
import DataGate from './DataGate'

/**
 * Único entrypoint de datos mientras el contrato público sea `withheld`.
 * No importa consumidores, métricas ni estructuras del panel privado.
 */
const PublicWithheldPage = () => <DataGate />

export default PublicWithheldPage
