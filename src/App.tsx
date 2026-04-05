import { useMemo } from 'react'
import './App.css'
import { getCopy } from './content/copy'
import { HeroSection } from './sections/HeroSection'
import { LearningLoopSection } from './sections/LearningLoopSection'
import { PrimitiveInventorySection } from './sections/PrimitiveInventorySection'
import { ReferenceRunSection } from './sections/ReferenceRunSection'
import { useI18n } from './i18n-context'

function App() {
  const { locale } = useI18n()
  const copy = useMemo(() => getCopy(locale), [locale])

  return (
    <main className="page-shell">
      <HeroSection copy={copy} />
      <LearningLoopSection copy={copy} />
      <PrimitiveInventorySection copy={copy} />
      <ReferenceRunSection copy={copy} />
    </main>
  )
}

export default App
