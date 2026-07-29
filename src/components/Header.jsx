import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '../hooks/useAuth'
import { signOut } from '../lib/auth'
import logo from '../assets/logo_exemplo.png'

function Header() {
  const { t } = useTranslation()
  const { session, perfil, loading } = useAuth()
  const [menuAberto, setMenuAberto] = useState(false)

  function fecharMenu() {
    setMenuAberto(false)
  }

  async function handleSair() {
    fecharMenu()
    await signOut()
  }

  return (
    <header className="app-header">
      <Link to="/" className="app-logo" onClick={fecharMenu}>
        <img src={logo} alt={t('header.logoAlt')} />
      </Link>

      <div className="app-menu">
        <button
          type="button"
          className="app-menu-toggle"
          aria-expanded={menuAberto}
          aria-label={t('header.menuLabel')}
          onClick={() => setMenuAberto((v) => !v)}
        >
          <span />
          <span />
          <span />
        </button>

        {menuAberto && (
          <>
            <div className="app-menu-backdrop" onClick={fecharMenu} />
            <nav className="app-menu-dropdown">
              <Link to="/#agendamento" onClick={fecharMenu}>
                {t('header.agendar')}
              </Link>
              <Link to="/#servicos" onClick={fecharMenu}>
                {t('header.servicos')}
              </Link>
              {!loading && session && perfil?.papel === 'cliente' && (
                <Link to="/minha-conta" onClick={fecharMenu}>
                  {t('header.myAccount')}
                </Link>
              )}
              {!loading && session && perfil?.papel === 'admin' && (
                <Link to="/admin" onClick={fecharMenu}>
                  {t('header.admin')}
                </Link>
              )}
              {!loading && !session && (
                <>
                  <Link to="/entrar" onClick={fecharMenu}>
                    {t('header.login')}
                  </Link>
                  <Link to="/cadastro" onClick={fecharMenu}>
                    {t('header.signup')}
                  </Link>
                  <Link to="/admin" onClick={fecharMenu}>
                    {t('header.admin')}
                  </Link>
                </>
              )}
              {!loading && session && (
                <button type="button" className="app-menu-action" onClick={handleSair}>
                  {t('header.logout')}
                </button>
              )}
            </nav>
          </>
        )}
      </div>
    </header>
  )
}

export default Header
