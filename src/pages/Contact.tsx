import React, { useEffect } from 'react';
import { useTracking } from '../hooks/useTracking';
import { LeadForm } from '../components/LeadForm';
import { MapPin, Phone, Mail } from 'lucide-react';

export const Contact = () => {
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent('page_view', 'Contact');
  }, [trackEvent]);

  return (
    <div className="min-h-screen bg-luxury-900 pt-10 pb-24 px-4 max-w-7xl mx-auto">
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-16">
        <div>
          <h1 className="text-4xl md:text-5xl font-serif mb-6">Get in Touch</h1>
          <p className="text-gray-400 mb-12 text-lg font-light">
            Whether you are looking to buy, sell, or invest in luxury real estate, our team of experts is here to provide unparalleled service.
          </p>

          <div className="space-y-8">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-luxury-800 flex items-center justify-center text-gold-500 shrink-0">
                <MapPin size={20} />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Global Headquarters</h3>
                <p className="text-gray-400">Level 42, The Opus Tower<br/>Business Bay, Dubai, UAE</p>
              </div>
            </div>
            
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-luxury-800 flex items-center justify-center text-gold-500 shrink-0">
                <Phone size={20} />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Phone</h3>
                <p className="text-gray-400">+971 4 123 4567<br/>+44 20 7123 4567</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-full bg-luxury-800 flex items-center justify-center text-gold-500 shrink-0">
                <Mail size={20} />
              </div>
              <div>
                <h3 className="text-lg font-medium mb-1">Email</h3>
                <p className="text-gray-400">concierge@pillarstohome.com<br/>investments@pillarstohome.com</p>
              </div>
            </div>
          </div>
        </div>

        <div>
          <LeadForm source="Contact Page" />
        </div>
      </div>
    </div>
  );
};
