import React, { useState } from 'react';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../services/firebaseService';

const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
    } catch (err: any) {
      setError('Login failed. Please check your email and password.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-10 p-8 bg-base-200 rounded-xl shadow-2xl border border-base-300 animate-fade-in">
      <h2 className="text-3xl font-bold text-center text-slate-100 mb-2">Admin Login</h2>
      <p className="text-center text-slate-400 mb-8">Access the administrative control panel</p>
      <form onSubmit={handleLogin}>
        <div className="mb-5">
          <label htmlFor="email" className="block text-slate-400 text-sm font-medium mb-2">Email</label>
          <input
            type="email"
            id="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            required
            placeholder="admin@example.com"
          />
        </div>
        <div className="mb-6">
          <label htmlFor="password" className="block text-slate-400 text-sm font-medium mb-2">Password</label>
          <input
            type="password"
            id="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-base-100 border border-base-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary transition-colors"
            required
            placeholder="••••••••"
          />
        </div>
        {error && <p className="text-error text-center mb-4 bg-error/10 p-3 rounded-lg">{error}</p>}
        <button
          type="submit"
          disabled={loading}
          className="w-full bg-primary hover:bg-blue-500 text-white font-bold py-3 px-4 rounded-lg transition-all duration-300 shadow-lg shadow-primary/20 hover:shadow-primary/40 disabled:bg-base-300 disabled:shadow-none transform hover:-translate-y-0.5"
        >
          {loading ? (
            <div className="flex justify-center items-center">
              <div className="animate-spin rounded-full h-5 w-5 border-t-2 border-b-2 border-white"></div>
              <span className="ml-2">Logging in...</span>
            </div>
          ) : 'Login'}
        </button>
      </form>
    </div>
  );
};

export default Login;