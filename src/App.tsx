import { useState } from 'react'
import { DashboardPage } from './features/dashboard/DashboardPage'
import { LoginPage } from './features/auth/LoginPage'
import { RegisterPage } from './features/auth/RegisterPage'

type View = 'login' | 'register' | 'dashboard'

function App() {
  const [view, setView] = useState<View>('login')
  const [token, setToken] = useState<string | null>(null)

  function handleLoginSuccess(t: string) {
    setToken(t)
    setView('dashboard')
  }

  function handleRegisterSuccess() {
    setView('login')
  }

  function handleLogout() {
    setToken(null)
    setView('login')
  }

  if (view === 'register') {
    return (
      <RegisterPage
        onSuccess={handleRegisterSuccess}
        onLogin={() => setView('login')}
      />
    )
  }

  if (view === 'dashboard' && token) {
    return (
      <DashboardPage
        token={token}
        onLogout={handleLogout}
      />
    )
  }

  return (
    <LoginPage
      onSuccess={handleLoginSuccess}
      onRegister={() => setView('register')}
    />
  )
}

export default App
