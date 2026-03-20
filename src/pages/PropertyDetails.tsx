import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { useTracking } from '../hooks/useTracking';
import { LeadForm } from '../components/LeadForm';
import { MapPin, Bed, Bath, Square, Play, Check } from 'lucide-react';
import { motion } from 'framer-motion';

export const PropertyDetails = () => {
  const { id } = useParams();
  const { trackEvent } = useTracking();
  const [property, setProperty] = useState<any>(null);

  useEffect(() => {
    if (id) {
      trackEvent('page_view', `Property Details - ${id}`);
      fetch(`/api/properties/${id}`)
        .then(res => res.json())
        .then(data => setProperty(data));
    }
  }, [id, trackEvent]);

  if (!property) return <div className="min-h-screen flex items-center justify-center text-white">Loading...</div>;

  return (
    <div className="min-h-screen bg-luxury-900 pb-24">
      {/* Hero Image */}
      <div className="relative h-[60vh] w-full">
        <img 
          src={property.image} 
          alt={property.title} 
          className="w-full h-full object-cover"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-luxury-900 via-transparent to-transparent"></div>
        <div className="absolute bottom-0 left-0 w-full p-8 max-w-7xl mx-auto">
          <div className="inline-block bg-gold-500 text-black px-4 py-1 rounded-full text-sm font-medium mb-4">
            {property.type}
          </div>
          <h1 className="text-4xl md:text-6xl font-serif text-white mb-2">{property.title}</h1>
          <div className="flex items-center gap-2 text-gray-300 text-lg">
            <MapPin size={18} /> {property.location}
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 mt-12 grid grid-cols-1 lg:grid-cols-3 gap-12">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-12">
          {/* Key Stats */}
          <div className="flex flex-wrap gap-8 py-6 border-y border-white/10">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-luxury-800 rounded-full text-gold-500"><Bed size={24} /></div>
              <div>
                <p className="text-sm text-gray-400">Bedrooms</p>
                <p className="text-xl font-medium text-white">{property.beds}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-luxury-800 rounded-full text-gold-500"><Bath size={24} /></div>
              <div>
                <p className="text-sm text-gray-400">Bathrooms</p>
                <p className="text-xl font-medium text-white">{property.baths}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <div className="p-3 bg-luxury-800 rounded-full text-gold-500"><Square size={24} /></div>
              <div>
                <p className="text-sm text-gray-400">Square Feet</p>
                <p className="text-xl font-medium text-white">{property.sqft}</p>
              </div>
            </div>
          </div>

          {/* Description */}
          <div>
            <h2 className="text-2xl font-serif text-white mb-4">About this Property</h2>
            <p className="text-gray-300 leading-relaxed font-light">
              Experience the pinnacle of luxury living in this exquisite {property.type.toLowerCase()}. 
              Located in the prestigious {property.location}, this residence offers unparalleled views, 
              bespoke finishes, and world-class amenities. Every detail has been meticulously crafted 
              to provide an extraordinary lifestyle for the most discerning buyer.
            </p>
          </div>

          {/* Amenities */}
          <div>
            <h2 className="text-2xl font-serif text-white mb-4">Premium Amenities</h2>
            <div className="grid grid-cols-2 gap-4">
              {['Smart Home Automation', 'Private Pool', '24/7 Concierge', 'Wine Cellar', 'Home Theater', 'Spa & Wellness Center'].map((amenity, i) => (
                <div key={i} className="flex items-center gap-3 text-gray-300">
                  <Check size={18} className="text-gold-500" /> {amenity}
                </div>
              ))}
            </div>
          </div>

          {/* Virtual Tour Placeholder */}
          <div>
            <h2 className="text-2xl font-serif text-white mb-4">Virtual Tour</h2>
            <div className="relative w-full h-80 bg-luxury-800 rounded-2xl flex items-center justify-center border border-white/10 group cursor-pointer">
              <img src={property.image} className="absolute inset-0 w-full h-full object-cover opacity-40 rounded-2xl" alt="Tour" />
              <div className="relative z-10 w-16 h-16 bg-gold-500 rounded-full flex items-center justify-center text-black group-hover:scale-110 transition-transform">
                <Play fill="currentColor" size={24} className="ml-1" />
              </div>
            </div>
          </div>

          {/* Location Map */}
          <div>
            <h2 className="text-2xl font-serif text-white mb-4">Location</h2>
            <div className="w-full h-80 bg-luxury-800 rounded-2xl overflow-hidden border border-white/10">
              <iframe
                width="100%"
                height="100%"
                frameBorder="0"
                style={{ border: 0, filter: 'invert(90%) hue-rotate(180deg) contrast(100%)' }}
                src={`https://maps.google.com/maps?q=${encodeURIComponent(property.location)}&t=m&z=14&output=embed&iwloc=near`}
                allowFullScreen
                title="Property Location"
              ></iframe>
            </div>
            <p className="text-sm text-gray-500 mt-3 flex items-center gap-2">
              <MapPin size={14} /> {property.location}
            </p>
          </div>
        </div>

        {/* Sidebar / Lead Form */}
        <div className="lg:col-span-1">
          <div className="sticky top-24">
            <div className="bg-luxury-800 border border-white/10 rounded-2xl p-6 mb-8">
              <p className="text-gray-400 text-sm mb-1">Asking Price</p>
              <p className="text-4xl font-serif text-white">{property.price}</p>
            </div>
            <LeadForm source={`Property Inquiry: ${property.title}`} />
          </div>
        </div>
      </div>
    </div>
  );
};
