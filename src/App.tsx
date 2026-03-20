import React, { useEffect, useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { Home } from './pages/Home';
import { Listings } from './pages/Listings';
import { PropertyDetails } from './pages/PropertyDetails';
import { Contact } from './pages/Contact';
import { About } from './pages/About';
import { Investment } from './pages/Investment';
import { AdminDashboard } from './pages/AdminDashboard';
import { AdminLogin } from './pages/AdminLogin';
import { Chatbot } from './components/Chatbot';
import { ExitIntentPopup } from './components/ExitIntentPopup';
import { useTracking } from './hooks/useTracking';

// Scroll tracking component
const ScrollTracker = () => {
  const { trackEvent } = useTracking();
  const location = useLocation();

  useEffect(() => {
    let maxScroll = 0;
    const handleScroll = () => {
      const scrollPercent = Math.round((window.scrollY / (document.documentElement.scrollHeight - window.innerHeight)) * 100);
      if (scrollPercent > maxScroll && scrollPercent % 25 === 0) { // Track every 25%
        maxScroll = scrollPercent;
        trackEvent('scroll_depth', location.pathname, { depth: scrollPercent });
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [location, trackEvent]);

  return null;
};

const ProtectedAdmin = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(!!localStorage.getItem('admin_token'));
  
  if (!isAuthenticated) {
    return <AdminLogin onLogin={() => setIsAuthenticated(true)} />;
  }
  
  return <AdminDashboard />;
};

const Navbar = () => {
  return (
    <nav className="fixed top-0 w-full z-50 bg-luxury-900/80 backdrop-blur-md border-b border-white/5">
      <div className="max-w-7xl mx-auto px-4 h-20 flex items-center justify-between">
        <Link to="/" className="text-2xl font-serif tracking-widest text-white">
          Pillarsto<span className="text-gold-500">Home</span>
        </Link>
        <div className="hidden md:flex gap-8 text-sm font-medium text-gray-300">
          <Link to="/" className="hover:text-gold-500 transition-colors">Home</Link>
          <Link to="/listings" className="hover:text-gold-500 transition-colors">Properties</Link>
          <Link to="/investment" className="hover:text-gold-500 transition-colors">Investment</Link>
          <Link to="/about" className="hover:text-gold-500 transition-colors">About</Link>
          <Link to="/contact" className="hover:text-gold-500 transition-colors">Contact</Link>
        </div>
        <div className="flex items-center gap-4">
          <Link to="/admin" className="text-xs text-gray-500 hover:text-white transition-colors">Admin</Link>
          <Link to="/contact" className="bg-white text-black px-5 py-2 rounded-full text-sm font-medium hover:bg-gold-500 transition-colors">
            Inquire
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default function App() {
  return (
    <Router>
      <ScrollTracker />
      <Routes>
        <Route path="/admin" element={<ProtectedAdmin />} />
        <Route path="*" element={
          <>
            <Navbar />
            <main className="pt-20">
              <Routes>
                <Route path="/" element={<Home />} />
                <Route path="/listings" element={<Listings />} />
                <Route path="/property/:id" element={<PropertyDetails />} />
                <Route path="/about" element={<About />} />
                <Route path="/investment" element={<Investment />} />
                <Route path="/contact" element={<Contact />} />
                {/* Fallback for other routes */}
                <Route path="*" element={<div className="min-h-screen flex items-center justify-center text-gray-500">Page under construction</div>} />
              </Routes>
            </main>
            <Chatbot />
            <ExitIntentPopup />
            <footer className="bg-black py-12 border-t border-white/5 text-center text-gray-500 text-sm">
              <p>&copy; 2026 PillarstoHome Real Estate. All rights reserved.</p>
            </footer>
          </>
        } />
      </Routes>
    </Router>
  );
}
