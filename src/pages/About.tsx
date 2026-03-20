import React, { useEffect } from 'react';
import { useTracking } from '../hooks/useTracking';
import { motion } from 'framer-motion';
import { Shield, Globe, Award } from 'lucide-react';

export const About = () => {
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent('page_view', 'About');
  }, [trackEvent]);

  return (
    <div className="min-h-screen bg-luxury-900 pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="text-center max-w-3xl mx-auto mb-20">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-6xl font-serif text-white mb-6"
          >
            Redefining Luxury Real Estate
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-lg text-gray-400 font-light leading-relaxed"
          >
            PillarstoHome Real Estate is a premier boutique brokerage specializing in the world's most exclusive properties. We provide unparalleled service, discretion, and expertise to ultra-high-net-worth individuals globally.
          </motion.p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-12 mb-24">
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-luxury-800 rounded-full flex items-center justify-center text-gold-500 mb-6">
              <Globe size={32} />
            </div>
            <h3 className="text-xl font-serif text-white mb-3">Global Reach</h3>
            <p className="text-gray-400 font-light">Access to off-market properties in London, Dubai, New York, and Mumbai.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-luxury-800 rounded-full flex items-center justify-center text-gold-500 mb-6">
              <Shield size={32} />
            </div>
            <h3 className="text-xl font-serif text-white mb-3">Absolute Discretion</h3>
            <p className="text-gray-400 font-light">We protect our clients' privacy with military-grade confidentiality agreements.</p>
          </div>
          <div className="text-center">
            <div className="w-16 h-16 mx-auto bg-luxury-800 rounded-full flex items-center justify-center text-gold-500 mb-6">
              <Award size={32} />
            </div>
            <h3 className="text-xl font-serif text-white mb-3">Award-Winning</h3>
            <p className="text-gray-400 font-light">Recognized as the leading luxury brokerage in the Middle East and Asia.</p>
          </div>
        </div>

        <div className="relative h-[500px] rounded-3xl overflow-hidden">
          <img 
            src="https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Luxury Interior" 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
            <div className="text-center">
              <p className="text-gold-500 font-medium tracking-widest uppercase mb-2">Our Vision</p>
              <h2 className="text-3xl md:text-5xl font-serif text-white max-w-2xl mx-auto leading-tight">
                "To curate the world's finest living experiences for those who demand nothing but the best."
              </h2>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
