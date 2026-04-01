import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom'
import React, { useEffect, useState } from 'react'
import { supabase } from './lib/supabaseClient'
import { useAuth } from './lib/AuthContext'
import Landing from './pages/Landing'
import Dashboard from './pages/Dashboard'
import MasterPage from './pages/MasterPage'
import SplitterPage from './pages/SplitterPage'
import About from './pages/About'
import Contact from './pages/Contact'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'

function ProtectedRoute({ children }) {
  const { user } = useAuth();
  if (!user) {
    return <Navigate to="/?login=true" replace />;
  }
  return children;
}

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return <div className="p-8 text-red-500 bg-black min-h-screen">
        <h1 className="text-2xl font-bold mb-4">React Error</h1>
        <pre>{this.state.error?.message}</pre>
        <pre className="mt-4 text-xs">{this.state.error?.stack}</pre>
      </div>;
    }
    return this.props.children;
  }
}

function App() {
  return (
    <ErrorBoundary>
      <Router>
        <div className="min-h-screen text-white bg-dark">
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/terms" element={<Terms />} />
            <Route path="/privacy" element={<Privacy />} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/master" element={<ProtectedRoute><MasterPage /></ProtectedRoute>} />
            <Route path="/split" element={<ProtectedRoute><SplitterPage /></ProtectedRoute>} />
          </Routes>
        </div>
      </Router>
    </ErrorBoundary>
  )
}

export default App
