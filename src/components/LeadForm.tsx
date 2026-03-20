import React, { useState, useEffect } from 'react';
import { useTracking } from '../hooks/useTracking';
import { motion } from 'framer-motion';
import { X } from 'lucide-react';

export const LeadForm = ({ source = "Website", onClose }: { source?: string, onClose?: () => void }) => {
  const { capturePartialLead, submitFullLead } = useTracking();
  const [formData, setFormData] = useState({ name: '', email: '', phone: '', budget: '', intent: '' });
  const [submitted, setSubmitted] = useState(false);

  // Debounce partial capture
  useEffect(() => {
    const timer = setTimeout(() => {
      if (formData.name || formData.email || formData.phone || formData.budget || formData.intent) {
        capturePartialLead({ ...formData, source });
      }
    }, 1000);
    return () => clearTimeout(timer);
  }, [formData, capturePartialLead, source]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await submitFullLead({ ...formData, source });
    setSubmitted(true);
    setTimeout(() => {
      if (onClose) onClose();
    }, 2000);
  };

  if (submitted) {
    return (
      <div className="p-8 text-center bg-luxury-800 border border-white/10 rounded-2xl">
        <h3 className="text-2xl font-serif text-gold-500 mb-2">Thank You</h3>
        <p className="text-gray-400">Our luxury property consultant will contact you shortly.</p>
      </div>
    );
  }

  return (
    <div className="relative bg-luxury-800 border border-white/10 p-8 rounded-2xl shadow-2xl">
      {onClose && (
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
      )}
      <h3 className="text-2xl font-serif text-white mb-6">Inquire Now</h3>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Full Name</label>
            <input
              type="text"
              required
              className="w-full bg-luxury-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Email Address</label>
            <input
              type="email"
              required
              className="w-full bg-luxury-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              value={formData.email}
              onChange={e => setFormData({ ...formData, email: e.target.value })}
            />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm text-gray-400 mb-1">Phone Number</label>
            <input
              type="tel"
              required
              className="w-full bg-luxury-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              value={formData.phone}
              onChange={e => setFormData({ ...formData, phone: e.target.value })}
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1">Budget Range</label>
            <select
              required
              className="w-full bg-luxury-900 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors appearance-none"
              value={formData.budget}
              onChange={e => setFormData({ ...formData, budget: e.target.value })}
            >
              <option value="">Select Budget</option>
              <option value="$1M - $3M">$1M - $3M</option>
              <option value="$3M - $10M">$3M - $10M</option>
              <option value="$10M+">$10M+</option>
            </select>
          </div>
        </div>
        <div>
          <label className="block text-sm text-gray-400 mb-1">Investment Intent</label>
          <div className="flex gap-4">
            {['Self-use', 'Investment'].map(intent => (
              <button
                key={intent}
                type="button"
                onClick={() => setFormData({ ...formData, intent })}
                className={`flex-1 py-3 rounded-lg border transition-all ${formData.intent === intent ? 'bg-gold-500 border-gold-500 text-black' : 'bg-luxury-900 border-white/10 text-gray-400 hover:border-gold-500/50'}`}
              >
                {intent}
              </button>
            ))}
          </div>
        </div>
        <button
          type="submit"
          className="w-full bg-gold-500 hover:bg-gold-600 text-black font-medium py-3 rounded-lg transition-colors mt-4"
        >
          Request Details
        </button>
      </form>
      <p className="text-xs text-gray-500 mt-4 text-center">
        By submitting, you agree to our privacy policy.
      </p>
    </div>
  );
};
