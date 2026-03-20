import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Download, Star } from 'lucide-react';
import { useTracking } from '../hooks/useTracking';

export const ExitIntentPopup = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [hasShown, setHasShown] = useState(false);
  const [formData, setFormData] = useState({ email: '', name: '' });
  const [submitted, setSubmitted] = useState(false);
  const { submitFullLead, trackEvent } = useTracking();

  useEffect(() => {
    const handleMouseLeave = (e: MouseEvent) => {
      if (e.clientY <= 0 && !hasShown) {
        setIsVisible(true);
        setHasShown(true);
        trackEvent('exit_intent_trigger', window.location.pathname);
      }
    };

    document.addEventListener('mouseleave', handleMouseLeave);
    return () => document.removeEventListener('mouseleave', handleMouseLeave);
  }, [hasShown, trackEvent]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitFullLead({ ...formData, phone: 'N/A', source: 'Exit Intent Popup' });
    setSubmitted(true);
    setTimeout(() => setIsVisible(false), 3000);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative w-full max-w-2xl bg-luxury-900 border border-gold-500/30 rounded-3xl overflow-hidden shadow-[0_0_50px_rgba(212,175,55,0.15)]"
          >
            <button 
              onClick={() => setIsVisible(false)}
              className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors z-10"
            >
              <X size={24} />
            </button>

            <div className="grid grid-cols-1 md:grid-cols-2">
              <div className="relative h-64 md:h-auto overflow-hidden">
                <img 
                  src="https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Luxury Guide"
                  className="w-full h-full object-cover"
                  referrerPolicy="no-referrer"
                />
                <div className="absolute inset-0 bg-gradient-to-r from-luxury-900 via-transparent to-transparent md:bg-gradient-to-b"></div>
              </div>

              <div className="p-8 md:p-12 flex flex-col justify-center">
                {!submitted ? (
                  <>
                    <div className="flex items-center gap-2 text-gold-500 mb-4">
                      <Star size={16} fill="currentColor" />
                      <span className="text-xs font-medium uppercase tracking-widest">Exclusive Access</span>
                    </div>
                    <h2 className="text-3xl font-serif text-white mb-4 leading-tight">
                      Don't Leave Without Your <span className="text-gold-500">Investment Guide</span>
                    </h2>
                    <p className="text-gray-400 text-sm mb-8 leading-relaxed">
                      Download our 2026 Luxury Real Estate Market Report. Insights on high-yield properties in Dubai & London.
                    </p>
                    <form onSubmit={handleSubmit} className="space-y-4">
                      <input 
                        type="text"
                        required
                        placeholder="Your Name"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                      />
                      <input 
                        type="email"
                        required
                        placeholder="Email Address"
                        className="w-full bg-black border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-gold-500 transition-colors"
                        value={formData.email}
                        onChange={e => setFormData({...formData, email: e.target.value})}
                      />
                      <button 
                        type="submit"
                        className="w-full bg-gold-500 hover:bg-gold-600 text-black font-medium py-3 rounded-xl transition-all transform hover:scale-[1.02] active:scale-95 flex items-center justify-center gap-2"
                      >
                        <Download size={18} /> Get Free Guide
                      </button>
                    </form>
                  </>
                ) : (
                  <motion.div 
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-8"
                  >
                    <div className="w-16 h-16 bg-gold-500/20 rounded-full flex items-center justify-center mx-auto mb-6">
                      <Download className="text-gold-500" size={32} />
                    </div>
                    <h3 className="text-2xl font-serif text-white mb-2">Guide Sent!</h3>
                    <p className="text-gray-400 text-sm">Check your inbox for the 2026 Market Report.</p>
                  </motion.div>
                )}
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
