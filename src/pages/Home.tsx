import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTracking } from '../hooks/useTracking';
import { LeadForm } from '../components/LeadForm';
import { Building, MapPin, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Home = () => {
  const { trackEvent } = useTracking();
  const [properties, setProperties] = useState<any[]>([]);

  useEffect(() => {
    trackEvent('page_view', 'Home');
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => setProperties(data));
  }, [trackEvent]);

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img 
            src="https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?ixlib=rb-4.0.3&auto=format&fit=crop&w=2000&q=80" 
            alt="Luxury Real Estate" 
            className="w-full h-full object-cover opacity-40"
            referrerPolicy="no-referrer"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-luxury-900/50 via-luxury-900/20 to-luxury-900"></div>
        </div>
        
        <div className="relative z-10 text-center px-4 max-w-5xl mx-auto mt-20">
          <motion.h1 
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1 }}
            className="text-5xl md:text-7xl font-serif mb-6 leading-tight"
          >
            Discover Exceptional <br/>
            <span className="text-gold-500 italic">Living Spaces</span>
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 1, delay: 0.3 }}
            className="text-lg md:text-xl text-gray-300 mb-10 max-w-2xl mx-auto font-light"
          >
            Curated luxury properties in the world's most exclusive destinations.
          </motion.p>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1, delay: 0.6 }}
          >
            <Link to="/listings" className="inline-flex items-center gap-2 bg-white text-black px-8 py-4 rounded-full hover:bg-gold-500 transition-colors font-medium">
              View Collection <ArrowRight size={18} />
            </Link>
          </motion.div>
        </div>
      </section>

      {/* Featured Properties */}
      <section className="py-24 px-4 max-w-7xl mx-auto">
        <div className="flex justify-between items-end mb-12">
          <div>
            <h2 className="text-3xl md:text-4xl font-serif mb-2">Featured Collection</h2>
            <p className="text-gray-400">Exclusive properties handpicked for you.</p>
          </div>
          <Link to="/listings" className="hidden md:flex items-center gap-2 text-gold-500 hover:text-gold-600 transition-colors">
            View All <ArrowRight size={16} />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {properties.filter(p => p.featured).map((prop, i) => (
            <Link to={`/property/${prop.id}`} key={prop.id}>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="group cursor-pointer"
              >
                <div className="relative h-80 overflow-hidden rounded-2xl mb-4">
                  <img 
                    src={prop.image} 
                    alt={prop.title} 
                    className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute top-4 left-4 bg-black/50 backdrop-blur-md px-3 py-1 rounded-full text-xs font-medium border border-white/10">
                    {prop.type}
                  </div>
                </div>
                <h3 className="text-xl font-serif mb-2 group-hover:text-gold-500 transition-colors">{prop.title}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-3">
                  <MapPin size={14} /> {prop.location}
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-lg font-medium">{prop.price}</span>
                  <div className="flex gap-4 text-sm text-gray-400">
                    <span>{prop.beds} Beds</span>
                    <span>{prop.baths} Baths</span>
                  </div>
                </div>
              </motion.div>
            </Link>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-24 px-4 max-w-7xl mx-auto border-t border-white/5">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-serif mb-4">Why Choose PillarstoHome</h2>
          <p className="text-gray-400 max-w-2xl mx-auto">We redefine luxury real estate through technology, expertise, and personalized service.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {[
            { title: "AI-Powered Insights", desc: "Our advanced AI concierge helps qualify your needs and provides personalized property recommendations in real-time." },
            { title: "Exclusive Inventory", desc: "Gain access to off-market listings and premium developments before they hit the general market." },
            { title: "Global Network", desc: "With experts in London, Dubai, and Mumbai, we provide a truly international perspective on luxury investments." }
          ].map((item, i) => (
            <motion.div 
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-8 bg-luxury-800/50 rounded-3xl border border-white/5 hover:border-gold-500/30 transition-all group"
            >
              <div className="w-12 h-12 bg-gold-500/10 rounded-2xl flex items-center justify-center mb-6 group-hover:bg-gold-500 transition-colors">
                <div className="w-2 h-2 bg-gold-500 rounded-full group-hover:bg-black"></div>
              </div>
              <h3 className="text-xl font-serif mb-4">{item.title}</h3>
              <p className="text-gray-400 text-sm leading-relaxed">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Lead Capture Section */}
      <section className="py-24 bg-luxury-800 border-y border-white/5 relative overflow-hidden">
        <div className="absolute right-0 top-0 w-1/2 h-full opacity-10 pointer-events-none">
           <Building size={400} className="absolute -right-20 -top-20 text-gold-500" />
        </div>
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-4xl font-serif mb-6">Let us find your dream home.</h2>
            <p className="text-gray-400 mb-8 text-lg font-light leading-relaxed">
              Our dedicated team of luxury real estate experts is ready to assist you in finding the perfect property that matches your lifestyle and investment goals.
            </p>
            <ul className="space-y-4 text-gray-300">
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div> Off-market opportunities</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div> Personalized property tours</li>
              <li className="flex items-center gap-3"><div className="w-1.5 h-1.5 rounded-full bg-gold-500"></div> Expert negotiation</li>
            </ul>
          </div>
          <div>
            <LeadForm source="Home Page Bottom" />
          </div>
        </div>
      </section>
    </div>
  );
};
