import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { clearClientSession } from '../auth';
import './AuthPage.css';

const LoginPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  useEffect(() => {
    const updateNavbar = () => setIsNavScrolled(window.scrollY > 20);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    return () => window.removeEventListener('scroll', updateNavbar);
  }, []);

  const handleChange = (e) => {
    setFormData({...formData, [e.target.name]: e.target.value});
    if (error) setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!formData.email || !formData.password) {
      setError('Please fill in all fields.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload = {
        email: formData.email,
        password: formData.password
      };
      
      const response = await api.post('/api/auth/login', payload);
      
      if (response.data && response.data.access_token) {
        clearClientSession();
        localStorage.setItem('token', response.data.access_token);
        navigate('/dashboard');
      }
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message + ". Check if backend is running on port 8000.");
      } else {
        setError('An error occurred during login. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-shell">
      <header className={`auth-topbar${isNavScrolled ? ' scrolled' : ''}`}>
        <Link to="/" className="auth-logo" aria-label="SmartJyotishi home">
          <span className="auth-logo-mark">ॐ</span>
          <span>
            <span className="auth-logo-kicker">Smart</span>
            <span className="auth-logo-name">Jyotishi</span>
          </span>
        </Link>
        <div className="auth-top-links">
          <Link to="/" className="auth-top-link">Home</Link>
          <Link to="/contact" className="auth-top-link">Contact</Link>
          <Link to="/signup" className="auth-top-link auth-top-cta">Register</Link>
        </div>
      </header>

      <main className="auth-layout">
        <section className="auth-illustration" aria-label="Nepali astrological login">
          <div className="auth-eyebrow">Nepal Panchang • Secure Access</div>
          <h1 className="auth-title">
            Return to Your Reading
            <em>जन्म कुण्डली</em>
          </h1>
          <p className="auth-copy">
            Continue with your saved Kundali, dasha guidance, and planetary insights in a calm SmartJyotishi workspace.
          </p>
          <div className="auth-tags" aria-label="Jyotish focus">
            <span>Graha</span>
            <span className="accent">Lagna</span>
            <span>Nakshatra</span>
          </div>

          <div className="auth-chart" aria-hidden="true">
            <div className="auth-chart-ring"></div>
            <div className="auth-chart-square"></div>
            <div className="auth-chart-center">ॐ</div>
            <span className="auth-chart-note">लग्न</span>
            <span className="auth-chart-note">गु</span>
            <span className="auth-chart-note">चं</span>
            <span className="auth-chart-note">श</span>
          </div>
        </section>

        <section className="auth-form-card">
          <div className="auth-form-header">
            <div className="auth-form-kicker">Welcome Back</div>
            <h2 className="auth-form-title">Login</h2>
            <p className="auth-form-subtitle">Enter your account details to open your astrological dashboard.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="login-email">Email Address</label>
              <input
                id="login-email"
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleChange}
                className="auth-input"
                placeholder="your@email.com"
              />
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label htmlFor="login-password">Password</label>
                <a
                  href="#forgot-password"
                  className="auth-forgot"
                  onClick={(event) => event.preventDefault()}
                >
                  Forgot password?
                </a>
              </div>
              <input
                id="login-password"
                type="password"
                name="password"
                required
                value={formData.password}
                onChange={handleChange}
                className="auth-input"
                placeholder="••••••••"
              />
            </div>

            <button type="submit" disabled={loading} className="auth-submit">
              <span className="auth-submit-icon" aria-hidden="true">
                <svg viewBox="0 0 24 24" fill="none" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="5" y="5" width="14" height="14" rx="1.8" />
                  <path d="M5 5 L19 19 M19 5 L5 19" />
                  <path d="M12 5 L19 12 L12 19 L5 12 Z" />
                  <circle cx="12" cy="12" r="2.2" />
                </svg>
              </span>
              {loading ? 'Opening Chart...' : 'Login'}
            </button>
          </form>

          <p className="auth-switch">
            Don't have an account? <Link to="/signup">Create an Account</Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default LoginPage;
