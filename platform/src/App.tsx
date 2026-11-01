import { lazy, type ComponentType } from 'react'
import { LoaderCircle } from 'lucide-react'
import { HashRouter, Navigate, Route, Routes } from 'react-router-dom'
import { Layout } from './components/layout/Layout'
import { Dashboard } from './pages/Dashboard'
import { SelfCheckPage } from './pages/SelfCheckPage'
import { LoginPage } from './pages/LoginPage'
import { AccessNotice } from './components/AccessNotice'
import { useAccountStore } from './lib/accountStore'
import { isAdmin } from './lib/account'
import { loadAccount, signOut } from './lib/accountEngine'

// Las páginas se bajan al visitarlas; `Layout` ya las envuelve en `Suspense`.
// Dashboard es la portada y SelfCheckPage se prueba en su primer pintado síncrono.
const page = <K extends string>(load: () => Promise<Record<K, ComponentType>>, name: K) =>
  lazy(() => load().then((m) => ({ default: m[name] })))
const ReasoningOverview = page(() => import('./pages/ReasoningOverview'), 'ReasoningOverview')
const ReasoningSkillPage = page(() => import('./pages/ReasoningSkillPage'), 'ReasoningSkillPage')
const FieldMcqOverview = page(() => import('./pages/FieldMcqOverview'), 'FieldMcqOverview')
const FieldMcqPage = page(() => import('./pages/FieldMcqPage'), 'FieldMcqPage')
const EuftePage = page(() => import('./pages/EuftePage'), 'EuftePage')
const TestDayPage = page(() => import('./pages/TestDayPage'), 'TestDayPage')
const StrategyPage = page(() => import('./pages/StrategyPage'), 'StrategyPage')
const ApplicationPage = page(() => import('./pages/ApplicationPage'), 'ApplicationPage')
const ResourcesPage = page(() => import('./pages/ResourcesPage'), 'ResourcesPage')
const BoardPage = page(() => import('./pages/BoardPage'), 'BoardPage')
const ProgressPage = page(() => import('./pages/ProgressPage'), 'ProgressPage')
const CoursePage = page(() => import('./pages/CoursePage'), 'CoursePage')
const CourseModulePage = page(() => import('./pages/CourseModulePage'), 'CourseModulePage')
const CalendarPage = page(() => import('./pages/CalendarPage'), 'CalendarPage')
const SettingsPage = page(() => import('./pages/SettingsPage'), 'SettingsPage')
const AdminPage = page(() => import('./pages/AdminPage'), 'AdminPage')

function App() {
  // La puerta. Sin cuenta aprobada no se monta nada más: ni el armazón, ni las
  // rutas, ni los bloques de contenido que cuelgan de ellas.
  //
  // Qué enseñar es lo único que decide: la vigilancia de la sesión la arranca
  // `main.tsx`, de modo que esto es una función pura de lo que hay en el
  // almacén y se puede probar fijando el almacén.
  const phase = useAccountStore((s) => s.phase())
  const email = useAccountStore((s) => s.email)
  const failure = useAccountStore((s) => s.failure)
  const admin = isAdmin(useAccountStore((s) => s.account))

  // `starting` no es «sin sesión»: es que todavía no se sabe. Enseñar la
  // puerta aquí la haría parpadear en cada recarga a quien ya está dentro.
  if (phase === 'starting') return <StartingScreen />
  if (phase === 'signed-out') return <LoginPage />
  if (phase !== 'ready') {
    return (
      <AccessNotice
        kind={phase}
        email={email}
        failure={failure}
        onRetry={() => void loadAccount()}
        onSignOut={() => void signOut()}
      />
    )
  }

  return (
    <HashRouter>
      <Routes>
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/razonamiento" element={<ReasoningOverview />} />
          <Route path="/razonamiento/:skillId" element={<ReasoningSkillPage />} />
          <Route path="/campo" element={<FieldMcqOverview />} />
          <Route path="/campo/:fieldId" element={<FieldMcqPage />} />
          <Route path="/formacion" element={<CoursePage />} />
          <Route path="/formacion/:moduleId" element={<CourseModulePage />} />
          <Route path="/eufte" element={<EuftePage />} />
          <Route path="/estrategia" element={<StrategyPage />} />
          <Route path="/dia-del-examen" element={<TestDayPage />} />
          <Route path="/candidaturas" element={<ApplicationPage />} />
          <Route path="/recursos" element={<ResourcesPage />} />
          <Route path="/tablon" element={<BoardPage />} />
          <Route path="/progreso" element={<ProgressPage />} />
          <Route path="/calendario" element={<CalendarPage />} />
          <Route path="/ajustes" element={<SettingsPage />} />
          {/* Del administrador. La ruta no existe para los demás, así que
              escribirla a mano lleva al panel, no a una página vacía ni a un
              error. La protección de verdad no es ésta: es que la base de
              datos no deja leer ni escribir nada de esto sin ser admin. */}
          {admin && <Route path="/admin" element={<AdminPage />} />}
          {admin && <Route path="/verificacion" element={<SelfCheckPage />} />}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </HashRouter>
  )
}

/**
 * El instante en que se recupera la sesión del disco.
 *
 * Deliberadamente sobria: dura una fracción de segundo y lo que no puede hacer
 * es parecer una pantalla de error ni adelantar a qué se va a entrar.
 */
function StartingScreen() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-sunken">
      <LoaderCircle size={22} className="animate-spin text-ink-muted" aria-hidden="true" />
    </div>
  )
}

export default App
