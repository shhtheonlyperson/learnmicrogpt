import { useMemo, useState } from 'react'
import './App.css'
import './interactive.css'
import { getCopy } from './content/copy'
import { getInteractiveLabCopy, type InteractiveLabId } from './content/interactiveLab'
import { HeroSection } from './sections/HeroSection'
import { InteractiveLabSection } from './sections/InteractiveLabSection'
import { LearningLoopSection } from './sections/LearningLoopSection'
import { PrimitiveInventorySection } from './sections/PrimitiveInventorySection'
import { ReferenceRunSection } from './sections/ReferenceRunSection'
import { useI18n } from './i18n-context'

function App() {
  const { locale } = useI18n()
  const copy = useMemo(() => getCopy(locale), [locale])
  const interactiveLabCopy = useMemo(() => getInteractiveLabCopy(locale), [locale])
  const [activeLabId, setActiveLabId] = useState<InteractiveLabId>('tokenizer')

  return (
    <main className="page-shell">
      <HeroSection
        activeLabId={activeLabId}
        copy={copy}
        labChapters={interactiveLabCopy.chapters}
        labHeroBody={interactiveLabCopy.heroBody}
        labHeroEyebrow={interactiveLabCopy.heroEyebrow}
        labHeroTitle={interactiveLabCopy.heroTitle}
        onSelectLab={setActiveLabId}
      />
      <LearningLoopSection copy={copy} />
      <InteractiveLabSection activeLabId={activeLabId} copy={copy} onSelectLab={setActiveLabId} />
      <PrimitiveInventorySection copy={copy} />
      <ReferenceRunSection copy={copy} />
    </main>
  )
}

export default App
