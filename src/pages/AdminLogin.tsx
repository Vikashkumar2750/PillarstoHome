import React, { useState } from 'react';
import { Shield, Lock, ArrowRight } from 'lucide-react';

export const AdminLogin = ({ onLogin }: { onLogin: () => void }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, password })
      });
      
      if (res.ok) {
        const data = await res.json();
        localStorage.setItem('admin_token', data.token);
        localStorage.setItem('admin_role', data.role);
        onLogin();
      } else {
        setError('Invalid credentials. Try admin/admin123 or agent/agent123');
      }
    } catch (err) {
      setError('Server error. Please try again.');
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] flex items-center justify-center px-4 relative overflow-hidden">
      {/* Background Elements */}
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-gold-500/10 rounded-full blur-3xl pointer-events-none"></div>
      <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none"></div>

      <div className="w-full max-w-md bg-[#111] border border-white/10 p-8 rounded-2xl shadow-2xl relative z-10">
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-luxury-800 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/5">
            <Shield className="text-gold-500" size={32} />
          </div>
          <h1 className="text-2xl font-serif text-white">PillarstoHome Secure Portal</h1>
          <p className="text-gray-400 text-sm mt-2">Authorized Personnel Only</p>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm p-3 rounded-lg mb-6 text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Username</label>
            <input 
              type="text" 
              required
              value={username}
              onChange={e => setUsername(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
              placeholder="Enter username"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-1.5">Password</label>
            <div className="relative">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
              <input 
                type="password" 
                required
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full bg-black border border-white/10 rounded-lg pl-11 pr-4 py-3 text-white focus:outline-none focus:border-gold-500 transition-colors"
                placeholder="••••••••"
              />
            </div>
          </div>
          <button 
            type="submit"
            className="w-full bg-gold-500 hover:bg-gold-600 text-black font-medium py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-2"
          >
            Access Dashboard <ArrowRight size={18} />
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-xs text-gray-600">Protected by 256-bit encryption</p>
        </div>
      </div>
    </div>
  );
};
