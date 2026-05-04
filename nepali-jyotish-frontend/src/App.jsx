import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import LandingPage from './pages/LandingPage';

const LoginPage = lazy(() => import('./pages/LoginPage'));
const SignupPage = lazy(() => import('./pages/SignupPage'));
const ContactPage = lazy(() => import('./pages/ContactPage'));
const BirthDetailsPage = lazy(() => import('./pages/BirthDetailsPage'));
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const ChatPage = lazy(() => import('./pages/ChatPage'));
const RashifalPage = lazy(() => import('./pages/RashifalPage'));
const ProtectedRoute = lazy(() => import('./components/ProtectedRoute'));
const PublicOnlyRoute = lazy(() => import('./components/PublicOnlyRoute'));

const routeFallback = <div className="min-h-screen bg-light-bg" />;

const AppRoutes = () => (
  <Suspense fallback={routeFallback}>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/contact" element={<ContactPage />} />

      {/* Auth pages are only available before login */}
      <Route element={<PublicOnlyRoute />}>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />
      </Route>
      
      {/* Protected Routes */}
      <Route element={<ProtectedRoute />}>
        <Route path="/birth-details" element={<BirthDetailsPage />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/chat" element={<ChatPage />} />
        <Route path="/rashifal" element={<RashifalPage />} />
      </Route>
    </Routes>
  </Suspense>
);

const AppShell = () => {
  const { pathname } = useLocation();

  if (pathname === '/') {
    return <AppRoutes />;
  }

  return (
    <div className="min-h-screen app-celestial-shell text-navy font-sans relative overflow-x-hidden">
      <AppRoutes />
    </div>
  );
};

function App() {
  return (
    <BrowserRouter>
      <AppShell />
    </BrowserRouter>
  );
}

export default App;
