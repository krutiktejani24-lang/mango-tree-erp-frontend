import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { toast } from 'react-toastify';
import { TreePalm, Eye, EyeOff } from 'lucide-react';

export default function Login() {
  const { login, loading } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPw, setShowPw] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    const res = await login(email, password);
    if (res.success) {
      toast.success('Welcome back!');
      navigate('/');
    } else {
      toast.error(res.message);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-obsidian px-4">
      <div className="w-full max-w-sm">
        <div className="flex flex-col items-center mb-8">
          <div className="w-14 h-14 rounded-2xl bg-forest flex items-center justify-center mb-3">
              <img src="/logo/logo.jpeg" alt="Mango Tree Resort ERP" className="w-14 h-14 object-contain"/>
          </div>
          <h1 className="font-serif text-2xl text-white font-bold">Mango Tree Resort</h1>
          <p className="text-gold/80 text-xs tracking-widest uppercase mt-1">Billing & Management System</p>
        </div>

        <form onSubmit={handleSubmit} className="card bg-white/5 backdrop-blur border-white/10 space-y-4">
          <div>
            <label className="label text-white/70">Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="input bg-white/10 border-white/20 text-white placeholder:text-white/30"
              placeholder="owner@mangotreeresorts.com"
            />
          </div>
          <div>
            <label className="label text-white/70">Password</label>
            <div className="relative">
              <input
                type={showPw ? 'text' : 'password'}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input bg-white/10 border-white/20 text-white placeholder:text-white/30 pr-10"
                placeholder="••••••••"
              />
              <button
                type="button"
                onClick={() => setShowPw((s) => !s)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-white/50"
              >
                {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="btn-primary w-full mt-2">
            {loading ? 'Signing in…' : 'Sign In'}
          </button>
        </form>
      </div>
    </div>
  );
}
