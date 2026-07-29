import Header from './Header'

function AuthShell({ children }) {
  return (
    <>
      <Header />
      <main className="page page-auth">
        <section className="auth-card">{children}</section>
      </main>
    </>
  )
}

export default AuthShell
