import { useState } from 'react'

import ConfigModal from './components/screens/ConfigModal'
import InitialScreen from './components/screens/InitialScreen'
import ResultsScreen from './components/screens/ResultsScreen'
import { useAttackCatalog } from './hooks/useAttackCatalog'
import type { Attack, Screen } from './lib/types'

type AuditRequest = {
  systemPrompt: string
  attacks: Attack[]
}

function App() {
  const [screen, setScreen] = useState<Screen>('initial')
  const [auditRequest, setAuditRequest] = useState<AuditRequest | null>(null)
  const { status, attacks, retry } = useAttackCatalog()

  const backToInitial = () => {
    setAuditRequest(null)
    setScreen('initial')
  }

  const startAudit = (systemPrompt: string, attackIds: string[]) => {
    const selected = attackIds
      .map((id) => attacks.find((attack) => attack.id === id))
      .filter((attack): attack is Attack => attack !== undefined)

    setAuditRequest({ systemPrompt, attacks: selected })
    setScreen('results')
  }

  // The initial screen stays mounted behind the modal so focus can return to the CTA.
  const showInitial = screen === 'initial' || screen === 'config'

  return (
    <main className="relative mx-auto flex min-h-svh w-full max-w-shell flex-col justify-center overflow-hidden px-page py-section lg:px-page-lg lg:py-section-lg">
      {showInitial && (
        <InitialScreen
          status={status}
          attacks={attacks}
          onStart={() => setScreen('config')}
          onRetry={retry}
        />
      )}
      {screen === 'config' && (
        <ConfigModal attacks={attacks} onClose={backToInitial} onConfirm={startAudit} />
      )}
      {screen === 'results' && auditRequest && (
        <ResultsScreen
          systemPrompt={auditRequest.systemPrompt}
          attacks={auditRequest.attacks}
          onRestart={backToInitial}
        />
      )}
    </main>
  )
}

export default App
