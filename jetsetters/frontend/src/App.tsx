import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useLocation } from 'react-router-dom'
import type { MultiFactorResolver } from 'firebase/auth'
import AdminLandingPage from './components/admin/AdminLandingPage'
import Login from './components/Login'
import Signup from './components/Signup'
import TwoFactorAuth from './components/TwoFactorAuth'
import AnomalyOverview from './pages/admin/AnomalyOverview'
import { auth } from './config/firebase'
import { onAuthStateChanged } from 'firebase/auth'
import './App.css'

type FlowType = 'signup' | 'login';

function AppContent() {
  const navigate = useNavigate()
  const location = useLocation()
  const [currentEmail, setCurrentEmail] = useState<string>('')
  const [flowType, setFlowType] = useState<FlowType>('login')
  const [verificationId, setVerificationId] = useState<string>('')
  const [mfaResolver, setMfaResolver] = useState<MultiFactorResolver | undefined>(undefined)
  const [userId, setUserId] = useState<string>('')
  const [isCheckingAuth, setIsCheckingAuth] = useState(true)

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', 'dark')
    document.body.setAttribute('data-theme', 'dark')
    
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setIsCheckingAuth(false)
      if (!user && location.pathname === '/admin/dashboard') {
        navigate('/admin/login', { replace: true })
      }
    })

    return () => unsubscribe()
  }, [location.pathname, navigate])

  const handleSignupSuccess = (email: string, verificationId?: string, userId?: string) => {
    setCurrentEmail(email)
    setFlowType('signup')
    setVerificationId(verificationId || '')
    setUserId(userId || '')
    navigate('/admin/twofa-signup')
  }

  const handleLoginSuccess = async (email: string, resolver?: MultiFactorResolver) => {
    setCurrentEmail(email)
    setFlowType('login')
    setMfaResolver(resolver)
    
    if (resolver) {
      const result = await import('./services/adminFirebaseAuth').then(module => 
        module.adminFirebaseAuth.sendMFAVerification(resolver, 'recaptcha-container-mfa-login', 0)
      );
      
      if (result.success && result.verificationId) {
        setVerificationId(result.verificationId)
        navigate('/admin/twofa-login')
      } else {
        alert('Failed to send verification code. Please try again.')
      }
    } else {
      navigate('/admin/dashboard')
    }
  }

  const handleVerifySuccess = () => {
    if (flowType === 'signup') {
      setTimeout(() => {
        navigate('/admin/login')
        setCurrentEmail('')
        alert('Account created successfully! Please log in.')
      }, 500)
    } else {
      navigate('/admin/dashboard')
    }
  }

  const handleNavigateToLogin = () => {
    navigate('/admin/login')
    setCurrentEmail('')
  }

  const handleNavigateToSignup = () => {
    navigate('/admin/signup')
    setCurrentEmail('')
  }

  const handleLogout = () => {
    navigate('/admin')
    setCurrentEmail('')
  }

  const handleEnterAdmin = () => {
    navigate('/admin/login')
  }

  if (isCheckingAuth) {
    return (
      <div className="app" style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh' }}>
        <div style={{ color: '#a0a0a0' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div className="app">
      <div id="recaptcha-container-mfa-login" style={{ display: 'none' }}></div>
      
      <Routes>
        <Route path="/" element={<Navigate to="/admin" replace />} />
        
        <Route path="/admin" element={<AdminLandingPage onEnterAdmin={handleEnterAdmin} />} />
        
        <Route path="/admin/login" element={
          <Login 
            onLoginSuccess={handleLoginSuccess}
            onNavigateToSignup={handleNavigateToSignup}
          />
        } />
        
        <Route path="/admin/signup" element={
          <Signup 
            onSignupSuccess={handleSignupSuccess}
            onNavigateToLogin={handleNavigateToLogin}
          />
        } />
        
        <Route path="/admin/twofa-signup" element={
          <TwoFactorAuth 
            email={currentEmail}
            flowType="signup"
            verificationId={verificationId}
            userId={userId}
            onVerifySuccess={handleVerifySuccess}
          />
        } />

        <Route path="/admin/twofa-login" element={
          <TwoFactorAuth 
            email={currentEmail}
            flowType="login"
            verificationId={verificationId}
            resolver={mfaResolver}
            onVerifySuccess={handleVerifySuccess}
          />
        } />

        <Route path="/admin/dashboard" element={<AnomalyOverview onLogout={handleLogout} />} />
      </Routes>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <AppContent />
    </BrowserRouter>
  )
}

export default App
