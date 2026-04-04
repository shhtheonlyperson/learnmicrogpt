import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { type AtlasSection, getCopy, type LoopStep } from './content/copy'
import {
  sourceFocusFromAtlasSection,
  sourceFocusFromLoopStep,
} from './content/sourceFocus'
import { StickySourcePanel } from './components/StickySourcePanel'
import { HeroSection } from './sections/HeroSection'
import { LearningLoopSection } from './sections/LearningLoopSection'
import { PrimitiveInventorySection } from './sections/PrimitiveInventorySection'
import { ReferenceRunSection } from './sections/ReferenceRunSection'
import { SingleFileAtlasSection } from './sections/SingleFileAtlasSection'
import { TradeoffSection } from './sections/TradeoffSection'
import { useI18n } from './i18n'

function App() {
  const { locale } = useI18n()
  const copy = useMemo(() => getCopy(locale), [locale])

  const [activeStepId, setActiveStepId] = useState(copy.loopSteps[0]!.id)
  const [activeSectionLineRange, setActiveSectionLineRange] = useState(copy.atlasSections[0]!.lineRange)

  const activeStep = copy.loopSteps.find((step) => step.id === activeStepId) ?? copy.loopSteps[0]!
  const activeSection =
    copy.atlasSections.find((section) => section.lineRange === activeSectionLineRange) ??
    copy.atlasSections[0]!

  const [sourceFocus, setSourceFocus] = useState(() => sourceFocusFromLoopStep(activeStep, copy.ui))

  useEffect(() => {
    setActiveStepId(copy.loopSteps[0]!.id)
    setActiveSectionLineRange(copy.atlasSections[0]!.lineRange)
    setSourceFocus(sourceFocusFromLoopStep(copy.loopSteps[0]!, copy.ui))
  }, [copy])

  const handleSelectStep = (step: LoopStep) => {
    setActiveStepId(step.id)
    setSourceFocus(sourceFocusFromLoopStep(step, copy.ui))
  }

  const handleSelectSection = (section: AtlasSection) => {
    setActiveSectionLineRange(section.lineRange)
    setSourceFocus(sourceFocusFromAtlasSection(section, copy.ui))
  }

  return (
    <main className="page-shell">
      <HeroSection copy={copy} />
      <section className="source-workbench" aria-label={copy.ui.sectionTitles.loop}>
        <div className="source-workbench-main">
          <LearningLoopSection
            activeStep={activeStep}
            copy={copy}
            onSelectStep={handleSelectStep}
          />
          <SingleFileAtlasSection
            activeSection={activeSection}
            copy={copy}
            onSelectSection={handleSelectSection}
          />
        </div>
        <div className="source-workbench-aside">
          <StickySourcePanel copy={copy.ui} focus={sourceFocus} />
        </div>
      </section>
      <PrimitiveInventorySection copy={copy} />
      <TradeoffSection copy={copy} />
      <ReferenceRunSection copy={copy} />
    </main>
  )
}

export default App
