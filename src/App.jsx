import { Routes, Route } from 'react-router-dom'
import ClientePage from './pages/cliente/ClientePage'
import AdminPage from './pages/admin/AdminPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ClientePage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
