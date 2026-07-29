import { Routes, Route } from 'react-router-dom'
import ClientePage from './pages/cliente/ClientePage'
import MinhaContaPage from './pages/cliente/MinhaContaPage'
import AdminPage from './pages/admin/AdminPage'
import LoginPage from './pages/auth/LoginPage'
import CadastroPage from './pages/auth/CadastroPage'
import RecuperarSenhaPage from './pages/auth/RecuperarSenhaPage'
import RedefinirSenhaPage from './pages/auth/RedefinirSenhaPage'

function App() {
  return (
    <Routes>
      <Route path="/" element={<ClientePage />} />
      <Route path="/entrar" element={<LoginPage />} />
      <Route path="/cadastro" element={<CadastroPage />} />
      <Route path="/recuperar-senha" element={<RecuperarSenhaPage />} />
      <Route path="/redefinir-senha" element={<RedefinirSenhaPage />} />
      <Route path="/minha-conta" element={<MinhaContaPage />} />
      <Route path="/admin" element={<AdminPage />} />
    </Routes>
  )
}

export default App
