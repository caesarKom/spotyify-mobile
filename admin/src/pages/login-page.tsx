import { useState } from "react";
import { API_URL } from "../config/api";
import useAuthStore from "../state/storage";
import { Eye, EyeOff, Shield } from "lucide-react";

const LoginPage = () => {
  const { setTokens, setUser } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [loginForm, setLoginForm] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) {
      setError('Email and password are required');
      return;
    }
    
    setLoading(true);
    setError('');
    
    try {
      const res = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(loginForm)
      });
      
      const data = await res.json();
      //TODO set role
      if (data.success) {
        setTokens(data.tokens.access_token, data.tokens.refresh_token);
        setUser(data.user);
      } else {
        setError(data.message || 'Login failed');
      }
    } catch (error) {
      setError('Connection error. Please try again.');
      console.log(error)
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-linear-to-br from-purple-900 via-indigo-900 to-blue-900 flex items-center justify-center p-4">
      <div className="bg-white/10 backdrop-blur-md rounded-2xl p-8 w-full max-w-md shadow-2xl border border-white/20">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-linear-to-br from-purple-400 to-indigo-500 rounded-full mb-4">
            <Shield className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">Secure Admin Panel</h1>
          <p className="text-purple-200">Spotify Clone Management</p>
        </div>
        
        {error && (
          <div className="bg-red-500/20 border border-red-500/50 text-red-200 px-4 py-3 rounded-lg mb-4">
            {error}
          </div>
        )}
        
        <div className="space-y-4">
          <div>
            <label className="block text-purple-200 mb-2 font-medium">Email</label>
            <input
              type="email"
              className="w-full bg-white/20 border border-purple-300/30 rounded-lg px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent"
              placeholder="admin@example.com"
              value={loginForm.email}
              onChange={(e) => setLoginForm({...loginForm, email: e.target.value})}
              onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
            />
          </div>
          <div>
            <label className="block text-purple-200 mb-2 font-medium">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                className="w-full bg-white/20 border border-purple-300/30 rounded-lg px-4 py-3 text-white placeholder-purple-300/50 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:border-transparent pr-12"
                placeholder="••••••••"
                value={loginForm.password}
                onChange={(e) => setLoginForm({...loginForm, password: e.target.value})}
                onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-purple-300 hover:text-white transition"
              >
                {showPassword ? <EyeOff size={20} /> : <Eye size={20} />}
              </button>
            </div>
          </div>
          <button
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-linear-to-r from-purple-500 to-indigo-600 text-white py-3 rounded-lg font-semibold hover:from-purple-600 hover:to-indigo-700 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                Logging in...
              </span>
            ) : (
              'Login'
            )}
          </button>
        </div>
        
        <div className="mt-6 text-center text-purple-200 text-sm">
          <Shield className="inline-block w-4 h-4 mr-1" />
          Protected with secure token management
        </div>
      </div>
    </div>
  );
};

export default LoginPage