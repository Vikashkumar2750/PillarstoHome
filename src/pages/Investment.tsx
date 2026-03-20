import React, { useEffect } from 'react';
import { useTracking } from '../hooks/useTracking';
import { LeadForm } from '../components/LeadForm';
import { TrendingUp, PieChart, Landmark } from 'lucide-react';

export const Investment = () => {
  const { trackEvent } = useTracking();

  useEffect(() => {
    trackEvent('page_view', 'Investment & NRI');
  }, [trackEvent]);

  return (
    <div className="min-h-screen bg-luxury-900 pt-20 pb-24">
      <div className="max-w-7xl mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center mb-20">
          <div>
            <div className="inline-block bg-gold-500/10 text-gold-500 px-4 py-1 rounded-full text-sm font-medium mb-6 border border-gold-500/20">
              NRI & Foreign Investment
            </div>
            <h1 className="text-4xl md:text-6xl font-serif text-white mb-6 leading-tight">
              Secure Your Wealth in Premium Real Estate
            </h1>
            <p className="text-lg text-gray-400 font-light leading-relaxed mb-8">
              We offer end-to-end investment advisory for Non-Resident Indians and global investors looking to capitalize on high-yield luxury real estate markets in Dubai and India.
            </p>
            <div className="space-y-6">
              <div className="flex gap-4">
                <div className="mt-1 text-gold-500"><TrendingUp /></div>
                <div>
                  <h3 className="text-white font-medium text-lg">High ROI Potential</h3>
                  <p className="text-gray-400 text-sm">Historically, our curated projects yield 8-12% annual capital appreciation.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 text-gold-500"><Landmark /></div>
                <div>
                  <h3 className="text-white font-medium text-lg">Tax Advisory & Compliance</h3>
                  <p className="text-gray-400 text-sm">Complete legal and tax structuring assistance for cross-border investments.</p>
                </div>
              </div>
              <div className="flex gap-4">
                <div className="mt-1 text-gold-500"><PieChart /></div>
                <div>
                  <h3 className="text-white font-medium text-lg">Portfolio Management</h3>
                  <p className="text-gray-400 text-sm">Post-purchase property management and rental yield optimization.</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="relative">
            <div className="absolute -inset-4 bg-gradient-to-r from-gold-500/20 to-purple-500/20 blur-2xl rounded-full opacity-50"></div>
            <LeadForm source="Investment Page" />
          </div>
        </div>

        {/* Market Insights Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-serif text-white mb-12 text-center">2026 Market Insights</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {[
              { city: 'Dubai', yield: '7.5%', growth: '+12%', trend: 'Bullish' },
              { city: 'London', yield: '4.2%', growth: '+5%', trend: 'Stable' },
              { city: 'Mumbai', yield: '3.8%', growth: '+15%', trend: 'High Growth' }
            ].map((insight, i) => (
              <div key={i} className="bg-luxury-800 border border-white/5 p-8 rounded-2xl hover:border-gold-500/30 transition-colors">
                <h3 className="text-2xl font-serif text-white mb-4">{insight.city}</h3>
                <div className="space-y-4">
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Rental Yield</span>
                    <span className="text-gold-500 font-medium">{insight.yield}</span>
                  </div>
                  <div className="flex justify-between border-b border-white/5 pb-2">
                    <span className="text-gray-400">Capital Growth</span>
                    <span className="text-green-500 font-medium">{insight.growth}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-400">Market Sentiment</span>
                    <span className="text-white font-medium">{insight.trend}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Investment Philosophy */}
        <div className="bg-luxury-800 rounded-3xl p-12 border border-white/5 relative overflow-hidden text-center">
          <div className="relative z-10 max-w-3xl mx-auto">
            <h2 className="text-3xl font-serif text-white mb-6">Our Investment Philosophy</h2>
            <p className="text-gray-400 font-light leading-relaxed mb-8">
              We don't just sell properties; we curate wealth-building opportunities. Our selection process involves rigorous due diligence on developer track records, location infrastructure growth, and historical secondary market performance.
            </p>
            <div className="flex flex-wrap justify-center gap-8">
              <div className="text-center">
                <p className="text-3xl font-serif text-gold-500">$2.4B+</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Assets Managed</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-serif text-gold-500">14%</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Avg. Annual Return</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-serif text-gold-500">12</p>
                <p className="text-xs text-gray-500 uppercase tracking-widest mt-1">Global Markets</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
