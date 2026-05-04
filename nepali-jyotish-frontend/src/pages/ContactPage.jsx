import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { clearClientSession } from '../auth';
import './ContactPage.css';

const contactMethods = [
  {
    label: 'Email',
    value: 'support@smartjyotishi.com',
    href: 'mailto:support@smartjyotishi.com',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3.5" y="5.5" width="17" height="13" rx="2" />
        <path d="M4 7l8 6 8-6" />
      </svg>
    ),
  },
  {
    label: 'Mobile',
    value: '+977 980-0000000',
    href: 'tel:+9779800000000',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M8 4.5h8a1.5 1.5 0 0 1 1.5 1.5v12a1.5 1.5 0 0 1-1.5 1.5H8A1.5 1.5 0 0 1 6.5 18V6A1.5 1.5 0 0 1 8 4.5Z" />
        <path d="M10 7h4" />
        <path d="M11.5 17h1" />
      </svg>
    ),
  },
  {
    label: 'WhatsApp',
    value: '+977 980-0000000',
    href: 'https://wa.me/9779800000000',
    icon: (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M5.8 18.2 4.5 21l3.1-1.1a8 8 0 1 0-1.8-1.7Z" />
        <path d="M9.1 8.7c.2-.4.4-.4.7-.4h.5c.2 0 .4.1.5.4l.7 1.6c.1.3 0 .5-.1.7l-.4.5c-.1.2-.2.3-.1.5.4.8 1.2 1.6 2 2 .2.1.3 0 .5-.1l.5-.6c.2-.2.4-.2.7-.1l1.6.7c.3.1.4.3.4.6 0 .5-.4 1.4-1 1.7-.5.3-1.3.4-2.7-.2-2.3-.9-4.1-2.7-5-5-.6-1.4-.5-2.2-.2-2.7.2-.4.6-.7.9-.8Z" />
      </svg>
    ),
  },
];

const ContactPage = () => {
  const navigate = useNavigate();
  const isLoggedIn = Boolean(localStorage.getItem('token'));
  const [isNavScrolled, setIsNavScrolled] = useState(false);

  useEffect(() => {
    const updateNavbar = () => setIsNavScrolled(window.scrollY > 20);
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    return () => window.removeEventListener('scroll', updateNavbar);
  }, []);

  const handleSignOut = () => {
    clearClientSession();
    navigate('/login', { replace: true });
  };

  return (
    <main className="contact-shell">
      <div className="contact-stars" aria-hidden="true" />

      <nav className={`contact-nav${isNavScrolled ? ' scrolled' : ''}`} aria-label="Contact page navigation">
        <Link to="/" className="contact-logo">
          <span>ॐ</span>
          <div>
            <small>Smart</small>
            Jyotishi
          </div>
        </Link>

        <div className="contact-nav-links">
          <Link to="/">Home</Link>
          {isLoggedIn ? (
            <>
              <Link to="/dashboard">Dashboard</Link>
              <button type="button" className="contact-nav-cta" onClick={handleSignOut}>
                Sign Out
              </button>
            </>
          ) : (
            <>
              <Link to="/login">Login</Link>
              <Link to="/signup" className="contact-nav-cta">Free Register</Link>
            </>
          )}
        </div>
      </nav>

      <section className="contact-hero">
        <div className="contact-copy">
          <p className="contact-eyebrow">Contact Us • Smart Jyotishi</p>
          <h1 className="contact-title">
            Reach our astrology desk
            <em>for support</em>
          </h1>
          <p className="contact-body">
            Connect with us for account help, birth detail corrections, or Kundali detail questions.
            We keep the same calm, precise experience from your chart to your conversation.
          </p>
        </div>

        <div className="contact-panel" aria-label="Contact details">
          <header className="contact-panel-header">
            <p className="contact-panel-kicker">Support Desk</p>
            <h2 className="contact-panel-title">Contact details</h2>
            <p className="contact-panel-subtitle">Choose the channel that works best for you.</p>
          </header>

          {contactMethods.map((method) => (
            <a className="contact-card" href={method.href} key={method.label}>
              <span className="contact-icon">{method.icon}</span>
              <span>
                <small>{method.label}</small>
                <strong>{method.value}</strong>
              </span>
            </a>
          ))}
        </div>
      </section>
    </main>
  );
};

export default ContactPage;
