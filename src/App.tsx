import { useState } from 'react'
import './App.css'
import { atlasSections, type AtlasSection } from './content/atlasSections'
import { loopSteps, type LoopStep } from './content/loopSteps'
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

function App() {
  const [activeStep, setActiveStep] = useState<LoopStep>(loopSteps[0]!)
  const [activeSection, setActiveSection] = useState<AtlasSection>(atlasSections[0]!)
  const [sourceFocus, setSourceFocus] = useState(() => sourceFocusFromLoopStep(loopSteps[0]!))

  const handleSelectStep = (step: LoopStep) => {
    setActiveStep(step)
    setSourceFocus(sourceFocusFromLoopStep(step))
  }

  const handleSelectSection = (section: AtlasSection) => {
    setActiveSection(section)
    setSourceFocus(sourceFocusFromAtlasSection(section))
  }

  return (
    <main className="page-shell">
      <HeroSection />
      <section className="source-workbench" aria-label="學習迴圈與原始碼地圖">
        <div className="source-workbench-main">
          <LearningLoopSection activeStep={activeStep} onSelectStep={handleSelectStep} />
          <SingleFileAtlasSection
            activeSection={activeSection}
            onSelectSection={handleSelectSection}
          />
        </div>
        <div className="source-workbench-aside">
          <StickySourcePanel focus={sourceFocus} />
        </div>
      </section>
      <PrimitiveInventorySection />
      <TradeoffSection />
      <ReferenceRunSection />
    </main>
  )
}

export default App
