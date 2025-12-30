import { Routes, Route } from 'react-router-dom'
import { MainWorkflow } from './pages/MainWorkflow'
import { U2NetTestPage } from './pages/U2NetTestPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainWorkflow />} />
      <Route path="/u2net-test" element={<U2NetTestPage />} />
    </Routes>
  )
}

export default App
