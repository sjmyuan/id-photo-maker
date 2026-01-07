import { Routes, Route } from 'react-router-dom'
import { MainWorkflow } from './pages/MainWorkflow'

function App() {
  return (
    <Routes>
      <Route path="/" element={<MainWorkflow />} />
    </Routes>
  )
}

export default App
