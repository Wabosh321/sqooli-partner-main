import './App.css'
import DashboardPage from './pages/Dashboard'
import {Route, Routes } from 'react-router-dom'
import  Hero  from './pages/Hero'
import SignIn from './pages/SignIn'
import SelectAccount from './pages/SelectAccount'
import SignUp from './pages/SignUp'
import AuthCallback from './pages/AuthCallback'
import NotFound from './components/common/PageNotFound'
import { ProtectedRoute } from './components/Protected'
import { useEffect, useRef } from 'react'
import OnboardingPage from './pages/Onboarding'
import { RootLayout } from './components/layout/RootLayout'



function App() {
  useEffect(() => {
    // No-op: Supabase auth manages sessions client-side.
  }, [])

  const routes = [
    {path:"/", element:<Hero />},
    {path:'signIn', element:<SignIn />},
    {path:'signUp', element:<SignUp />},
    {path:'auth/callback', element:<AuthCallback />},
    {path:'onboarding', element:<ProtectedRoute><OnboardingPage /></ProtectedRoute>},
    {path:'select-account', element:<ProtectedRoute><SelectAccount /></ProtectedRoute>},
    {path:'dashboard', element:<ProtectedRoute><DashboardPage /></ProtectedRoute>},
    {path: '*', element: <NotFound />}
  ]


  return (
    <RootLayout>
      <Routes>
        {routes.map((route) => (
          <Route key={route.path} path={route.path} element={route.element} />
        ))}
      </Routes>
    </RootLayout>
  )
}

export default App
