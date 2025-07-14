import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import PlayBuilder from './pages/PlayBuilder';
import SignalLab from './pages/SignalLab';
import RitualGuide from './pages/RitualGuide';
import Community from './pages/Community';
import Settings from './pages/Settings';
import TeamBenchmarking from './pages/TeamBenchmarking';
import ProtectedRoute from './components/ProtectedRoute';
import './App.css';

function App() {
  return (
    <AuthProvider>
      <Router>
        <div className="min-h-screen bg-gray-50">
          <Routes>
            {/* Public routes */}
            <Route path="/" element={<LandingPage />} />
            <Route path="/login" element={<LoginPage />} />
            
            {/* Protected app routes */}
            <Route path="/app" element={<ProtectedRoute />}>
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="play-builder" element={<PlayBuilder />} />
              <Route path="signal-lab" element={<SignalLab />} />
              <Route path="ritual-guide" element={<RitualGuide />} />
              <Route path="community" element={<Community />} />
              <Route path="settings" element={<Settings />} />
              <Route path="team-benchmarking" element={<TeamBenchmarking />} />
              <Route index element={<Navigate to="/app/dashboard" replace />} />
            </Route>
            
            {/* Redirect to dashboard for authenticated users */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </Router>
    </AuthProvider>
  );
}

export default App; 