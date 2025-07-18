import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './lib/auth';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import TermsOfService from './pages/TermsOfService';
import PrivacyPolicy from './pages/PrivacyPolicy';
import SecurityPolicy from './pages/SecurityPolicy';
import FAQ from './pages/FAQ';
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
import AgileSprintPlanner from './pages/mini-tools/AgileSprintPlanner';
import ConnectedMediaMatrix from './pages/mini-tools/ConnectedMediaMatrix';
import SyntheticFocusGroup from './pages/mini-tools/SyntheticFocusGroup';
import Community from './pages/Community';
import Settings from './pages/Settings';
import TeamBenchmarking from './pages/TeamBenchmarking';
import HistoryPage from './pages/HistoryPage';
import TeamSharedPage from './pages/TeamSharedPage';
import PublicSharedPage from './pages/PublicSharedPage';
import Admin from './pages/Admin';
import SystemPromptsAdmin from './pages/SystemPromptsAdmin';
import TrainingModule from './pages/TrainingModule';
import QuarterlyPlanner from './pages/QuarterlyPlanner';
import QuarterlyPlannerForm from './pages/QuarterlyPlannerForm';
import InvitePage from './pages/InvitePage';
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
            <Route path="/terms" element={<TermsOfService />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/security" element={<SecurityPolicy />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/shared/:slug" element={<PublicSharedPage />} />
            <Route path="/invite" element={<InvitePage />} />
            
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
              <Route path="mini-tools/agile-sprint-planner" element={<AgileSprintPlanner />} />
              <Route path="mini-tools/connected-media-matrix" element={<ConnectedMediaMatrix />} />
              <Route path="mini-tools/synthetic-focus-group" element={<SyntheticFocusGroup />} />
              <Route path="community" element={<Community />} />
              <Route path="settings" element={<Settings />} />
              <Route path="team-benchmarking" element={<TeamBenchmarking />} />
              <Route path="history" element={<HistoryPage />} />
              <Route path="team-shared" element={<TeamSharedPage />} />
              <Route path="team-shared/:slug" element={<TeamSharedPage />} />
              <Route path="admin" element={<Admin />} />
              <Route path="admin/prompts" element={<SystemPromptsAdmin />} />
              <Route path="training" element={<TrainingModule />} />
              <Route path="quarterly-planner" element={<QuarterlyPlannerForm />} />
              <Route path="tools/planner" element={<QuarterlyPlanner />} />
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