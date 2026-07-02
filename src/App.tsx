import { useEffect, useState } from 'react'
import Nav, { type View } from './components/Nav'
import Dashboard from './components/Dashboard'
import LessonBuilder from './components/LessonBuilder'
import GeneralizationBuilder from './components/GeneralizationBuilder'
import AssessmentBuilder from './components/AssessmentBuilder'
import StagedAssessmentBuilder from './components/StagedAssessmentBuilder'
import TechniqueLibrary from './components/TechniqueLibrary'
import ReferencesShelf from './components/ReferencesShelf'
import Gallery from './components/Gallery'

const VIEW_KEY = 'kcbc:view'

export default function App() {
  const [view, setView] = useState<View>(() => {
    const saved = localStorage.getItem(VIEW_KEY) as View | null
    return saved || 'dashboard'
  })

  useEffect(() => {
    localStorage.setItem(VIEW_KEY, view)
  }, [view])

  return (
    <div className="shell">
      <Nav view={view} onChange={setView} />
      <main className="shell__main wrap">
        {view === 'dashboard' && <Dashboard onNavigate={setView} />}
        {view === 'lesson' && <LessonBuilder />}
        {view === 'generalize' && <GeneralizationBuilder />}
        {view === 'assess' && <AssessmentBuilder />}
        {view === 'staged' && <StagedAssessmentBuilder />}
        {view === 'techniques' && <TechniqueLibrary />}
        {view === 'references' && <ReferencesShelf mode="full" onNavigate={setView} />}
        {view === 'gallery' && <Gallery onNavigate={setView} />}
      </main>
      <footer className="shell__foot">
        KCBC Builder Studio · 모든 데이터는 브라우저에 저장됩니다 · v0.2
      </footer>
    </div>
  )
}
