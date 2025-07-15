import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Onboarding from './pages/Onboarding';
import Dashboard from './pages/Dashboard';
import PlayBuilder from './pages/PlayBuilder';
import SignalLab from './pages/SignalLab';
import RitualGuide from './pages/RitualGuide';
import MiniTools from './pages/MiniTools';
import PlainEnglishTranslator from './pages/mini-tools/PlainEnglishTranslator';
import GetToByGenerator from './pages/mini-tools/GetToByGenerator';
import CreativeTensionFinder from './pages/mini-tools/CreativeTensionFinder';
import PersonaGenerator from './pages/mini-tools/PersonaGenerator';
import JourneyBuilder from './pages/mini-tools/JourneyBuilder';
import TestLearnScale from './pages/mini-tools/TestLearnScale';
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
              <Route path="onboarding" element={<Onboarding />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="play-builder" element={<PlayBuilder />} />
              <Route path="signal-lab" element={<SignalLab />} />
              <Route path="ritual-guide" element={<RitualGuide />} />
              <Route path="mini-tools" element={<MiniTools />} />
              <Route path="mini-tools/plain-english-translator" element={<PlainEnglishTranslator />} />
              <Route path="mini-tools/get-to-by-generator" element={<GetToByGenerator />} />
              <Route path="mini-tools/creative-tension-finder" element={<CreativeTensionFinder />} />
              <Route path="mini-tools/persona-generator" element={<PersonaGenerator />} />
              <Route path="mini-tools/journey-builder" element={<JourneyBuilder />} />
              <Route path="mini-tools/test-learn-scale" element={<TestLearnScale />} />
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