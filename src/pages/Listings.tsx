import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { useTracking } from '../hooks/useTracking';
import { MapPin, Filter, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

export const Listings = () => {
  const { trackEvent, sessionId } = useTracking();
  const [properties, setProperties] = useState<any[]>([]);
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [filter, setFilter] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    trackEvent('page_view', 'Listings');
    fetch('/api/properties')
      .then(res => res.json())
      .then(data => setProperties(data));
    
    // Fetch recommendations
    fetch(`/api/recommendations?sessionId=${sessionId}`)
      .then(res => res.json())
      .then(data => setRecommendations(data));
  }, [trackEvent, sessionId]);

  const filtered = properties.filter(p => {
    const matchesType = filter === 'All' || p.type === filter;
    const matchesSearch = p.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.location.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-luxury-900 pt-10 pb-24 px-4 max-w-7xl mx-auto">
      <div className="mb-12">
        <h1 className="text-4xl md:text-5xl font-serif mb-4">Exclusive Properties</h1>
        <p className="text-gray-400 max-w-2xl">Explore our curated collection of the world's finest real estate.</p>
      </div>

      {recommendations.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center gap-2 mb-6">
            <span className="w-1.5 h-1.5 rounded-full bg-gold-500"></span>
            <h2 className="text-xl font-serif">Recommended for you</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {recommendations.map((prop, i) => (
              <Link to={`/property/${prop.id}`} key={`rec-${prop.id}`}>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: i * 0.1 }}
                  className="group cursor-pointer bg-luxury-800/50 rounded-xl overflow-hidden border border-white/5 hover:border-gold-500/30 transition-all"
                >
                  <div className="relative h-40 overflow-hidden">
                    <img 
                      src={prop.image} 
                      alt={prop.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                      referrerPolicy="no-referrer"
                    />
                  </div>
                  <div className="p-4">
                    <h3 className="text-sm font-serif mb-1 group-hover:text-gold-500 transition-colors truncate">{prop.title}</h3>
                    <div className="flex justify-between items-center mt-2">
                      <span className="text-sm font-medium text-gold-500">{prop.price}</span>
                      <span className="text-[10px] text-gray-500 uppercase tracking-wider">{prop.type}</span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            ))}
          </div>
        </div>
      )}

      <div className="flex flex-col md:flex-row justify-between items-center mb-10 gap-4">
        <div className="flex gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0">
          {['All', 'Penthouse', 'Villa', 'Apartment'].map(type => (
            <button 
              key={type}
              onClick={() => setFilter(type)}
              className={`px-6 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${filter === type ? 'bg-gold-500 text-black' : 'bg-luxury-800 text-gray-300 hover:bg-luxury-700'}`}
            >
              {type}
            </button>
          ))}
        </div>
        <div className="relative w-full md:w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" size={16} />
          <input 
            type="text" 
            placeholder="Search location or title..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-luxury-800 border border-white/10 rounded-full pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-gold-500"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {filtered.map((prop, i) => (
          <Link to={`/property/${prop.id}`} key={prop.id}>
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="group cursor-pointer bg-luxury-800 rounded-2xl overflow-hidden border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="relative h-64 overflow-hidden">
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
              <div className="p-6">
                <h3 className="text-xl font-serif mb-2 group-hover:text-gold-500 transition-colors">{prop.title}</h3>
                <div className="flex items-center gap-2 text-gray-400 text-sm mb-4">
                  <MapPin size={14} /> {prop.location}
                </div>
                <div className="flex justify-between items-center pt-4 border-t border-white/5">
                  <span className="text-xl font-medium text-white">{prop.price}</span>
                  <div className="flex gap-3 text-xs text-gray-400 font-medium">
                    <span className="bg-luxury-900 px-2 py-1 rounded">{prop.beds} Beds</span>
                    <span className="bg-luxury-900 px-2 py-1 rounded">{prop.baths} Baths</span>
                  </div>
                </div>
              </div>
            </motion.div>
          </Link>
        ))}
      </div>
    </div>
  );
};
