import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import { clearClientSession } from '../auth';
import './AuthPage.css';

const SignupPage = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    fullName: '',
    email: '',
    password: '',
    phone: ''
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

  const validateForm = () => {
    if (!formData.email.match(/^[^\s@]+@[^\s@]+\.[^\s@]+$/)) {
      setError('Please enter a valid email address.');
      return false;
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long.');
      return false;
    }
    if (!formData.phone.trim()) {
      setError('Phone number is required.');
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setLoading(true);
    setError('');

    try {
      const payload = {
        full_name: formData.fullName,
        email: formData.email,
        password: formData.password,
        phone: formData.phone
      };
      
      const response = await api.post('/api/auth/signup', payload);
      
      // Save token if returned
      if (response.data && response.data.access_token) {
        clearClientSession();
        localStorage.setItem('token', response.data.access_token);
      }
      
      // Navigate to next steps
      navigate('/birth-details');
    } catch (err) {
      if (err.response && err.response.data && err.response.data.detail) {
        setError(err.response.data.detail);
      } else if (err.message) {
        setError(err.message + ". Check if backend is running on port 8000.");
      } else {
        setError('An error occurred during signup. Please try again.');
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
          <Link to="/login" className="auth-top-link auth-top-cta">Login</Link>
        </div>
      </header>

      <main className="auth-layout">
        <section className="auth-illustration" aria-label="Nepali astrological registration">
          <div className="auth-eyebrow">Vedic Astrology • Free Register</div>
          <h1 className="auth-title">
            Begin Your Reading
            <em>नेपाल पञ्चाङ्ग</em>
          </h1>
          <p className="auth-copy">
            Create your SmartJyotishi profile, then add birth details for Kundali, graha dasha, and nakshatra guidance.
          </p>
          <div className="auth-tags" aria-label="Jyotish focus">
            <span>Panchang</span>
            <span className="accent">Free Start</span>
            <span>Kundali</span>
          </div>

          <div className="auth-chart" aria-hidden="true">
            <div className="auth-chart-ring"></div>
            <div className="auth-chart-square"></div>
            <div className="auth-chart-center">ॐ</div>
            <span className="auth-chart-note">सू</span>
            <span className="auth-chart-note">गु</span>
            <span className="auth-chart-note">चं</span>
            <span className="auth-chart-note">मं</span>
          </div>
        </section>

        <section className="auth-form-card">
          <div className="auth-form-header">
            <div className="auth-form-kicker">New Profile</div>
            <h2 className="auth-form-title">Free Register</h2>
            <p className="auth-form-subtitle">Set up your account before entering precise birth details.</p>
          </div>

          {error && (
            <div className="auth-error" role="alert">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="auth-form">
            <div className="auth-field">
              <label htmlFor="signup-name">Full Name</label>
              <input
                id="signup-name"
                type="text"
                name="fullName"
                required
                value={formData.fullName}
                onChange={handleChange}
                className="auth-input"
                placeholder="e.g. Ram Bahadur Thapa"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-email">Email Address</label>
              <input
                id="signup-email"
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
              <label htmlFor="signup-phone">Phone Number</label>
              <input
                id="signup-phone"
                type="tel"
                name="phone"
                required
                value={formData.phone}
                onChange={handleChange}
                className="auth-input"
                placeholder="+977 98********"
              />
            </div>

            <div className="auth-field">
              <label htmlFor="signup-password">Password</label>
              <input
                id="signup-password"
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
                  <path d="M16 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2" />
                  <circle cx="9.5" cy="7" r="4" />
                  <path d="M19 8v6" />
                  <path d="M16 11h6" />
                </svg>
              </span>
              {loading ? 'Preparing Chart...' : 'Register Now'}
            </button>
          </form>

          <p className="auth-switch">
            Already have an account? <Link to="/login">Login</Link>
          </p>
        </section>
      </main>
    </div>
  );
};

export default SignupPage;
