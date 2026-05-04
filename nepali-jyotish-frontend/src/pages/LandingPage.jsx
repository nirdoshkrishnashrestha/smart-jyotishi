import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import frontpageMarkup from './frontpageMarkup.html?raw';
import './LandingPage.css';

const skyNotes = [
  { symbol: 'सू', label: 'सूर्य', top: '18%', left: '54%', delay: 0 },
  { symbol: 'चं', label: 'चन्द्र', top: '74%', left: '50%', delay: 1.1 },
  { symbol: 'गु', label: 'बृहस्पति', top: '58%', left: '84%', delay: 1.7 },
  { symbol: 'श', label: 'शनि', top: '17%', left: '78%', delay: 2.1 },
];

const getRouteForLink = (text) => {
  const normalized = text.replace(/\s+/g, ' ').trim().toLowerCase();

  if (normalized.includes('signup') || normalized.includes('free register') || normalized.includes('create profile')) {
    return '/signup';
  }

  if (normalized.includes('login')) {
    return '/login';
  }

  if (normalized.includes('contact')) {
    return '/contact';
  }

  if (normalized.includes('enter details')) {
    return '/birth-details';
  }

  if (normalized.includes('open chart')) {
    return '/dashboard';
  }

  if (normalized.includes('ask now')) {
    return '/chat';
  }

  return null;
};

const LandingPage = () => {
  const pageRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    const page = pageRef.current;
    if (!page) return undefined;

    const previousTitle = document.title;
    document.title = 'SmartJyotishi';

    const canvas = page.querySelector('#stars');
    const ctx = canvas?.getContext('2d');
    const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    let stars = [];
    let starFrame = 0;
    let wheelFrame = 0;
    let resizeFrame = 0;
    const noteTimers = [];
    let angle = 0;

    const initStars = () => {
      if (!canvas) return;

      stars = Array.from({ length: 260 }, () => ({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height,
        r: Math.random() * 1.4 + 0.2,
        speed: Math.random() * 0.006 + 0.002,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const drawStars = (time = 0) => {
      if (!canvas || !ctx) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);
      stars.forEach((star) => {
        const alpha = 0.3 + 0.7 * (0.5 + 0.5 * Math.sin(time * star.speed + star.phase));
        ctx.beginPath();
        ctx.arc(star.x, star.y, star.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(232, 201, 109, ${alpha * 0.65})`;
        ctx.fill();
      });
    };

    const animateStars = (time) => {
      drawStars(time);
      starFrame = window.requestAnimationFrame(animateStars);
    };

    const resizeStars = () => {
      if (!canvas) return;

      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
      initStars();
      drawStars();
    };

    const scheduleResizeStars = () => {
      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      resizeFrame = window.requestAnimationFrame(resizeStars);
    };

    resizeStars();
    window.addEventListener('resize', scheduleResizeStars);
    if (!reduceMotion) {
      starFrame = window.requestAnimationFrame(animateStars);
    }

    const planetContainer = page.querySelector('#planets');
    skyNotes.forEach((planet) => {
      const note = document.createElement('div');
      note.className = 'sky-note';
      note.style.top = planet.top;
      note.style.left = planet.left;
      note.style.animationDelay = `${planet.delay}s`;
      note.innerHTML = `<span>${planet.symbol}</span>${planet.label}`;
      planetContainer?.appendChild(note);
      noteTimers.push(window.setTimeout(() => {
        note.style.opacity = '1';
      }, 1200 + planet.delay * 300));
    });

    const navbar = page.querySelector('#navbar');
    const updateNavbar = () => {
      navbar?.classList.toggle('scrolled', window.scrollY > 20);
    };
    updateNavbar();
    window.addEventListener('scroll', updateNavbar, { passive: true });

    const heroTitle = page.querySelector('.hero-title');
    const heroCopy = page.querySelector('.hero-copy');
    const rashiContainer = page.querySelector('.rashi-container');
    const mobileHeroPills = page.querySelector('.mobile-hero-pills');
    const mobileHeroQuery = window.matchMedia('(max-width: 900px)');

    const placeRashiChart = (event) => {
      if (!rashiContainer || !heroCopy) return;

      if (event.matches) {
        (mobileHeroPills || heroTitle)?.after(rashiContainer);
      } else {
        heroCopy.after(rashiContainer);
      }
    };

    placeRashiChart(mobileHeroQuery);
    mobileHeroQuery.addEventListener('change', placeRashiChart);

    const wheel = page.querySelector('#rashiWheel');
    const orbitWheel = () => {
      if (!wheel) return;

      angle += 0.07;
      wheel.style.transform = `rotate(${angle}deg)`;
      wheelFrame = window.requestAnimationFrame(orbitWheel);
    };

    if (!reduceMotion) {
      wheelFrame = window.requestAnimationFrame(orbitWheel);
    }

    const mobileMenu = page.querySelector('#mobileMenu');
    const hamburger = page.querySelector('#hamburger');
    const toggleMobileMenu = () => mobileMenu?.classList.toggle('open');
    hamburger?.addEventListener('click', toggleMobileMenu);

    const handlePageClick = (event) => {
      const link = event.target.closest('a');
      if (!link || !page.contains(link)) return;

      const route = getRouteForLink(link.textContent || '');
      if (!route) return;

      event.preventDefault();
      mobileMenu?.classList.remove('open');
      navigate(route);
    };

    page.addEventListener('click', handlePageClick);

    return () => {
      document.title = previousTitle;
      window.removeEventListener('resize', scheduleResizeStars);
      window.removeEventListener('scroll', updateNavbar);
      mobileHeroQuery.removeEventListener('change', placeRashiChart);
      hamburger?.removeEventListener('click', toggleMobileMenu);
      page.removeEventListener('click', handlePageClick);
      planetContainer?.replaceChildren();
      noteTimers.forEach((timer) => window.clearTimeout(timer));

      if (starFrame) {
        window.cancelAnimationFrame(starFrame);
      }

      if (resizeFrame) {
        window.cancelAnimationFrame(resizeFrame);
      }

      if (wheelFrame) {
        window.cancelAnimationFrame(wheelFrame);
      }
    };
  }, [navigate]);

  return (
    <div ref={pageRef} className="frontpage-shell">
      <div
        className="grain"
        dangerouslySetInnerHTML={{ __html: frontpageMarkup }}
      />
    </div>
  );
};

export default LandingPage;
