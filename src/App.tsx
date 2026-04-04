import { useEffect, useMemo, useState } from 'react'
import './App.css'
import { type AtlasSection, getCopy } from './content/copy'
import { HeroSection } from './sections/HeroSection'
import { LearningLoopSection } from './sections/LearningLoopSection'
import { PrimitiveInventorySection } from './sections/PrimitiveInventorySection'
import { ReferenceRunSection } from './sections/ReferenceRunSection'
import { SingleFileAtlasSection } from './sections/SingleFileAtlasSection'
import { TradeoffSection } from './sections/TradeoffSection'
import { useI18n } from './i18n-context'

function App() {
  const { locale } = useI18n()
  const copy = useMemo(() => getCopy(locale), [locale])

  const [activeSectionLineRange, setActiveSectionLineRange] = useState(copy.atlasSections[0]!.lineRange)

  const activeSection =
    copy.atlasSections.find((section) => section.lineRange === activeSectionLineRange) ??
    copy.atlasSections[0]!

  useEffect(() => {
    setActiveSectionLineRange(copy.atlasSections[0]!.lineRange)
  }, [copy])

  const handleSelectSection = (section: AtlasSection) => {
    setActiveSectionLineRange(section.lineRange)
  }

  return (
    <main className="page-shell">
      <HeroSection copy={copy} />
      <section className="source-workbench" aria-label={copy.ui.sectionTitles.loop}>
        <div className="source-workbench-main">
          <LearningLoopSection copy={copy} />
          <SingleFileAtlasSection
            activeSection={activeSection}
            copy={copy}
            onSelectSection={handleSelectSection}
          />
        </div>
      </section>
      <PrimitiveInventorySection copy={copy} />
      <TradeoffSection copy={copy} />
      <ReferenceRunSection copy={copy} />
    </main>
  )
}

export default App
